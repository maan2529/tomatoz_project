// agents/DiagramGeneratorAgent.js

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { START, END, StateGraph, Annotation } from "@langchain/langgraph";
import { HumanMessage } from "@langchain/core/messages";
import { Blog } from "../models/blog.model.js";
import Diagram from "../models/diagram.model.js";
import { ANALYSIS_PROMPT, getGenerationPrompt } from "../utils/diagramValidation.js";
import { generateMermaid } from "../utils/generateMermaid.js";
import { validateDiagramJSON } from "../utils/diagramPrompts.js";

/**
 * DiagramGeneratorAgent - AI-powered diagram generation using LangGraph
 * 
 * Workflow:
 * 1. Analyze content → Determine if diagram is viable
 * 2. Generate JSON → Create diagram structure based on selected type
 * 3. Validate JSON → Ensure structure matches schema
 * 4. Save to DB → Store diagram and update blog status
 */
export class DiagramGeneratorAgent {
    constructor(config = {}) {
        console.log('[DIAGRAM_AGENT] 🚀 Initializing DiagramGeneratorAgent...');

        this.geminiApiKey = config.geminiApiKey;
        this.maxRetries = config.maxRetries || 3;
        this.model = new ChatGoogleGenerativeAI({
            model: config.geminiModel || "gemini-2.0-flash",
            apiKey: this.geminiApiKey,
            temperature: 0.2, // Lower temperature for more consistent JSON generation
        });

        console.log('[DIAGRAM_AGENT] ✅ Agent initialized successfully');
        console.log('[DIAGRAM_AGENT] 📋 Config:', {
            model: "gemini-2.0-flash",
            temperature: 0.2,
            maxRetries: this.maxRetries
        });
    }

    // ============================================================
    // MAIN EXECUTION METHOD
    // ============================================================

