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

    // Configure turndown for better markdown conversion
    this.turndownService.remove(['script', 'style', 'noscript', 'iframe']);
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

      // Validate and map results with better error handling
      const mappedResults = (searchResults.results || [])
        .filter(r => r && r.url) // Filter out invalid results
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

    // First pass: Add official sources
    for (const r of results) {
      if (!seen.has(r.url) && isOfficialSource(r.url, tech)) {
        prioritized.push(r);
        seen.add(r.url);
      }
    }

    // Second pass: Add remaining sources
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
    const errors = [];

    // Process articles in parallel with concurrency limit
    const concurrencyLimit = 2; // Reduced to 2 for stability
    for (let i = 0; i < searchResults.length; i += concurrencyLimit) {
      const batch = searchResults.slice(i, i + concurrencyLimit);
      console.log(`\n📦 Processing batch ${Math.floor(i / concurrencyLimit) + 1}/${Math.ceil(searchResults.length / concurrencyLimit)}`);

      const results = await Promise.allSettled(
        batch.map(result => this.extractSingleArticle(result))
      );

      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          console.log(`✅ Success: ${batch[index].url}`);
          extracted.push(result.value);
        } else {
          const url = batch[index].url;
          const error = result.reason?.message || result.value?.error || 'Unknown error';
          console.error(`❌ Failed: ${url}`);
          console.error(`   Reason: ${error}`);
          errors.push({ url, error });
        }
      });
    }

    console.log(`\n📊 Extraction Summary:`);
    console.log(`   ✅ Success: ${extracted.length}/${searchResults.length}`);
    console.log(`   ❌ Failed: ${errors.length}/${searchResults.length}`);

    if (errors.length > 0 && extracted.length === 0) {
      console.error(`\n⚠️  All extractions failed. Common errors:`);
      errors.slice(0, 3).forEach(e => console.error(`   - ${e.error}`));
    }

    return extracted;
  }

  async extractSingleArticle(result) {
    let browser;
    let retries = 2;

    // Skip problematic URLs
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

        // Create context with user agent and proper settings
        const context = await browser.newContext({
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          viewport: { width: 1920, height: 1080 },
          ignoreHTTPSErrors: true,
        });
        const page = await context.newPage();

        console.log(`🔗 Navigating to ${result.url}...`);

        // Try navigation with fallback strategies
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

        // Wait for content to load
        await page.waitForTimeout(3000);

        console.log("📄 Extracting content...");
        const extracted = await page.evaluate(() => {
          // Try multiple selectors for main content
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
              console.log(`Found content with selector: ${selector}`);
              break;
            }
          }

          if (!mainElement) mainElement = document.body;

          // Clone the element to avoid modifying the actual DOM
          const cloned = mainElement.cloneNode(true);

          // Remove unwanted elements more aggressively
          cloned.querySelectorAll(
            'script, style, noscript, iframe, nav, header, footer, aside, ' +
            '.sidebar, .advertisement, .ad, .ads, .social-share, .comments, ' +
            '[role="banner"], [role="navigation"], [role="complementary"], ' +
            '.cookie-banner, .newsletter, #comments'
          ).forEach(el => el.remove());

          // Get both HTML and text
          const html = cloned.innerHTML;
          const text = cloned.innerText || cloned.textContent || '';

          return {
            html: html,
            text: text.trim(),
            length: text.trim().length
          };
        });

        console.log(`✅ Content extracted: ${extracted.length} characters`);

        // Validate content
        if (!extracted.text || extracted.length < 100) {
          console.warn(`⚠️ Content too short (${extracted.length} chars) for ${result.url}`);

          // Try one more time with just body text as fallback
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

        // Convert HTML to Markdown with better error handling
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

        // Clean up markdown
        markdown = markdown
          .replace(/\n{3,}/g, '\n\n') // Remove excessive newlines
          .replace(/\[object Object\]/g, '') // Remove object placeholders
          .trim();

        // Limit markdown length but keep it reasonable
        const maxLength = 15000;
        if (markdown.length > maxLength) {
          markdown = markdown.substring(0, maxLength) + '\n\n[Content truncated...]';
        }

        // Final validation
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

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    return null;
  }

  async summarizeWithLangGraph(tech, articles) {
    console.log(`\n🧠 Starting LangGraph summarization for ${articles.length} articles...`);

    if (articles.length === 0) {
      console.warn('⚠️ No articles to summarize');
      return [];
    }

    const blogs = [];

    // Define state with proper defaults
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

        // Safely get article content
        const articleContent = state.articleContent || '';
        if (!articleContent || articleContent.length < 50) {
          console.error('❌ Article content is too short or missing');
          return { detailedBlog: 'Content not available' };
        }

        // Safely substring
        const contentPreview = articleContent.length > 8000
          ? articleContent.substring(0, 8000)
          : articleContent;

        const prompt = `You are an expert technical content writer. 

Create a comprehensive, well-structured blog post about ${tech} based on the following content.

Requirements:
- Use clear headings and sections
- Include code examples if relevant
- Highlight key features and updates
- Make it engaging and informative
- Use proper markdown formatting
- Target length: 1000-1500 words

Content:
${contentPreview}

Generate the blog post:`;

        const resp = await this.model.invoke([new HumanMessage(prompt)]);
        return { detailedBlog: resp.content.trim() };
      })
      .addNode("summarizeNode", async (state) => {
        console.log(`🧾 Generating summary...`);

        // Safely get detailed blog
        const detailedBlog = state.detailedBlog || '';
        if (!detailedBlog || detailedBlog.length < 50) {
          console.error('❌ Detailed blog is too short or missing');
          return { summary: 'Summary not available' };
        }

        // Safely substring
        const blogPreview = detailedBlog.length > 5000
          ? detailedBlog.substring(0, 5000)
          : detailedBlog;

        const prompt = `Create a concise summary of this blog post in 3-5 bullet points. 
Focus on the most important updates and features.

Blog content:
${blogPreview}

Summary:`;

        const resp = await this.model.invoke([new HumanMessage(prompt)]);
        return { summary: resp.content.trim() };
      })
      .addEdge(START, "generateBlogNode")
      .addEdge("generateBlogNode", "summarizeNode")
      .addEdge("summarizeNode", END);

    const app = workflow.compile();

    // Process articles with better error handling
    for (const article of articles) {
      try {
        console.log(`🚀 Processing: ${article.title}`);

        // Validate article has content
        if (!article.markdown || article.markdown.length < 100) {
          console.warn(`⚠️ Skipping ${article.title} - insufficient content`);
          continue;
        }

        console.log(`   Content length: ${article.markdown.length} chars`);

        const result = await app.invoke({
          articleContent: article.markdown
        });

        // Validate result
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

        // Generate a better title if needed
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
        console.error(`   Article title: ${article.title}`);
        console.error(`   Content length: ${article.markdown?.length || 0} chars`);
        if (err.stack) {
          console.error(`   Stack trace: ${err.stack.split('\n').slice(0, 3).join('\n')}`);
        }
      }
    }

    console.log(`✅ Generated ${blogs.length}/${articles.length} blogs successfully`);
    return blogs;
  }

  extractHighlights(summary) {
    // Extract key points from summary
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

    // Extract potential tags from content
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
    const errors = [];

    for (const blog of blogs) {
      try {
        const savedBlog = await this.saveSingleBlog(blog);
        saved.push(savedBlog);
        console.log(`✅ Saved: ${blog.title}`);
      } catch (err) {
        console.error(`❌ Failed to save ${blog.title}: ${err.message}`);
        errors.push({ title: blog.title, error: err.message });
      }
    }

    console.log(`💾 Saved ${saved.length}/${blogs.length} blogs`);
    if (errors.length > 0) {
      console.warn(`⚠️ Failed to save ${errors.length} blogs`);
    }

    return saved;
  }

  async saveSingleBlog(blogData) {
    // Ensure slug is unique
    const slug = await Blog.handleSlugCollision(blogData.slug);
    blogData.slug = slug;

    // Recalculate reading time
    blogData.readingTimeMinutes = this.calculateReadingTime(blogData.markdown);

    // Validate required fields
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

      // Determine if input is URL or tech keyword
      if (techOrText.startsWith("http") || techOrText.includes(".")) {
        console.log(`🌎 Mode: Direct URL extraction`);
        const searchResults = [{
          title: "Manual Source",
          url: techOrText,
          published_at: new Date().toISOString()
        }];
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
