import { Schema, model } from "mongoose";

const couponSchema = new Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
  description: String,
  discountType: { type: String, enum: ["percent", "fixed"], default: "percent" },
  discountValue: { type: Number, required: true, min: 0 },
  minimumSubtotal: { type: Number, default: 0, min: 0 },
  maximumDiscount: { type: Number, min: 0 },
  usageLimit: { type: Number, min: 0 },
  usedCount: { type: Number, default: 0, min: 0 },
  startsAt: Date,
  expiresAt: Date,
  isActive: { type: Boolean, default: true, index: true },
}, { timestamps: true });

export const Coupon = model("Coupon", couponSchema);

export function calculateDiscount(coupon: { discountType: string; discountValue: number; maximumDiscount?: number }, subtotal: number) {
  const raw = coupon.discountType === "fixed" ? coupon.discountValue : subtotal * (coupon.discountValue / 100);
  return Math.max(0, Math.min(subtotal, coupon.maximumDiscount ? Math.min(raw, coupon.maximumDiscount) : raw));
}