    /**
     * Generate diagram for a blog post
     * @param {string} blogId - MongoDB ObjectId of the blog
     * @returns {Object} - Result with success status and diagram data
     */
    async execute(blogId) {
        console.log('\n' + '='.repeat(80));
        console.log('[DIAGRAM_AGENT] 🎯 ========== DIAGRAM GENERATION STARTED ==========');
        console.log('[DIAGRAM_AGENT] 📌 Blog ID:', blogId);
        console.log('[DIAGRAM_AGENT] ⏰ Timestamp:', new Date().toISOString());
        console.log('='.repeat(80) + '\n');

        const startTime = Date.now();

        try {
            // ============================================================
            // STEP 0: Fetch Blog from Database
            // ============================================================
            console.log('[DIAGRAM_AGENT] 💾 Fetching blog from database...');

            const blog = await Blog.findById(blogId).select(
                'title summary markdown diagramStatus diagramIds userId'
            );

            if (!blog) {
                console.error('[DIAGRAM_AGENT] ❌ Blog not found:', blogId);
                throw new Error(`Blog not found with ID: ${blogId}`);
            }

            console.log('[DIAGRAM_AGENT] ✅ Blog fetched successfully');
            console.log('[DIAGRAM_AGENT] 📄 Title:', blog.title);
            console.log('[DIAGRAM_AGENT] 📊 Current diagram status:', blog.diagramStatus);
            console.log('[DIAGRAM_AGENT] 📝 Content length:', blog.markdown?.length || 0, 'chars');
            console.log('[DIAGRAM_AGENT] 📋 Summary length:', blog.summary?.length || 0, 'chars');

            // Check if diagram already exists
            if (blog.diagramStatus === 'completed' && blog.diagramIds?.length > 0) {
                console.warn('[DIAGRAM_AGENT] ⚠️  Diagram already exists for this blog');
                console.warn('[DIAGRAM_AGENT] 📌 Existing diagram IDs:', blog.diagramIds);
                return {
                    success: true,
                    message: 'Diagram already exists',
                    diagramId: blog.diagramIds[0],
                    skipped: true
                };
            }

            // Update status to processing
            blog.diagramStatus = 'processing';
            blog.diagramError = null;
            await blog.save();
            console.log('[DIAGRAM_AGENT] 🔄 Updated blog status to "processing"');

            // ============================================================
            // STEP 1: Run LangGraph Workflow
            // ============================================================
            console.log('\n[DIAGRAM_AGENT] 🧠 Starting LangGraph workflow...');

            const workflowResult = await this.runWorkflow(blog);

            if (!workflowResult.success) {
                console.error('[DIAGRAM_AGENT] ❌ Workflow failed:', workflowResult.reason);

                // Update blog with failure status
                blog.diagramStatus = workflowResult.shouldSkip ? 'skipped' : 'failed';
                blog.diagramError = workflowResult.reason;
                await blog.save();

                return {
                    success: false,
                    reason: workflowResult.reason,
                    skipped: workflowResult.shouldSkip
                };
            }

            // ============================================================
            // STEP 2: Save Diagram to Database
            // ============================================================
            console.log('\n[DIAGRAM_AGENT] 💾 Saving diagram to database...');

            const savedDiagram = await this.saveDiagram(
                blog,
                workflowResult.diagramType,
                workflowResult.diagramJSON,
                workflowResult.explanation
            );

            console.log('[DIAGRAM_AGENT] ✅ Diagram saved successfully');
            console.log('[DIAGRAM_AGENT] 📌 Diagram ID:', savedDiagram._id);

            // ============================================================
            // STEP 3: Update Blog with Diagram Reference
            // ============================================================
            console.log('\n[DIAGRAM_AGENT] 🔗 Updating blog with diagram reference...');

            blog.diagramIds = [savedDiagram._id];
            blog.diagramStatus = 'completed';
            blog.diagramError = null;
            await blog.save();

            console.log('[DIAGRAM_AGENT] ✅ Blog updated successfully');

            const duration = ((Date.now() - startTime) / 1000).toFixed(2);

            console.log('\n' + '='.repeat(80));
            console.log('[DIAGRAM_AGENT] 🎉 ========== GENERATION COMPLETED ==========');
            console.log('[DIAGRAM_AGENT] ⏱️  Duration:', duration + 's');
            console.log('[DIAGRAM_AGENT] 📊 Diagram Type:', workflowResult.diagramType);
            console.log('[DIAGRAM_AGENT] 📌 Diagram ID:', savedDiagram._id);
            console.log('='.repeat(80) + '\n');

            return {
                success: true,
                diagramId: savedDiagram._id,
                diagramType: workflowResult.diagramType,
                diagram: savedDiagram,
                duration: duration + 's'
            };

        } catch (error) {
            const duration = ((Date.now() - startTime) / 1000).toFixed(2);

            console.error('\n' + '='.repeat(80));
            console.error('[DIAGRAM_AGENT] 💥 ========== FATAL ERROR ==========');
            console.error('[DIAGRAM_AGENT] ❌ Error:', error.message);
            console.error('[DIAGRAM_AGENT] 📚 Stack:', error.stack);
            console.error('[DIAGRAM_AGENT] ⏱️  Duration:', duration + 's');
            console.error('='.repeat(80) + '\n');

            // Update blog with error status
            try {
                const blog = await Blog.findById(blogId);
                if (blog) {
                    blog.diagramStatus = 'failed';
                    blog.diagramError = error.message;
                    await blog.save();
                }
            } catch (updateError) {
                console.error('[DIAGRAM_AGENT] ❌ Failed to update blog status:', updateError.message);
            }

            return {
                success: false,
                error: error.message,
                duration: duration + 's'
            };
        }
    }

    // ============================================================
    // LANGGRAPH WORKFLOW
    // ============================================================

