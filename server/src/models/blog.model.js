import mongoose from "mongoose";
const { Schema, model } = mongoose;

const blogSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },

  originalUrls: [{ type: String }],
  source: { type: String }, // e.g. 'TechCrunch', 'Dev.to', 'HackerNews', 'aggregator' 

  title: { type: String, required: true },
  slug: { type: String, index: true, unique: true },
  markdown: { type: String }, 
  summary: { type: String },  
  tags: [{ type: String, index: true }],
  language: { type: String, default: "en" },

  audioIds: [{ type: Schema.Types.ObjectId, ref: "Audio" }],
  imageIds: [{ type: Schema.Types.ObjectId, ref: "Image" }],
  diagramIds: [{ type: Schema.Types.ObjectId, ref: "Diagram" }],

  processingStatus: {
    type: String,
    enum: ["pending", "processing", "ready", "failed"],
    default: "pending"
  },
  error: { type: String },

  readingTimeMinutes: Number,
  published: { type: Boolean, default: false },

},{ timestamps:true });

blogSchema.index({ title: "text", markdown: "text", summary: "text" });

blogSchema.pre("save", function(next) {
  if (!this.slug && this.title) {
    this.slug = this.title.toLowerCase()
      .replace(/[^\w ]+/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 200);
  }
  this.updatedAt = new Date();
  next();
});

export default model("Blog", blogSchema);
