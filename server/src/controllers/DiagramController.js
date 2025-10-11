// controllers/DiagramController.js

import { DiagramGeneratorAgent } from '../agents/DiagramGeneratorAgent.js';
import { Blog } from '../models/blog.model.js';
import Diagram from '../models/diagram.model.js';
import mongoose from 'mongoose';

/**
 * DiagramController - Handles all diagram-related API endpoints
 * 
 * Endpoints:
 * - POST /api/diagrams/create - Generate diagram for a blog
 * - GET /api/diagrams/status/:blogId - Get diagram generation status (for polling)
 * - GET /api/diagrams/:blogId - Get all diagrams for a blog
 * - DELETE /api/diagrams/:diagramId - Delete a specific diagram
 */
export class DiagramController {
    constructor(geminiApiKey) {
        console.log('[DIAGRAM_CONTROLLER] 🚀 Initializing DiagramController...');

        this.geminiApiKey = geminiApiKey;
        this.agent = null; // Will be initialized per request to avoid memory issues

        console.log('[DIAGRAM_CONTROLLER] ✅ Controller initialized');
    }

    // ============================================================
    // ENDPOINT 1: Create Diagram (Manual Trigger)
    // ============================================================

    /**
     * POST /api/diagrams/create
     * Body: { blogId: "..." }
     * 
     * Manually trigger diagram generation for a blog post
     */
    async createDiagram(req, reply) {
        console.log('\n' + '='.repeat(80));
        console.log('[DIAGRAM_CONTROLLER] 🎯 ========== CREATE DIAGRAM REQUEST ==========');
        console.log('[DIAGRAM_CONTROLLER] 📅 Timestamp:', new Date().toISOString());
        console.log('='.repeat(80));

        const startTime = Date.now();

        try {
            // ============================================================
            // STEP 1: Validate Request
            // ============================================================
            const { blogId } = req.body;

            console.log('[DIAGRAM_CONTROLLER] 📋 Request body:', req.body);

            if (!blogId) {
                console.warn('[DIAGRAM_CONTROLLER] ⚠️  Missing required parameter: blogId');
                return reply.code(400).send({
                    success: false,
                    error: 'blogId is required',
                    message: 'Please provide a valid blog ID'
                });
            }

            // Validate MongoDB ObjectId format
            if (!mongoose.Types.ObjectId.isValid(blogId)) {
                console.warn('[DIAGRAM_CONTROLLER] ⚠️  Invalid blogId format:', blogId);
                return reply.code(400).send({
                    success: false,
                    error: 'Invalid blogId format',
                    message: 'blogId must be a valid MongoDB ObjectId'
                });
            }

            console.log('[DIAGRAM_CONTROLLER] ✅ Request validation passed');
            console.log('[DIAGRAM_CONTROLLER] 📌 Blog ID:', blogId);

            // ============================================================
            // STEP 2: Check if Blog Exists
            // ============================================================
            console.log('\n[DIAGRAM_CONTROLLER] 🔍 Checking if blog exists...');

            const blog = await Blog.findById(blogId).select('title diagramStatus diagramIds');

            if (!blog) {
                console.error('[DIAGRAM_CONTROLLER] ❌ Blog not found:', blogId);
                return reply.code(404).send({
                    success: false,
                    error: 'Blog not found',
                    message: `No blog found with ID: ${blogId}`
                });
            }

            console.log('[DIAGRAM_CONTROLLER] ✅ Blog found:', blog.title);
            console.log('[DIAGRAM_CONTROLLER] 📊 Current diagram status:', blog.diagramStatus);

            // ============================================================
            // STEP 3: Check if Diagram Already Exists
            // ============================================================
            if (blog.diagramStatus === 'completed' && blog.diagramIds?.length > 0) {
                console.log('[DIAGRAM_CONTROLLER] ℹ️  Diagram already exists');
                console.log('[DIAGRAM_CONTROLLER] 📌 Existing diagram IDs:', blog.diagramIds);

                const existingDiagram = await Diagram.findById(blog.diagramIds[0]);

                return reply.send({
                    success: true,
                    message: 'Diagram already exists for this blog',
                    alreadyExists: true,
                    diagram: existingDiagram,
                    blogId: blogId
                });
            }

            // Check if diagram generation is already in progress
            if (blog.diagramStatus === 'processing') {
                console.warn('[DIAGRAM_CONTROLLER] ⚠️  Diagram generation already in progress');
                return reply.code(409).send({
                    success: false,
                    error: 'Diagram generation in progress',
                    message: 'Please wait for the current generation to complete',
                    status: 'processing'
                });
            }

            // ============================================================
            // STEP 4: Initialize Agent and Generate Diagram
            // ============================================================
            console.log('\n[DIAGRAM_CONTROLLER] 🤖 Initializing DiagramGeneratorAgent...');

            const agent = new DiagramGeneratorAgent({
                geminiApiKey: this.geminiApiKey
            });

            console.log('[DIAGRAM_CONTROLLER] 🚀 Starting diagram generation...');

            const result = await agent.execute(blogId);

            const duration = ((Date.now() - startTime) / 1000).toFixed(2);

            // ============================================================
            // STEP 5: Handle Result and Send Response
            // ============================================================
            if (result.success) {
                console.log('\n[DIAGRAM_CONTROLLER] 🎉 Diagram generation successful!');
                console.log('[DIAGRAM_CONTROLLER] 📌 Diagram ID:', result.diagramId);
                console.log('[DIAGRAM_CONTROLLER] 📊 Type:', result.diagramType);
                console.log('[DIAGRAM_CONTROLLER] ⏱️  Total duration:', duration + 's');

                console.log('\n' + '='.repeat(80));
                console.log('[DIAGRAM_CONTROLLER] ✅ ========== REQUEST COMPLETED ==========');
                console.log('='.repeat(80) + '\n');

                return reply.send({
                    success: true,
                    message: 'Diagram generated successfully',
                    diagramId: result.diagramId,
                    diagramType: result.diagramType,
                    diagram: result.diagram,
                    duration: duration + 's',
                    blogId: blogId
                });

            } else if (result.skipped) {
                console.log('\n[DIAGRAM_CONTROLLER] ⏭️  Diagram generation skipped');
                console.log('[DIAGRAM_CONTROLLER] 💭 Reason:', result.reason);
                console.log('[DIAGRAM_CONTROLLER] ⏱️  Total duration:', duration + 's');

                console.log('\n' + '='.repeat(80));
                console.log('[DIAGRAM_CONTROLLER] ℹ️  ========== REQUEST COMPLETED (SKIPPED) ==========');
                console.log('='.repeat(80) + '\n');

                return reply.send({
                    success: true,
                    message: 'Diagram generation skipped',
                    reason: result.reason,
                    skipped: true,
                    duration: duration + 's',
                    blogId: blogId
                });

            } else {
                console.error('\n[DIAGRAM_CONTROLLER] ❌ Diagram generation failed');
                console.error('[DIAGRAM_CONTROLLER] 💥 Error:', result.error || result.reason);
                console.error('[DIAGRAM_CONTROLLER] ⏱️  Total duration:', duration + 's');

                console.log('\n' + '='.repeat(80));
                console.log('[DIAGRAM_CONTROLLER] ❌ ========== REQUEST FAILED ==========');
                console.log('='.repeat(80) + '\n');

                return reply.code(500).send({
                    success: false,
                    error: result.error || result.reason,
                    message: 'Failed to generate diagram',
                    duration: duration + 's',
                    blogId: blogId
                });
            }

        } catch (error) {
            const duration = ((Date.now() - startTime) / 1000).toFixed(2);

            console.error('\n' + '='.repeat(80));
            console.error('[DIAGRAM_CONTROLLER] 💥 ========== FATAL ERROR ==========');
            console.error('[DIAGRAM_CONTROLLER] ❌ Error:', error.message);
            console.error('[DIAGRAM_CONTROLLER] 📚 Stack:', error.stack);
            console.error('[DIAGRAM_CONTROLLER] ⏱️  Duration:', duration + 's');
            console.error('='.repeat(80) + '\n');

            return reply.code(500).send({
                success: false,
                error: error.message,
                message: 'An unexpected error occurred',
                duration: duration + 's'
            });
        }
    }

