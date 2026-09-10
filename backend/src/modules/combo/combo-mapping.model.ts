import { Schema, model } from "mongoose";

const comboMappingSchema = new Schema({
  productSlug: { type: String, required: true, index: true },
  kind: { type: String, enum: ["combo", "accessory"], default: "combo", index: true },
  title: { type: String, required: true, trim: true },
  subtitle: { type: String, trim: true },
  price: { type: Number, default: 0 },
  oldPrice: { type: Number, default: 0 },
  image: String,
  linkedSlug: String,
  quantity: { type: Number, default: 1, min: 1 },
  status: { type: String, enum: ["published", "draft"], default: "published", index: true },
  sortOrder: { type: Number, default: 0 },
}, { timestamps: true });

export const ComboMapping = model("ComboMapping", comboMappingSchema);
