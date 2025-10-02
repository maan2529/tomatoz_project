import mongoose from "mongoose";
const { Schema, model } = mongoose;

const audioSchema = new Schema({
  type: {
    type: String,
    enum: ["podcast", "debate", "summary"],
    required: true
  },
  url: { type: String, required: true }, 
  durationSeconds: { type: Number },
  language: { type: String, default: "en" },
  generatedBy: { type: String, enum: ["ai-agent", "human"], default: "ai-agent" },
  sourceBlogId: { type: Schema.Types.ObjectId, ref: "Blog" },
}, { timestamps:true }); 

export default model("Audio", audioSchema);
