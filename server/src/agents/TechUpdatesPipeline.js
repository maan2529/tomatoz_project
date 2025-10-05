import { tavily } from "@tavily/core";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { pipelineConfig, apiConfig } from "../config/pipeline.js";
import { getPreferredDomains, isOfficialSource } from "../config/domains.js";
import { Blog } from "../models/blog.model.js";
import env from "../config/index.js";
import { chromium } from "playwright";
import TurndownService from "turndown";
import { START, END, StateGraph, Annotation } from "@langchain/langgraph";
import { HumanMessage } from "@langchain/core/messages";
import crypto from 'crypto';

export class TechUpdatesPipeline {
  constructor(config = {}) {
    this.config = { ...pipelineConfig, ...config };
    this.tavily = tavily({ apiKey: config.tavilyApiKey || env.TAVILY_API_KEY });
    this.model = new ChatGoogleGenerativeAI({
      model: apiConfig.gemini.model || "gemini-1.5-flash",
      apiKey: config.geminiApiKey || env.GEMINI_API_KEY,
      temperature: 0.3,
    });
    this.memory = [];
    this.turndownService = new TurndownService({
      headingStyle: "atx",
      codeBlockStyle: "fenced",
    });

    this.turndownService.remove(['script', 'style', 'noscript', 'iframe']);
  }

  generateContentHash(content) {
    return crypto
      .createHash('sha256')
      .update(content.trim())
      .digest('hex')
      .substring(0, 16);
  }

  async checkExistingContent(url, contentHash) {
    try {
      const existingByUrl = await Blog.findOne({ originalUrl: url });

      if (existingByUrl) {
        console.log(`📌 Found existing blog for URL: ${url}`);

        const existingHash = this.generateContentHash(existingByUrl.markdown || '');

        if (existingHash === contentHash) {
          console.log(`✓ Content unchanged - skipping`);
          return { exists: true, changed: false, blog: existingByUrl };
        } else {
          console.log(`🔄 Content changed - will update`);
          return { exists: true, changed: true, blog: existingByUrl };
        }
      }

      return { exists: false, changed: false, blog: null };
    } catch (err) {
      console.error(`❌ Error checking existing content: ${err.message}`);
      return { exists: false, changed: false, blog: null };
    }
  }

  async updateExistingBlog(existingBlog, newContent) {
    console.log(`🔄 Updating blog: ${existingBlog.title}`);

    try {
      // Update all fields
      existingBlog.title = newContent.title || existingBlog.title;
      existingBlog.markdown = newContent.markdown;
      existingBlog.summary = newContent.summary;
      existingBlog.highlights = newContent.highlights;
      existingBlog.tags = newContent.tags;
      existingBlog.readingTimeMinutes = newContent.readingTimeMinutes;
      existingBlog.contentHash = newContent.contentHash; // IMPORTANT: Update hash
      existingBlog.updated_at = new Date();

      await existingBlog.save();
      console.log(`✅ Blog updated successfully`);
      return existingBlog;
    } catch (err) {
      console.error(`❌ Failed to update blog: ${err.message}`);
      throw err;
    }
  }

  async searchTechUpdates(tech) {
    console.log(`🔍 Searching tech updates for "${tech}"...`);
    const query = `latest ${tech} updates OR "${tech} changelog" OR "${tech} release notes" OR "${tech} roadmap"`;

    try {
      const searchResults = await this.tavily.search(query, {
        maxResults: this.config.maxSources * 2,
        includeDomains: getPreferredDomains(tech),
        searchDepth: "advanced",
        timeRange: "d",
      });

      console.log(`📄 Tavily returned ${searchResults.results?.length || 0} results`);

      const mappedResults = (searchResults.results || [])
        .filter(r => r && r.url)
        .map((r) => ({
          title: r.title || "Untitled",
          url: r.url,
          content: r.content || "",
          rawContent: r.rawContent || null,
          score: r.score || 0,
          published_at: r.publishedDate
            ? new Date(r.publishedDate).toISOString()
            : new Date().toISOString(),
          favicon: r.favicon || null,
        }));

      const filtered = this.filterAndPrioritizeResults(mappedResults, tech);
      console.log(`✅ Filtered and prioritized ${filtered.length} results.`);
      return filtered.slice(0, this.config.maxSources);
    } catch (error) {
      console.error(`❌ Tavily search failed: ${error.message}`);
      throw new Error(`Search failed for "${tech}": ${error.message}`);
    }
  }

