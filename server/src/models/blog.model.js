import mongoose from 'mongoose';
import crypto from 'crypto';

const blogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, default: null },
  originalUrl: { type: String, required: true },
  source: { type: String, required: true },
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  markdown: { type: String, required: true },
  summary: { type: String, default: "" },
  highlights: [{ type: String, default: [] }],
  tags: [{ type: String, default: [] }],
  language: { type: String, default: "en" },
  audioIds: [{ type: mongoose.Schema.Types.ObjectId, default: [] }],
  imageIds: [{ type: mongoose.Schema.Types.ObjectId, default: [] }],
  diagramIds: [{ type: mongoose.Schema.Types.ObjectId, default: [] }],
  processingStatus: {
    type: String,
    enum: ["processing", "ready", "failed"],
    default: "processing"
  },
  error: { type: String, default: "" },
  readingTimeMinutes: { type: Number, required: true },
  published: { type: Boolean, default: false },
  published_at: { type: Date, default: null }
}, {
  timestamps: true
});

// Pre-save middleware for slug normalization
blogSchema.pre("save", function (next) {
  if (this.isModified("title") || !this.slug) {
    this.slug = this.constructor.generateSlug(this.title);
  }
  next();
});

// Generate a slug from title or fallback random
blogSchema.statics.generateSlug = function (title) {
  if (!title || title.trim().length === 0) {
    return `update-${crypto.randomBytes(3).toString('hex')}`;
  }

  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .substring(0, 200)
    .replace(/-+$/, "");
};

// Ensure slug uniqueness in DB
blogSchema.statics.handleSlugCollision = async function (slug) {
  let newSlug = slug;
  let attempts = 0;

  while (attempts < 10) {
    const existing = await this.findOne({ slug: newSlug });
    if (!existing) return newSlug;

    const hash = crypto.randomBytes(3).toString('hex');
    newSlug = `${slug}-${hash}`;
    attempts++;
  }

  throw new Error('Unable to generate unique slug after 10 attempts');
};

export const Blog = mongoose.model("Blog", blogSchema);