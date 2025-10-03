import { EnhancedTechUpdatesPipeline } from '../agents/EnhancedTechUpdatesPipeline.js';

export class PipelineController {
  constructor(tavilyApiKey, geminiApiKey) {
    this.pipeline = new EnhancedTechUpdatesPipeline({
      tavilyApiKey,
      geminiApiKey,
    });
  }

  async processTechUpdates(req, reply) {
    try {
      const { tech, maxSources, recencyDays } = req.body;

      if (!tech) {
        return reply.code(400).send({ success: false, message: 'Technology name is required' });
      }

      if (maxSources) this.pipeline.config.maxSources = maxSources;
      if (recencyDays) this.pipeline.config.recencyDays = recencyDays;

      const result = await this.pipeline.execute(tech);

      reply.send({
        success: true,
        ...result,
      });
    } catch (error) {
      console.error('Controller error:', error);
      reply.code(500).send({
        success: false,
        error: error.message,
        technology: req.body.tech,
      });
    }
  }

  async getPipelineStatus(_, reply) {
    reply.send({
      status: 'active',
      config: this.pipeline.config,
      timestamp: new Date().toISOString(),
    });
  }
}
