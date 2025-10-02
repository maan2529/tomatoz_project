import mongoose from "mongoose";
const { Schema, model } = mongoose;

const imageSchema = new Schema({
  url: { type: String, required: true }, 
  title: { type: String, required: true },
  description: { type: String },
  source: { type: String }, 
  status: {
    type: String,
    enum: ["pending", "success", "failure"],
    default: "pending"
  },
  width: Number,
  height: Number,
  mimeType: String,
  generatedBy: { type: String, enum: ["dalle", "stable-diffusion", "other", "none"], default: "none" },
  error: { type: String }, 
  createdAt: { type: Date, default: Date.now }
});

imageSchema.index({ source: 1, status: 1 });

export default model("Image", imageSchema);