    async runWorkflow(blog) {
        console.log('[DIAGRAM_AGENT] 📐 Building LangGraph workflow...');

        // Define state annotation
        const StateAnnotation = Annotation.Root({
            blogTitle: Annotation({
                reducer: (curr, next) => next ?? curr ?? "",
                default: () => ""
            }),
            blogContent: Annotation({
                reducer: (curr, next) => next ?? curr ?? "",
                default: () => ""
            }),
            blogSummary: Annotation({
                reducer: (curr, next) => next ?? curr ?? "",
                default: () => ""
            }),
            isViable: Annotation({
                reducer: (curr, next) => next ?? curr ?? false,
                default: () => false
            }),
            reasoning: Annotation({
                reducer: (curr, next) => next ?? curr ?? "",
                default: () => ""
            }),
            diagramType: Annotation({
                reducer: (curr, next) => next ?? curr ?? null,
                default: () => null
            }),
            confidence: Annotation({
                reducer: (curr, next) => next ?? curr ?? 0,
                default: () => 0
            }),
            diagramJSON: Annotation({
                reducer: (curr, next) => next ?? curr ?? null,
                default: () => null
            }),
            validationErrors: Annotation({
                reducer: (curr, next) => next ?? curr ?? [],
                default: () => []
            }),
            retryCount: Annotation({
                reducer: (curr, next) => next ?? curr ?? 0,
                default: () => 0
            }),
            explanation: Annotation({
                reducer: (curr, next) => next ?? curr ?? "",
                default: () => ""
            })
        });

        // Build workflow graph
        const workflow = new StateGraph(StateAnnotation)
            .addNode("analyzeNode", (state) => this.analyzeContent(state))
            .addNode("generateNode", (state) => this.generateDiagram(state))
            .addNode("validateNode", (state) => this.validateDiagram(state))
            .addEdge(START, "analyzeNode")
            .addEdge("analyzeNode", "generateNode")
            .addEdge("generateNode", "validateNode")
            .addEdge("validateNode", END);

        const app = workflow.compile();

        console.log('[DIAGRAM_AGENT] ✅ Workflow compiled successfully');

        // Prepare initial state
        const initialState = {
            blogTitle: blog.title,
            blogContent: blog.markdown || "",
            blogSummary: blog.summary || ""
        };

        console.log('[DIAGRAM_AGENT] 🎬 Executing workflow...\n');

        // Execute workflow
        const result = await app.invoke(initialState);

        console.log('\n[DIAGRAM_AGENT] 🏁 Workflow execution completed');
        console.log('[DIAGRAM_AGENT] 📊 Final state:', {
            isViable: result.isViable,
            diagramType: result.diagramType,
            confidence: result.confidence,
            hasJSON: !!result.diagramJSON,
            validationErrors: result.validationErrors.length
        });

        // Check if diagram generation was successful
        if (!result.isViable) {
            console.log('[DIAGRAM_AGENT] ⏭️  Content not suitable for diagram generation');
            return {
                success: false,
                reason: result.reasoning || 'Content does not contain diagram-worthy information',
                shouldSkip: true
            };
        }

        if (!result.diagramJSON) {
            console.error('[DIAGRAM_AGENT] ❌ Failed to generate diagram JSON');
            return {
                success: false,
                reason: 'Failed to generate valid diagram structure',
                shouldSkip: false
            };
        }

        if (result.validationErrors.length > 0) {
            console.error('[DIAGRAM_AGENT] ❌ Validation failed:', result.validationErrors);
            return {
                success: false,
                reason: `Validation errors: ${result.validationErrors.join(', ')}`,
                shouldSkip: false
            };
        }

        return {
            success: true,
            diagramType: result.diagramType,
            diagramJSON: result.diagramJSON,
            explanation: result.explanation,
            confidence: result.confidence
        };
    }

    // ============================================================
    // WORKFLOW NODES
    // ============================================================

