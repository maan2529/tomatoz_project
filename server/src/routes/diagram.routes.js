// routes/diagram.routes.js

import {DiagramController} from "../controllers/DiagramController.js";



/**
 * Diagram Routes
 * Registers all diagram-related endpoints
 * 
 * Base path: /api/diagrams
 */

export default async function diagramRoutes(fastify, options) {
  console.log('[DIAGRAM_ROUTES] 🛣️  Registering diagram routes...');

  // ============================================================
  // Initialize Controller
  // ============================================================
  const geminiApiKey = options.geminiApiKey || process.env.GEMINI_API_KEY;

  if (!geminiApiKey) {
    console.error('[DIAGRAM_ROUTES] ❌ GEMINI_API_KEY not found!');
    throw new Error('GEMINI_API_KEY is required for diagram generation');
  }

  const diagramController = new DiagramController(geminiApiKey);

  console.log('[DIAGRAM_ROUTES] ✅ DiagramController initialized');

  // ============================================================
  // ROUTE 1: Create Diagram (Manual Trigger)
  // ============================================================
  fastify.post('/create', {
    schema: {
      description: 'Generate a diagram for a blog post',
      tags: ['diagrams'],
      body: {
        type: 'object',
        required: ['blogId'],
        properties: {
          blogId: {
            type: 'string',
            description: 'MongoDB ObjectId of the blog post'
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            diagramId: { type: 'string' },
            diagramType: { type: 'string' },
            diagram: { type: 'object' },
            duration: { type: 'string' },
            blogId: { type: 'string' }
          }
        },
        400: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
            message: { type: 'string' }
          }
        },
        404: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
            message: { type: 'string' }
          }
        },
        500: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    },
    handler: async (request, reply) => {
      return diagramController.createDiagram(request, reply);
    }
  });

  console.log('[DIAGRAM_ROUTES] ✅ POST /create registered');

  // ============================================================
  // ROUTE 2: Get Diagram Status (For Polling)
  // ============================================================
  fastify.get('/status/:blogId', {
    schema: {
      description: 'Get the current diagram generation status for a blog',
      tags: ['diagrams'],
      params: {
        type: 'object',
        properties: {
          blogId: {
            type: 'string',
            description: 'MongoDB ObjectId of the blog post'
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            blogId: { type: 'string' },
            blogTitle: { type: 'string' },
            diagramStatus: {
              type: 'string',
              enum: ['pending', 'processing', 'completed', 'failed', 'skipped']
            },
            diagramError: { type: ['string', 'null'] },
            diagrams: { type: 'array' },
            diagramCount: { type: 'number' },
            timestamp: { type: 'string' }
          }
        },
        400: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' }
          }
        },
        404: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' }
          }
        }
      }
    },
    handler: async (request, reply) => {
      return diagramController.getDiagramStatus(request, reply);
    }
  });

  console.log('[DIAGRAM_ROUTES] ✅ GET /status/:blogId registered');

  // ============================================================
  // ROUTE 3: Get Diagrams by Blog ID
  // ============================================================
  fastify.get('/:blogId', {
    schema: {
      description: 'Get all diagrams for a specific blog post',
      tags: ['diagrams'],
      params: {
        type: 'object',
        properties: {
          blogId: {
            type: 'string',
            description: 'MongoDB ObjectId of the blog post'
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            diagrams: { type: 'array' },
            count: { type: 'number' },
            blogId: { type: 'string' }
          }
        },
        400: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' }
          }
        }
      }
    },
    handler: async (request, reply) => {
      return diagramController.getDiagramsByBlogId(request, reply);
    }
  });

  console.log('[DIAGRAM_ROUTES] ✅ GET /:blogId registered');

  // ============================================================
  // ROUTE 4: Delete Diagram (Optional)
  // ============================================================
  fastify.delete('/:diagramId', {
    schema: {
      description: 'Delete a specific diagram',
      tags: ['diagrams'],
      params: {
        type: 'object',
        properties: {
          diagramId: {
            type: 'string',
            description: 'MongoDB ObjectId of the diagram'
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            diagramId: { type: 'string' },
            blogId: { type: 'string' }
          }
        },
        400: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' }
          }
        },
        404: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' }
          }
        }
      }
    },
    handler: async (request, reply) => {
      return diagramController.deleteDiagram(request, reply);
    }
  });

  console.log('[DIAGRAM_ROUTES] ✅ DELETE /:diagramId registered');

  // ============================================================
  // Health Check Route (Optional)
  // ============================================================
  fastify.get('/health', {
    schema: {
      description: 'Check if diagram service is running',
      tags: ['diagrams'],
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            service: { type: 'string' },
            timestamp: { type: 'string' },
            geminiConfigured: { type: 'boolean' }
          }
        }
      }
    },
    handler: async (request, reply) => {
      return reply.send({
        status: 'healthy',
        service: 'diagram-generation',
        timestamp: new Date().toISOString(),
        geminiConfigured: !!geminiApiKey
      });
    }
  });

  console.log('[DIAGRAM_ROUTES] ✅ GET /health registered');

  console.log('[DIAGRAM_ROUTES] 🎉 All diagram routes registered successfully!');
  console.log('[DIAGRAM_ROUTES] 📋 Available endpoints:');
  console.log('[DIAGRAM_ROUTES]    POST   /api/diagrams/create');
  console.log('[DIAGRAM_ROUTES]    GET    /api/diagrams/status/:blogId');
  console.log('[DIAGRAM_ROUTES]    GET    /api/diagrams/:blogId');
  console.log('[DIAGRAM_ROUTES]    DELETE /api/diagrams/:diagramId');
  console.log('[DIAGRAM_ROUTES]    GET    /api/diagrams/health');
}