  filterAndPrioritizeResults(results, tech) {
    const seen = new Set();
    const prioritized = [];

    for (const r of results) {
      if (!seen.has(r.url) && isOfficialSource(r.url, tech)) {
        prioritized.push(r);
        seen.add(r.url);
      }
    }

    for (const r of results) {
      if (!seen.has(r.url) && prioritized.length < this.config.maxSources * 2) {
        prioritized.push(r);
        seen.add(r.url);
      }
    }

    return prioritized;
  }

  async extractContent(searchResults) {
    console.log(`\n🧠 Extracting content from ${searchResults.length} sources...`);
    const extracted = [];
    const skipped = [];
    const errors = [];

    const concurrencyLimit = 2;
    for (let i = 0; i < searchResults.length; i += concurrencyLimit) {
      const batch = searchResults.slice(i, i + concurrencyLimit);
      console.log(`\n📦 Processing batch ${Math.floor(i / concurrencyLimit) + 1}/${Math.ceil(searchResults.length / concurrencyLimit)}`);

      const results = await Promise.allSettled(
        batch.map(result => this.extractSingleArticle(result))
      );

      for (let index = 0; index < results.length; index++) {
        const result = results[index];
        const searchResult = batch[index];

        if (result.status === 'fulfilled' && result.value) {
          const article = result.value;

          const contentHash = this.generateContentHash(article.markdown);
          article.contentHash = contentHash;

          const existingCheck = await this.checkExistingContent(
            searchResult.url,
            contentHash
          );

          if (existingCheck.exists && !existingCheck.changed) {
            console.log(`⏭️  Skipped (duplicate): ${searchResult.url}`);
            skipped.push({
              url: searchResult.url,
              reason: 'Content unchanged'
            });
            continue;
          }

          if (existingCheck.exists && existingCheck.changed) {
            article.isUpdate = true;
            article.existingBlog = existingCheck.blog;
            console.log(`🔄 Marked for update: ${searchResult.url}`);
          }

          console.log(`✅ Success: ${searchResult.url}`);
          extracted.push(article);

        } else {
          const url = searchResult.url;
          const error = result.reason?.message || result.value?.error || 'Unknown error';
          console.error(`❌ Failed: ${url}`);
          console.error(`   Reason: ${error}`);
          errors.push({ url, error });
        }
      }
    }

    console.log(`\n📊 Extraction Summary:`);
    console.log(`   ✅ New/Updated: ${extracted.length}/${searchResults.length}`);
    console.log(`   ⏭️  Skipped (duplicates): ${skipped.length}/${searchResults.length}`);
    console.log(`   ❌ Failed: ${errors.length}/${searchResults.length}`);

    return extracted;
  }