    // ============================================================
    // ENDPOINT 2: Get Diagram Status (For Polling)
    // ============================================================

    /**
     * GET /api/diagrams/status/:blogId
     * 
     * Check the current status of diagram generation for a blog
     * Used by frontend for polling
     */
    async getDiagramStatus(req, reply) {
        console.log('[DIAGRAM_CONTROLLER] 🔍 Status check request');

        try {
            const { blogId } = req.params;

            console.log('[DIAGRAM_CONTROLLER] 📌 Blog ID:', blogId);

            // Validate MongoDB ObjectId format
            if (!mongoose.Types.ObjectId.isValid(blogId)) {
                console.warn('[DIAGRAM_CONTROLLER] ⚠️  Invalid blogId format:', blogId);
                return reply.code(400).send({
                    success: false,
                    error: 'Invalid blogId format'
                });
            }

            // Fetch blog with diagram info
            const blog = await Blog.findById(blogId)
                .populate('diagramIds')
                .select('title diagramStatus diagramError diagramIds');

            if (!blog) {
                console.error('[DIAGRAM_CONTROLLER] ❌ Blog not found:', blogId);
                return reply.code(404).send({
                    success: false,
                    error: 'Blog not found'
                });
            }

            console.log('[DIAGRAM_CONTROLLER] ✅ Status retrieved:', blog.diagramStatus);

            // Return status information
            return reply.send({
                success: true,
                blogId: blogId,
                blogTitle: blog.title,
                diagramStatus: blog.diagramStatus,
                diagramError: blog.diagramError,
                diagrams: blog.diagramIds || [],
                diagramCount: blog.diagramIds?.length || 0,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('[DIAGRAM_CONTROLLER] ❌ Status check failed:', error.message);

            return reply.code(500).send({
                success: false,
                error: error.message
            });
        }
    }

    // ============================================================
    // ENDPOINT 3: Get All Diagrams for a Blog
    // ============================================================

    /**
     * GET /api/diagrams/:blogId
     * 
     * Retrieve all diagrams associated with a blog post
     */
    async getDiagramsByBlogId(req, reply) {
        console.log('[DIAGRAM_CONTROLLER] 📊 Get diagrams request');

        try {
            const { blogId } = req.params;

            console.log('[DIAGRAM_CONTROLLER] 📌 Blog ID:', blogId);

            // Validate MongoDB ObjectId format
            if (!mongoose.Types.ObjectId.isValid(blogId)) {
                console.warn('[DIAGRAM_CONTROLLER] ⚠️  Invalid blogId format:', blogId);
                return reply.code(400).send({
                    success: false,
                    error: 'Invalid blogId format'
                });
            }

            // Fetch diagrams
            const diagrams = await Diagram.find({ blogId: blogId }).sort({ createdAt: -1 });

            console.log('[DIAGRAM_CONTROLLER] ✅ Found', diagrams.length, 'diagram(s)');

            if (diagrams.length === 0) {
                return reply.send({
                    success: true,
                    message: 'No diagrams found for this blog',
                    diagrams: [],
                    count: 0
                });
            }

            return reply.send({
                success: true,
                diagrams: diagrams,
                count: diagrams.length,
                blogId: blogId
            });

        } catch (error) {
            console.error('[DIAGRAM_CONTROLLER] ❌ Failed to fetch diagrams:', error.message);

            return reply.code(500).send({
                success: false,
                error: error.message
            });
        }
    }

    // ============================================================
    // ENDPOINT 4: Delete a Diagram (Optional)
    // ============================================================

    /**
     * DELETE /api/diagrams/:diagramId
     * 
     * Delete a specific diagram and update the blog reference
     */
    async deleteDiagram(req, reply) {
        console.log('[DIAGRAM_CONTROLLER] 🗑️  Delete diagram request');

        try {
            const { diagramId } = req.params;

            console.log('[DIAGRAM_CONTROLLER] 📌 Diagram ID:', diagramId);

            // Validate MongoDB ObjectId format
            if (!mongoose.Types.ObjectId.isValid(diagramId)) {
                console.warn('[DIAGRAM_CONTROLLER] ⚠️  Invalid diagramId format:', diagramId);
                return reply.code(400).send({
                    success: false,
                    error: 'Invalid diagramId format'
                });
            }

            // Find diagram
            const diagram = await Diagram.findById(diagramId);

            if (!diagram) {
                console.error('[DIAGRAM_CONTROLLER] ❌ Diagram not found:', diagramId);
                return reply.code(404).send({
                    success: false,
                    error: 'Diagram not found'
                });
            }

            const blogId = diagram.blogId;

            // Delete diagram
            await Diagram.findByIdAndDelete(diagramId);
            console.log('[DIAGRAM_CONTROLLER] ✅ Diagram deleted');

            // Update blog to remove diagram reference
            const blog = await Blog.findById(blogId);
            if (blog) {
                blog.diagramIds = blog.diagramIds.filter(
                    id => id.toString() !== diagramId.toString()
                );

                // Update status if no diagrams left
                if (blog.diagramIds.length === 0) {
                    blog.diagramStatus = 'pending';
                    blog.diagramError = null;
                }

                await blog.save();
                console.log('[DIAGRAM_CONTROLLER] ✅ Blog updated');
            }

            return reply.send({
                success: true,
                message: 'Diagram deleted successfully',
                diagramId: diagramId,
                blogId: blogId
            });

        } catch (error) {
            console.error('[DIAGRAM_CONTROLLER] ❌ Failed to delete diagram:', error.message);

            return reply.code(500).send({
                success: false,
                error: error.message
            });
        }
    }

    // ============================================================
    // HELPER: Trigger Diagram Generation (For Future Use)
    // ============================================================

    /**
     * Internal helper method to trigger diagram generation
     * Can be called from PipelineController after blog generation
     * 
     * @param {string} blogId - MongoDB ObjectId of the blog
     * @returns {Promise<Object>} - Generation result
     */
    async triggerDiagramGeneration(blogId) {
        console.log('[DIAGRAM_CONTROLLER] 🔔 Internal trigger for blog:', blogId);

        try {
            const agent = new DiagramGeneratorAgent({
                geminiApiKey: this.geminiApiKey
            });

            const result = await agent.execute(blogId);

            if (result.success) {
                console.log('[DIAGRAM_CONTROLLER] ✅ Background generation successful');
            } else if (result.skipped) {
                console.log('[DIAGRAM_CONTROLLER] ⏭️  Background generation skipped');
            } else {
                console.error('[DIAGRAM_CONTROLLER] ❌ Background generation failed');
            }

            return result;

        } catch (error) {
            console.error('[DIAGRAM_CONTROLLER] ❌ Background generation error:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // ============================================================
    // HELPER: Batch Generate Diagrams (For Multiple Blogs)
    // ============================================================

    /**
     * Generate diagrams for multiple blogs (used after batch scraping)
     * 
     * @param {Array<string>} blogIds - Array of blog IDs
     * @returns {Promise<Object>} - Batch generation results
     */
    async batchGenerateDiagrams(blogIds) {
        console.log('[DIAGRAM_CONTROLLER] 📦 Batch generation for', blogIds.length, 'blogs');

        const results = {
            total: blogIds.length,
            successful: 0,
            skipped: 0,
            failed: 0,
            details: []
        };

        for (const blogId of blogIds) {
            try {
                console.log('[DIAGRAM_CONTROLLER] 🔄 Processing blog:', blogId);

                const result = await this.triggerDiagramGeneration(blogId);

                if (result.success && !result.skipped) {
                    results.successful++;
                } else if (result.skipped) {
                    results.skipped++;
                } else {
                    results.failed++;
                }

                results.details.push({
                    blogId,
                    success: result.success,
                    skipped: result.skipped || false,
                    error: result.error || null
                });

                // Add delay between requests to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 2000));

            } catch (error) {
                console.error('[DIAGRAM_CONTROLLER] ❌ Batch processing error for', blogId, ':', error.message);
                results.failed++;
                results.details.push({
                    blogId,
                    success: false,
                    error: error.message
                });
            }
        }

        console.log('[DIAGRAM_CONTROLLER] 📊 Batch generation completed:', results);
        return results;
    }
}

export default DiagramController;   