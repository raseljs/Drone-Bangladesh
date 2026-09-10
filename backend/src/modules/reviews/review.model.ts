import { Schema, model } from "mongoose";
const reviewSchema = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: "Product", required: true, index: true },
  productSlug: { type: String, required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
  customerName: { type: String, required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  title: String,
  body: { type: String, required: true },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending", index: true },
}, { timestamps: true });
reviewSchema.index({ productSlug: 1, userId: 1 }, { unique: true, sparse: true });
export const Review = model("Review", reviewSchema);
