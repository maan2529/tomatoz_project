import { EnhancedTechUpdatesPipeline } from '../agents/EnhancedTechUpdatesPipeline.js';

export class PipelineController {
  constructor(tavilyApiKey, geminiApiKey) {
    console.log('[CONTROLLER] 🚀 Initializing PipelineController...');

    // Store API keys
    this.tavilyApiKey = tavilyApiKey;
    this.geminiApiKey = geminiApiKey;

    console.log('[CONTROLLER] ✅ API keys loaded');
  }

  /**
   * Process tech updates and generate blogs (NO diagram generation)
   * Route: POST /process
   */
  async processTechUpdates(req, reply) {
    console.log('\n' + '='.repeat(80));
    console.log('[CONTROLLER] 🎯 ========== NEW REQUEST RECEIVED ==========');
    console.log('='.repeat(80));

    try {
      const { tech, maxSources, recencyDays } = req.body;
      const userId = req?.user?._id;

      console.log('[CONTROLLER] 📋 Request parameters:', {
        tech,
        maxSources,
        recencyDays,
        userId: userId ? userId.toString() : 'anonymous'
      });

      if (!tech) {
        console.warn('[CONTROLLER] ⚠️  Missing required parameter: tech');
        return reply.code(400).send({
          success: false,
          message: 'Technology name is required'
        });
      }

      // ============================================================
      // Execute Tech Updates Pipeline ONLY
      // ============================================================
      console.log('\n[CONTROLLER] 📰 Creating TechUpdatesPipeline instance...');
      const techPipeline = new EnhancedTechUpdatesPipeline({
        tavilyApiKey: this.tavilyApiKey,
        geminiApiKey: this.geminiApiKey,
        userId: userId,
        maxSources: maxSources,
        recencyDays: recencyDays
      });

      console.log('[CONTROLLER] 🔄 Executing tech updates pipeline...');
      const pipelineStartTime = Date.now();

      const techResult = await techPipeline.execute(tech);

      const pipelineDuration = ((Date.now() - pipelineStartTime) / 1000).toFixed(2);
      console.log(`[CONTROLLER] ⏱️  Tech pipeline completed in ${pipelineDuration}s`);

      if (!techResult.success) {
        console.error('[CONTROLLER] ❌ Tech pipeline failed:', techResult.error);
        return reply.code(500).send({
          success: false,
          error: techResult.error,
          technology: tech
        });
      }

      console.log(`[CONTROLLER] ✅ Tech pipeline successful: ${techResult.totalBlogs} blog(s) generated`);

      // ============================================================
      // Return Response (Diagrams will be generated separately)
      // ============================================================
      console.log('\n[CONTROLLER] 📊 Final summary:');
      console.log(`[CONTROLLER]    📰 Blogs generated: ${techResult.totalBlogs}`);
      console.log(`[CONTROLLER]    💡 Diagrams will be generated on-demand via /create-diagram`);

      const response = {
        success: true,
        ...techResult,
        totalDuration: `${pipelineDuration}s`,
        note: 'Diagrams can be generated on-demand by calling /create-diagram with blogId'
      };

      console.log('\n' + '='.repeat(80));
      console.log('[CONTROLLER] 🎉 ========== REQUEST COMPLETED SUCCESSFULLY ==========');
      console.log('='.repeat(80) + '\n');

      return reply.send(response);

    } catch (error) {
      console.error('\n' + '='.repeat(80));
      console.error('[CONTROLLER] 💥 ========== FATAL ERROR ==========');
      console.error('[CONTROLLER] ❌ Error:', error.message);
      console.error('[CONTROLLER] 📚 Stack:', error.stack);
      console.error('='.repeat(80) + '\n');

      return reply.code(500).send({
        success: false,
        error: error.message,
        technology: req.body.tech,
      });
    }
  }

  /**
   * Get pipeline status
   * Route: GET /status
   */
  async getPipelineStatus(req, reply) {
    console.log('[CONTROLLER] 📊 Status check requested');

    const userId = req?.user?._id;

    return reply.send({
      status: 'active',
      userId: userId ? userId.toString() : 'anonymous',
      services: {
        techPipeline: {
          available: !!this.tavilyApiKey && !!this.geminiApiKey,
          apiKeys: {
            tavily: !!this.tavilyApiKey,
            gemini: !!this.geminiApiKey
          }
        }
      },
      timestamp: new Date().toISOString(),
    });
  }
}