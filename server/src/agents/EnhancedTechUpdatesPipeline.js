import { TechUpdatesPipeline } from './TechUpdatesPipeline.js';

export class EnhancedTechUpdatesPipeline extends TechUpdatesPipeline {
  constructor(config = {}) {
    super(config);
    this.requestDelay = config.requestDelay ?? 1000;
    this.retryDelayFactor = config.retryDelayFactor ?? 1000;
    this.maxRetries = config.maxRetries ?? 3;
  }

  async withRetry(operation, maxRetries = this.maxRetries) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === maxRetries) {
          console.error(`❌ Operation failed after ${maxRetries} attempts:`, error.message);
          throw error;
        }
        console.warn(`⚠️ Retry ${attempt}/${maxRetries} after error: ${error.message}`);
        await this.delay(this.retryDelayFactor * attempt);
      }
    }
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async extractContent(searchResults) {
    if (!Array.isArray(searchResults)) return [];

    console.log(`📄 Extracting content from ${searchResults.length} sources...`);
    const extractedArticles = [];

    for (const [index, result] of searchResults.entries()) {
      if (index > 0) await this.delay(this.requestDelay);

      try {
        const article = await this.withRetry(() => this.extractSingleArticle(result));
        if (article) extractedArticles.push(article);
      } catch (error) {
        console.error(`❌ Failed to extract content from ${result.url}: ${error.message}`);
      }
    }

    console.log(`✅ Extraction completed. Articles extracted: ${extractedArticles.length}`);
    return extractedArticles;
  }
}
