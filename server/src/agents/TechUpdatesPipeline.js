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
    this.tavily = tavily({ apiKey: config.tavilyApiKey });

    this.model = new ChatGoogleGenerativeAI({
      model: apiConfig.gemini.model || "gemini-2.0-flash",
      apiKey: config.geminiApiKey || env.GEMINI_API_KEY,
      temperature: 0,
    });

    this.memory = [];
    this.turndownService = new TurndownService();
  }

  async searchTechUpdates(tech) {
    const query = `latest ${tech} updates OR "${tech} changelog" OR "${tech} release notes" OR "${tech} roadmap"`;
    const searchResults = await this.tavily.search(query, {
      maxResults: this.config.maxSources * 2,
      includeDomains: getPreferredDomains(tech),
      searchDepth: "advanced",
      timeRange: "d",
    });

    const mappedResults = (searchResults.results || []).map(r => ({
      title: r.title || "Untitled",
      url: r.url,
      content: r.content || "",
      rawContent: r.rawContent || null,
      score: r.score || 0,
      published_at: r.publishedDate || new Date().toISOString().split("T")[0],
      favicon: r.favicon,
    }));

    return this.filterAndPrioritizeResults(mappedResults, tech).slice(0, this.config.maxSources);
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
      if (!seen.has(r.url) && prioritized.length < this.config.maxSources) {
        prioritized.push(r);
        seen.add(r.url);
      }
    }

    return prioritized;
  }

  async extractContent(searchResults) {
    const extracted = [];
    for (const result of searchResults) {
      try {
        if (result.content) {
          extracted.push({
            title: result.title,
            originalUrl: result.url,
            domain: new URL(result.url).hostname,
            published_at: result.published_at,
            markdown: result.content.substring(0, 10000),
            imageUrls: [],
          });
          continue;
        }

        const article = await this.extractSingleArticle(result);
        if (article) extracted.push(article);
      } catch (err) {
        console.error(`❌ Failed to extract ${result.url}: ${err.message}`);
      }
    }
    return extracted;
  }

  async extractSingleArticle(result) {
    let browser;
    try {
      browser = await chromium.launch({ headless: true });
      const page = await browser.newPage();
      await page.goto(result.url, { waitUntil: "domcontentloaded" });

      await page
        .waitForSelector("article, main, [itemprop='articleBody'], .content, .post-content", { timeout: 5000 })
        .catch(() => null);

      const html = await page.$eval(
        "article, main, [itemprop='articleBody'], .content, .post-content",
        (el) => {
          el.querySelectorAll("script, style, noscript, iframe, svg, img, video").forEach((node) => node.remove());
          return el.innerHTML;
        }
      );

      const markdown = this.turndownService.turndown(html).substring(0, 10000);

      return {
        title: result.title || "Untitled",
        originalUrl: result.url,
        domain: new URL(result.url).hostname,
        published_at: result.published_at,
        markdown,
        imageUrls: [],
      };
    } catch (err) {
      console.error(`❌ Playwright extraction failed for ${result.url}: ${err.message}`);
      return null;
    } finally {
      if (browser) await browser.close();
    }
  }

  // ===================== LANGGRAPH WORKFLOW =====================
  async summarizeWithLangGraph(tech, articles) {
    const blogs = [];

    // Define state annotation
    const StateAnnotation = Annotation.Root({
      detailedBlog: Annotation({ reducer: (curr, next) => next, default: () => "" }),
      summary: Annotation({ reducer: (curr, next) => next, default: () => "" }),
    });

    // Build LangGraph workflow
    const workflow = new StateGraph(StateAnnotation)
      .addNode("detailedBlogNode", async (state) => {
        const resp = await this.model.invoke([
          new HumanMessage(
            `You are an expert tech blogger. Write a detailed blog for this article:\n${state.articleContent}`
          ),
        ]);
        return { detailedBlog: resp.content.trim() };
      })
      .addNode("summaryNode", async (state) => {
        const resp = await this.model.invoke([
          new HumanMessage(
            `Summarize this detailed blog in a concise way:\n${state.detailedBlog}`
          ),
        ]);
        return { summary: resp.content.trim() };
      })
      .addEdge(START, "detailedBlogNode")
      .addEdge("detailedBlogNode", "summaryNode")
      .addEdge("summaryNode", END);

    const app = workflow.compile();

    for (const article of articles) {
      try {
        const result = await app.invoke({
          articleContent: article.markdown,
        });

        const blogData = {
          userId: this.config.userId || null,
          originalUrl: article.originalUrl,
          source: article.domain,
          title: article.title || "Untitled",
          slug:
            (article.title || "untitled")
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/(^-|-$)/g, "") + "-" + Date.now(),
          markdown: result.detailedBlog,
          summary: result.summary,
          highlights: ["Recent updates", "Key improvements", "Announcements"],
          tags: [tech, "technology", "updates", "software"],
          language: "en",
          audioIds: [],
          imageIds: [],
          diagramIds: [],
          processingStatus: "ready",
          error: null,
          readingTimeMinutes: Math.max(1, Math.ceil((result.detailedBlog?.split(/\s+/).length || 100) / 200)),
          published: false,
          published_at: article.published_at || new Date().toISOString().split("T")[0],
        };

        this.memory.push({ summary: result.summary });
        blogs.push(blogData);
      } catch (err) {
        console.error(`❌ LangGraph failed for ${article.originalUrl}: ${err.message}`);
      }
    }

    return blogs;
  }
  // =============================================================

  async saveToDatabase(blogs) {
    const saved = [];
    for (const blog of blogs) {
      try {
        saved.push(await this.saveSingleBlog(blog));
      } catch (err) {
        console.error(err);
      }
    }
    return saved;
  }

  async saveSingleBlog(blogData) {
    const slug = await Blog.handleSlugCollision(blogData.slug);
    blogData.slug = slug;
    blogData.readingTimeMinutes = Math.max(1, Math.ceil(blogData.markdown.split(/\s+/).length / 200));

    const blog = new Blog(blogData);
    blog.processingStatus = "ready";
    return blog.save();
  }

  async execute(tech) {
    console.log(`🚀 Pipeline start for ${tech}...`);
    try {
      const searchResults = await this.searchTechUpdates(tech);
      const extracted = await this.extractContent(searchResults);
      console.log("📄 Articles extracted:", extracted);

      const summarized = await this.summarizeWithLangGraph(tech, extracted);
      const saved = await this.saveToDatabase(summarized);

      console.log(`🎉 Pipeline done for ${tech}. Processed ${saved.length} blogs.`);
      return { technology: tech, processedAt: new Date().toISOString(), totalBlogs: saved.length, blogs: saved };
    } catch (err) {
      console.error("❌ Pipeline failed:", err);
      throw err;
    }
  }
}
