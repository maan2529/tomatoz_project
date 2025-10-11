import mongoose from "mongoose";
const { Schema, model } = mongoose;

const diagramSchema = new Schema({
    blogId: {
        type: Schema.Types.ObjectId,
        ref: "Blog",
        required: true
    },

    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        default: null
    },

    type: {
        type: String,
        enum: ["flowchart", "usecase", "sequence", "class", "Entity Relationship (ER) ", 'state', 'mindmap', 'timeline', 'gantt', 'architecture', 'pie chart'],
        required: true
    },

    title: {
        type: String,
        required: true
    },

    explanation: {
        type: String,
        default: ""
    },

    structureData: [{
        type: Schema.Types.Mixed
    }],

    svgUrl: {
        type: String,
        default: null
    },

    status: {
        type: String,
        enum: ["pending", "success", "failure"],
        default: "pending"
    },

    generatedBy: {
        type: String,
        default: "ai-agent"
    },

    error: {
        type: String,
        default: null
    },

}, {
    timestamps: true
});

// Pre-save hook for logging
diagramSchema.pre("save", function (next) {
    console.log(`[DIAGRAM_MODEL] Pre-save hook for diagram: "${this.title}" (Type: ${this.type})`);

    if (this.structureData && this.structureData.length > 0) {
        const firstStructure = this.structureData[0];
        const nodeCount = firstStructure.nodes?.length || 0;
        const linkCount = firstStructure.links?.length || 0;

        console.log(`[DIAGRAM_MODEL] Structure info:`, {
            type: this.type,
            nodeCount,
            linkCount,
            status: this.status
        });
    }

    next();
});

// Index for efficient queries
diagramSchema.index({ blogId: 1 });
diagramSchema.index({ status: 1 });
diagramSchema.index({ type: 1 });

export default model("Diagram", diagramSchema);