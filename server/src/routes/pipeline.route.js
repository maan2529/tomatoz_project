import { PipelineController } from '../controllers/pipelineController.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import env from "../config/index.js"

const controller = new PipelineController(env.TAVILY_API_KEY, env.GEMINI_API_KEY);

export default async function pipelineRoutes(fastify) {
  fastify.addHook('preHandler', authMiddleware);

  fastify.get('/status', controller.getPipelineStatus.bind(controller));
  fastify.post('/process', controller.processTechUpdates.bind(controller));
}