  async extractSingleArticle(result) {
    let browser;
    let retries = 2;

    const skipDomains = ['x.com', 'twitter.com', 'facebook.com', 'instagram.com'];
    const urlDomain = new URL(result.url).hostname;
    if (skipDomains.some(domain => urlDomain.includes(domain))) {
      console.log(`⏭️  Skipping ${result.url} (social media platform)`);
      return null;
    }

    while (retries > 0) {
      try {
        console.log(`🌐 Launching browser for ${result.url} (${retries} retries left)`);
        browser = await chromium.launch({
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process'
          ]
        });

        const context = await browser.newContext({
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          viewport: { width: 1920, height: 1080 },
          ignoreHTTPSErrors: true,
        });
        const page = await context.newPage();

        console.log(`🔗 Navigating to ${result.url}...`);

        try {
          await page.goto(result.url, {
            waitUntil: "domcontentloaded",
            timeout: 30000
          });
        } catch (navError) {
          console.warn(`⚠️ Navigation warning: ${navError.message}, trying networkidle...`);
          await page.goto(result.url, {
            waitUntil: "networkidle",
            timeout: 30000
          });
        }

        await page.waitForTimeout(3000);

        console.log("📄 Extracting content...");
        const extracted = await page.evaluate(() => {
          const selectors = [
            'main article',
            'main',
            'article',
            '[role="main"]',
            '.content',
            '.post-content',
            '.article-content',
            '#content',
            'body'
          ];

          let mainElement = null;

          for (const selector of selectors) {
            mainElement = document.querySelector(selector);
            if (mainElement && mainElement.innerText.trim().length > 200) {
              break;
            }
          }

          if (!mainElement) mainElement = document.body;

          const cloned = mainElement.cloneNode(true);

          cloned.querySelectorAll(
            'script, style, noscript, iframe, nav, header, footer, aside, ' +
            '.sidebar, .advertisement, .ad, .ads, .social-share, .comments, ' +
            '[role="banner"], [role="navigation"], [role="complementary"], ' +
            '.cookie-banner, .newsletter, #comments'
          ).forEach(el => el.remove());

          const html = cloned.innerHTML;
          const text = cloned.innerText || cloned.textContent || '';

          return {
            html: html,
            text: text.trim(),
            length: text.trim().length
          };
        });

        console.log(`✅ Content extracted: ${extracted.length} characters`);

        if (!extracted.text || extracted.length < 100) {
          console.warn(`⚠️ Content too short (${extracted.length} chars) for ${result.url}`);

          const fallbackText = await page.evaluate(() => document.body.innerText);
          if (fallbackText && fallbackText.length > 100) {
            extracted.text = fallbackText;
            extracted.html = fallbackText;
            extracted.length = fallbackText.length;
          } else {
            await browser.close();
            return null;
          }
        }

        let markdown = '';
        try {
          if (extracted.html && extracted.html.trim()) {
            markdown = this.turndownService.turndown(extracted.html);
          } else {
            markdown = extracted.text;
          }
        } catch (turndownError) {
          console.warn(`⚠️ Turndown failed: ${turndownError.message}, using plain text`);
          markdown = extracted.text;
        }

        markdown = markdown
          .replace(/\n{3,}/g, '\n\n')
          .replace(/\[object Object\]/g, '')
          .trim();

        const maxLength = 15000;
        if (markdown.length > maxLength) {
          markdown = markdown.substring(0, maxLength) + '\n\n[Content truncated...]';
        }

        if (markdown.length < 100) {
          console.warn(`⚠️ Final markdown too short (${markdown.length} chars) for ${result.url}`);
          await browser.close();
          return null;
        }

        await browser.close();
        browser = null;

        console.log(`✅ Successfully extracted ${markdown.length} chars from ${result.url}`);

        return {
          title: result.title || "Untitled",
          originalUrl: result.url,
          domain: new URL(result.url).hostname,
          published_at: result.published_at,
          markdown: markdown,
          imageUrls: [],
        };

      } catch (err) {
        console.error(`❌ Extraction attempt failed for ${result.url}: ${err.message}`);
        retries--;

        if (browser) {
          await browser.close().catch(() => { });
          browser = null;
        }

        if (retries === 0) {
          return null;
        }

        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    return null;
  }

  async extractPageTitle(url) {
    let browser;
    try {
      console.log(`📄 Extracting title from ${url}...`);

      browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      });

      const page = await context.newPage();

      await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: 15000
      });

      const title = await page.evaluate(() => {
        const ogTitle = document.querySelector('meta[property="og:title"]');
        if (ogTitle?.content) return ogTitle.content;

        if (document.title) return document.title;

        const h1 = document.querySelector('h1');
        if (h1?.innerText) return h1.innerText;

        return null;
      });

      await browser.close();

      if (title && title.trim()) {
        console.log(`✅ Extracted title: ${title}`);
        return title.trim();
      }

      return null;

    } catch (err) {
      console.error(`❌ Failed to extract title: ${err.message}`);
      if (browser) {
        await browser.close().catch(() => { });
      }
      return null;
    }
  }

  async summarizeWithLangGraph(tech, articles) {
    console.log(`\n🧠 Starting LangGraph summarization for ${articles.length} articles...`);

    if (articles.length === 0) {
      console.warn('⚠️ No articles to summarize');
      return [];
    }

    const blogs = [];

    const StateAnnotation = Annotation.Root({
      articleContent: Annotation({
        reducer: (curr, next) => next ?? curr ?? "",
        default: () => ""
      }),
      detailedBlog: Annotation({
        reducer: (curr, next) => next ?? curr ?? "",
        default: () => ""
      }),
      summary: Annotation({
        reducer: (curr, next) => next ?? curr ?? "",
        default: () => ""
      }),
    });

    const workflow = new StateGraph(StateAnnotation)
      .addNode("generateBlogNode", async (state) => {
        console.log(`✍️ Generating detailed blog...`);
        const articleContent = state.articleContent || '';
        if (!articleContent || articleContent.length < 50) {
          console.error('❌ Article content is too short or missing');
          return { detailedBlog: 'Content not available' };
        }

        const contentPreview = articleContent.length > 8000
          ? articleContent.substring(0, 8000)
          : articleContent;

        const prompt = `You are an expert technical content writer specializing in ${tech}.

Create a comprehensive, well-structured blog post based on the source content below.

STRUCTURE REQUIREMENTS:
- Start with a brief 2-3 sentence introduction explaining what this update/feature is
- Use descriptive H2 and H3 headings (##, ###) to organize sections
- Include these sections if applicable:
  * What's New / Key Updates
  * Breaking Changes (if any)
  * Technical Details / How It Works
  * Migration Guide (if relevant)
  * Performance Impact (if mentioned)
- End with a brief conclusion summarizing the impact

CONTENT REQUIREMENTS:
- Extract and explain ONLY information present in the source content
- Include code examples if they exist in the source (preserve syntax and formatting)
- Use technical terminology accurately
- Highlight version numbers, dates, and metrics when available
- Explain WHY changes matter, not just WHAT changed
- Target length: 2000-2500 words

FORMATTING REQUIREMENTS:
- Use proper markdown: **bold** for emphasis, \`code\` for inline code, \`\`\`language for code blocks
- Use bullet points for lists, not numbered lists
- Keep paragraphs 2-4 sentences max
- Add line breaks between sections

WHAT TO AVOID:
- Don't add information not in the source content
- Don't use phrases like "in this article" or "we will discuss"
- Don't include generic introductions about what ${tech} is
- Don't add placeholder comments like "// your code here"
- Don't speculate about future updates not mentioned in source

SOURCE CONTENT:
${contentPreview}

Generate the blog post in markdown format:`;

        const resp = await this.model.invoke([new HumanMessage(prompt)]);
        return { detailedBlog: resp.content.trim() };
      })
      .addNode("summarizeNode", async (state) => {
        console.log(`🧾 Generating summary...`);
        const detailedBlog = state.detailedBlog || '';
        if (!detailedBlog || detailedBlog.length < 50) {
          console.error('❌ Detailed blog is too short or missing');
          return { summary: 'Summary not available' };
        }

        const blogPreview = detailedBlog.length > 5000
          ? detailedBlog.substring(0, 5000)
          : detailedBlog;

        const prompt = `Summarize the following blog post in exactly 3–5 clear bullet points.

WHAT TO INCLUDE:
- New features, updates, or product announcements
- Breaking changes or deprecations
- Performance improvements with metrics (if mentioned)
- API changes or new capabilities
- Version numbers or release dates (if mentioned)

WHAT NOT TO INCLUDE:
- Generic marketing language or promotional content
- Background information or historical context
- Code examples or implementation details
- Author opinions or editorial commentary
- Tutorial steps or how-to instructions
- Introductory or concluding remarks
- Comparisons to other tools or frameworks
- Future roadmap items without concrete timelines

FORMATTING RULES:
- Keep each bullet point under 20 words
- Start with action verbs: "Introduces", "Adds", "Removes", "Deprecates", "Improves", "Updates"
- Be specific and technical, not vague
- Use present tense

Blog Content:
${blogPreview}

Bullet Point Summary:`;

        const resp = await this.model.invoke([new HumanMessage(prompt)]);
        return { summary: resp.content.trim() };
      })
      .addEdge(START, "generateBlogNode")
      .addEdge("generateBlogNode", "summarizeNode")
      .addEdge("summarizeNode", END);

    const app = workflow.compile();

    for (const article of articles) {
      try {
        console.log(`🚀 Processing: ${article.title}`);

        if (!article.markdown || article.markdown.length < 100) {
          console.warn(`⚠️ Skipping ${article.title} - insufficient content`);
          continue;
        }

        console.log(`   Content length: ${article.markdown.length} chars`);

        const result = await app.invoke({
          articleContent: article.markdown
        });

        if (!result.detailedBlog || result.detailedBlog.length < 100) {
          console.warn(`⚠️ Generated blog too short for ${article.title}`);
          continue;
        }

        if (!result.summary) {
          console.warn(`⚠️ No summary generated for ${article.title}`);
          result.summary = 'Summary not available';
        }

        console.log(`   ✅ Blog generated: ${result.detailedBlog.length} chars`);
        console.log(`   ✅ Summary generated: ${result.summary.length} chars`);

        const title = article.title.length > 100
          ? article.title.substring(0, 97) + '...'
          : article.title;

        const blogData = {
          userId: this.config.userId || null,
          originalUrl: article.originalUrl,
          source: article.domain,
          title: title,
          slug: await Blog.handleSlugCollision(Blog.generateSlug(title)),
          markdown: result.detailedBlog,
          summary: result.summary,
          highlights: this.extractHighlights(result.summary),
          tags: this.generateTags(tech, result.detailedBlog),
          language: "en",
          processingStatus: "ready",
          published: false,
          published_at: article.published_at,
          readingTimeMinutes: this.calculateReadingTime(result.detailedBlog),
          contentHash: article.contentHash,
          isUpdate: article.isUpdate || false,
          existingBlog: article.existingBlog || null,
        };

        this.memory.push({
          title: article.title,
          summary: result.summary,
          url: article.originalUrl
        });

        blogs.push(blogData);
        console.log(`✅ Blog generated: ${title}`);

      } catch (err) {
        console.error(`❌ LangGraph failed for ${article.originalUrl}`);
        console.error(`   Error: ${err.message}`);
      }
    }

    console.log(`✅ Generated ${blogs.length}/${articles.length} blogs successfully`);
    return blogs;
  }

  extractHighlights(summary) {
    const highlights = [];
    const lines = summary.split('\n').filter(line => line.trim());

    for (const line of lines.slice(0, 5)) {
      const cleaned = line.replace(/^[-*•]\s*/, '').trim();
      if (cleaned.length > 10) {
        highlights.push(cleaned);
      }
    }

    return highlights.length > 0
      ? highlights
      : ["Recent updates", "Key improvements", "Latest features"];
  }

  generateTags(tech, content) {
    const tags = new Set([tech.toLowerCase(), "technology", "updates"]);

    const keywords = ['release', 'feature', 'update', 'version', 'api', 'framework'];
    const lowerContent = content.toLowerCase();

    keywords.forEach(keyword => {
      if (lowerContent.includes(keyword)) {
        tags.add(keyword);
      }
    });

    return Array.from(tags).slice(0, 10);
  }

  calculateReadingTime(text) {
    const wordsPerMinute = 200;
    const words = text.split(/\s+/).filter(w => w.length > 0).length;
    return Math.max(1, Math.ceil(words / wordsPerMinute));
  }

  async saveToDatabase(blogs) {
    console.log(`💾 Saving ${blogs.length} blogs to database...`);

    if (blogs.length === 0) {
      console.warn('⚠️ No blogs to save');
      return [];
    }

    const saved = [];
    const updated = [];
    const errors = [];

    for (const blog of blogs) {
      try {
        // Check if this is an update (blog has isUpdate flag and existingBlog reference)
        if (blog.isUpdate === true && blog.existingBlog) {
          console.log(`🔄 Updating existing blog: ${blog.title}`);
          const updatedBlog = await this.updateExistingBlog(blog.existingBlog, blog);
          updated.push(updatedBlog);
          console.log(`✅ Updated: ${blog.title}`);
        } else {
          console.log(`💾 Saving new blog: ${blog.title}`);
          const savedBlog = await this.saveSingleBlog(blog);
          saved.push(savedBlog);
          console.log(`✅ Saved: ${blog.title}`);
        }
      } catch (err) {
        console.error(`❌ Failed to save/update ${blog.title}: ${err.message}`);
        errors.push({ title: blog.title, error: err.message });
      }
    }

    console.log(`\n💾 Database Summary:`);
    console.log(`   🆕 New blogs saved: ${saved.length}`);
    console.log(`   🔄 Existing blogs updated: ${updated.length}`);
    if (errors.length > 0) {
      console.warn(`   ❌ Failed: ${errors.length}`);
    }

    return [...saved, ...updated];
  }

  async saveSingleBlog(blogData) {
    const slug = await Blog.handleSlugCollision(blogData.slug);
    blogData.slug = slug;

    blogData.readingTimeMinutes = this.calculateReadingTime(blogData.markdown);

    if (!blogData.title || !blogData.markdown) {
      throw new Error('Missing required fields: title or markdown');
    }

    const blog = new Blog(blogData);
    blog.processingStatus = "ready";

    return await blog.save();
  }

  async execute(techOrText) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🚀 TechUpdatesPipeline Started`);
    console.log(`📝 Input: "${techOrText}"`);
    console.log(`⏰ Time: ${new Date().toISOString()}`);
    console.log(`${'='.repeat(60)}\n`);

    const startTime = Date.now();

    try {
      let extracted = [];

      if (techOrText.startsWith("http") || techOrText.includes(".")) {
        console.log(`🌎 Mode: Direct URL extraction`);

        const pageTitle = await this.extractPageTitle(techOrText);

        const fallbackTitle = `Article from ${new URL(techOrText).hostname} - ${Date.now()}`;

        const searchResults = [{
          title: pageTitle || fallbackTitle,
          url: techOrText,
          published_at: new Date().toISOString()
        }];

        console.log(`📌 Using title: "${searchResults[0].title}"`);
        extracted = await this.extractContent(searchResults);
      } else {
        console.log(`🔍 Mode: Tech keyword search`);
        const searchResults = await this.searchTechUpdates(techOrText);

        if (searchResults.length === 0) {
          throw new Error(`No search results found for "${techOrText}"`);
        }

        extracted = await this.extractContent(searchResults);
      }

      if (extracted.length === 0) {
        throw new Error('No content could be extracted from sources');
      }

      console.log(`\n📦 Proceeding to AI summarization...`);
      const summarized = await this.summarizeWithLangGraph(techOrText, extracted);

      if (summarized.length === 0) {
        throw new Error('Failed to generate any blogs from extracted content');
      }

      console.log(`\n💾 Saving to database...`);
      const saved = await this.saveToDatabase(summarized);

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      console.log(`\n${'='.repeat(60)}`);
      console.log(`🎉 Pipeline Completed Successfully`);
      console.log(`⏱️  Duration: ${duration}s`);
      console.log(`📊 Results: ${saved.length} blogs saved`);
      console.log(`${'='.repeat(60)}\n`);

      return {
        success: true,
        technology: techOrText,
        processedAt: new Date().toISOString(),
        duration: `${duration}s`,
        totalBlogs: saved.length,
        blogs: saved.map(blog => ({
          id: blog._id,
          title: blog.title,
          slug: blog.slug,
          summary: blog.summary,
          tags: blog.tags,
          readingTime: blog.readingTimeMinutes,
          url: blog.originalUrl,
        })),
      };

    } catch (err) {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      console.error(`\n${'='.repeat(60)}`);
      console.error(`❌ Pipeline Failed`);
      console.error(`⏱️  Duration: ${duration}s`);
      console.error(`💥 Error: ${err.message}`);
      console.error(`${'='.repeat(60)}\n`);
      console.error(err.stack);

      return {
        success: false,
        technology: techOrText,
        error: err.message,
        duration: `${duration}s`,
        processedAt: new Date().toISOString(),
      };
    }
  }
}