    /**
     * Node 1: Analyze content to determine diagram viability
     */
    async analyzeContent(state) {
        console.log('[DIAGRAM_AGENT] 🔍 Node 1: Analyzing content viability...');

        try {
            const prompt = ANALYSIS_PROMPT(state.blogContent, state.blogSummary);

            console.log('[DIAGRAM_AGENT] 📤 Sending analysis prompt to AI...');
            console.log('[DIAGRAM_AGENT] 📏 Content length:', state.blogContent.length, 'chars');

            const response = await this.model.invoke([new HumanMessage(prompt)]);
            const content = response.content.trim();

            console.log('[DIAGRAM_AGENT] 📥 AI response received');
            console.log('[DIAGRAM_AGENT] 📄 Response preview:', content.substring(0, 200) + '...');

            // Parse JSON response
            let analysisResult;
            try {
                // Extract JSON from markdown code blocks if present
                const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) ||
                    content.match(/```\s*([\s\S]*?)\s*```/);
                const jsonStr = jsonMatch ? jsonMatch[1] : content;

                analysisResult = JSON.parse(jsonStr);
            } catch (parseError) {
                console.error('[DIAGRAM_AGENT] ❌ Failed to parse AI response as JSON');
                console.error('[DIAGRAM_AGENT] 📄 Raw response:', content);
                throw new Error('AI returned invalid JSON format');
            }

            console.log('[DIAGRAM_AGENT] ✅ Analysis completed');
            console.log('[DIAGRAM_AGENT] 📊 Result:', {
                isViable: analysisResult.isViable,
                recommendedType: analysisResult.recommendedType,
                confidence: analysisResult.confidence
            });
            console.log('[DIAGRAM_AGENT] 💭 Reasoning:', analysisResult.reasoning);

            return {
                isViable: analysisResult.isViable,
                reasoning: analysisResult.reasoning,
                diagramType: analysisResult.recommendedType,
                confidence: analysisResult.confidence
            };

        } catch (error) {
            console.error('[DIAGRAM_AGENT] ❌ Analysis node failed:', error.message);
            return {
                isViable: false,
                reasoning: `Analysis failed: ${error.message}`
            };
        }
    }

    /**
     * Node 2: Generate diagram JSON structure
     */
    async generateDiagram(state) {
        console.log('\n[DIAGRAM_AGENT] 🎨 Node 2: Generating diagram JSON...');

        // Skip if not viable
        if (!state.isViable) {
            console.log('[DIAGRAM_AGENT] ⏭️  Skipping generation (content not viable)');
            return {};
        }

        try {
            const prompt = getGenerationPrompt(
                state.diagramType,
                state.blogContent,
                state.blogSummary
            );

            console.log('[DIAGRAM_AGENT] 📤 Sending generation prompt to AI...');
            console.log('[DIAGRAM_AGENT] 📊 Diagram type:', state.diagramType);

            const response = await this.model.invoke([new HumanMessage(prompt)]);
            const content = response.content.trim();

            console.log('[DIAGRAM_AGENT] 📥 AI response received');
            console.log('[DIAGRAM_AGENT] 📄 Response preview:', content.substring(0, 200) + '...');

            // Parse JSON response
            let diagramJSON;
            try {
                // Extract JSON from markdown code blocks if present
                const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) ||
                    content.match(/```\s*([\s\S]*?)\s*```/);
                const jsonStr = jsonMatch ? jsonMatch[1] : content;

                diagramJSON = JSON.parse(jsonStr);
            } catch (parseError) {
                console.error('[DIAGRAM_AGENT] ❌ Failed to parse diagram JSON');
                console.error('[DIAGRAM_AGENT] 📄 Raw response:', content);
                throw new Error('AI returned invalid diagram JSON');
            }

            console.log('[DIAGRAM_AGENT] ✅ Diagram JSON generated');
            console.log('[DIAGRAM_AGENT] 📊 Structure:', JSON.stringify(diagramJSON, null, 2).substring(0, 300) + '...');

            // Generate explanation
            const explanation = `This ${state.diagramType} diagram visualizes the key concepts from "${state.blogTitle}". Generated with ${(state.confidence * 100).toFixed(0)}% confidence.`;

            return {
                diagramJSON,
                explanation
            };

        } catch (error) {
            console.error('[DIAGRAM_AGENT] ❌ Generation node failed:', error.message);

            // Retry logic
            if (state.retryCount < this.maxRetries) {
                console.warn('[DIAGRAM_AGENT] 🔄 Retrying... (Attempt', state.retryCount + 1, '/', this.maxRetries, ')');
                return {
                    retryCount: state.retryCount + 1,
                    diagramJSON: null
                };
            }

            return {
                diagramJSON: null,
                validationErrors: [`Generation failed after ${this.maxRetries} attempts: ${error.message}`]
            };
        }
    }

    /**
     * Node 3: Validate generated diagram JSON
     */
    async validateDiagram(state) {
        console.log('\n[DIAGRAM_AGENT] 🔍 Node 3: Validating diagram JSON...');

        // Skip if no JSON generated
        if (!state.diagramJSON) {
            console.log('[DIAGRAM_AGENT] ⏭️  Skipping validation (no JSON generated)');
            return {
                validationErrors: ['No diagram JSON to validate']
            };
        }

        try {
            console.log('[DIAGRAM_AGENT] 🔬 Running validation for type:', state.diagramType);

            const validationResult = validateDiagramJSON(state.diagramJSON, state.diagramType);

            if (validationResult.isValid) {
                console.log('[DIAGRAM_AGENT] ✅ Validation passed!');

                if (validationResult.warnings.length > 0) {
                    console.warn('[DIAGRAM_AGENT] ⚠️  Warnings:', validationResult.warnings);
                }

                return {
                    validationErrors: []
                };
            } else {
                console.error('[DIAGRAM_AGENT] ❌ Validation failed');
                console.error('[DIAGRAM_AGENT] 📋 Errors:', validationResult.errors);

                return {
                    validationErrors: validationResult.errors
                };
            }

        } catch (error) {
            console.error('[DIAGRAM_AGENT] ❌ Validation node failed:', error.message);
            return {
                validationErrors: [`Validation error: ${error.message}`]
            };
        }
    }

    // ============================================================
    // DATABASE OPERATIONS
    // ============================================================

    /**
     * Save diagram to database
     */
    async saveDiagram(blog, diagramType, diagramJSON, explanation) {
        console.log('[DIAGRAM_AGENT] 💾 Creating diagram document...');

        try {
            // Generate Mermaid code (optional, for preview/debugging)
            let mermaidCode = null;
            try {
                mermaidCode = generateMermaid(diagramJSON, diagramType);
                console.log('[DIAGRAM_AGENT] ✅ Mermaid code generated');
            } catch (mermaidError) {
                console.warn('[DIAGRAM_AGENT] ⚠️  Failed to generate Mermaid code:', mermaidError.message);
            }

            const diagram = new Diagram({
                blogId: blog._id,
                userId: blog.userId || null,
                type: diagramType,
                title: `${blog.title} - ${diagramType.charAt(0).toUpperCase() + diagramType.slice(1)} Diagram`,
                explanation: explanation,
                structureData: [diagramJSON],
                svgUrl: null, // Will be generated on frontend
                status: 'success',
                generatedBy: 'ai-agent',
                error: null
            });

            const savedDiagram = await diagram.save();

            console.log('[DIAGRAM_AGENT] ✅ Diagram saved to database');
            console.log('[DIAGRAM_AGENT] 📌 Document ID:', savedDiagram._id);
            console.log('[DIAGRAM_AGENT] 📊 Type:', savedDiagram.type);

            return savedDiagram;

        } catch (error) {
            console.error('[DIAGRAM_AGENT] ❌ Failed to save diagram:', error.message);
            throw error;
        }
    }
}

export default DiagramGeneratorAgent;