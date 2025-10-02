import mongoose from "mongoose";
const { Schema, model } = mongoose;

const diagramSchema = new Schema({
    type: {
        type: String,
        enum: ["flowChart", "usecase", "sequence", "class", "er"],
        required: true
    },
    title: { type: String, required: true },
    explanation: { type: String },
    structureData: { type: Schema.Types.Mixed },
    svgUrl: { type: String },
    status: {
        type: String,
        enum: ["pending", "success", "failure"],
        default: "pending"
    },
    generatedBy: { type: String, default: "ai-agent" },
    error: String,
}, { timestamps: true });

export default model("Diagram", diagramSchema);
