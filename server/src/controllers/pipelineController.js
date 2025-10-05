import { EnhancedTechUpdatesPipeline } from '../agents/EnhancedTechUpdatesPipeline.js';

export class PipelineController {
  constructor(tavilyApiKey, geminiApiKey) {
    // Store API keys, don't create pipeline here
    this.tavilyApiKey = tavilyApiKey;
    this.geminiApiKey = geminiApiKey;
  }

  async processTechUpdates(req, reply) {
    try {
      const { tech, maxSources, recencyDays } = req.body;

      const userId = req?.user?._id;
      console.log('Processing for userId:', userId);

      if (!tech) {
        return reply.code(400).send({
          success: false,
          message: 'Technology name is required'
        });
      }

      // ✅ Create a NEW pipeline instance for THIS request
      const pipeline = new EnhancedTechUpdatesPipeline({
        tavilyApiKey: this.tavilyApiKey,
        geminiApiKey: this.geminiApiKey,
        userId: userId,  // Pass userId here
        maxSources: maxSources,  // Pass config here
        recencyDays: recencyDays
      });

      const result = await pipeline.execute(tech);

      return reply.send({
        success: true,
        ...result,
      });
    } catch (error) {
      console.error('Controller error:', error);
      return reply.code(500).send({
        success: false,
        error: error.message,
        technology: req.body.tech,
      });
    }
  }

  async getPipelineStatus(req, reply) {
    const userId = req?.user?._id;

    return reply.send({
      status: 'active',
      userId: userId,
      apiKeys: {
        tavily: !!this.tavilyApiKey,
        gemini: !!this.geminiApiKey
      },
      timestamp: new Date().toISOString(),
    });
  }
}