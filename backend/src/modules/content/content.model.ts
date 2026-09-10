import { Schema, model } from "mongoose";

const contentSchema = new Schema({
  entityType: { type: String, required: true, index: true },
  name: { type: String, required: true, trim: true },
  slug: { type: String, trim: true, default: undefined },
  title: String,
  body: String,
  bodyHtml: String,
  bodyCss: String,
  descriptionHtml: String,
  descriptionCss: String,
  image: String,
  data: { type: Schema.Types.Mixed, default: {} },
  status: { type: String, enum: ["draft", "published", "archived"], default: "draft", index: true },
  sortOrder: { type: Number, default: 0, index: true },
  isActive: { type: Boolean, default: true, index: true },
}, { timestamps: true });

contentSchema.pre("validate", function(next) {
  if (this.slug === null || this.slug === undefined || String(this.slug).trim() === "") this.slug = undefined;
  else this.slug = String(this.slug).trim().toLowerCase();
  next();
});

contentSchema.index({ entityType: 1, slug: 1 }, { unique: true, partialFilterExpression: { slug: { $type: "string" } } });
contentSchema.index({ entityType: 1, status: 1, isActive: 1, sortOrder: 1 });

export const ContentEntry = model("ContentEntry", contentSchema);
