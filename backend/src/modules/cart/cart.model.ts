import { Schema, model, Types } from "mongoose";

const cartItemSchema = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: "Product" },
  slug: { type: String, required: true },
  name: { type: String, required: true },
  image: String,
  price: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1, default: 1 },
}, { _id: false });

const cartSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User" },
  sessionId: { type: String },
  items: { type: [cartItemSchema], default: [] },
  couponCode: String,
  discount: { type: Number, default: 0 },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

cartSchema.index({ userId: 1 }, { unique: true, sparse: true });
cartSchema.index({ sessionId: 1 }, { unique: true, sparse: true });

export type CartOwner = { userId?: Types.ObjectId; sessionId?: string };
export const Cart = model("Cart", cartSchema);

export function cartTotals(items: Array<{ price: number; quantity: number }>, discount = 0) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const safeDiscount = Math.max(0, Math.min(subtotal, Number(discount) || 0));
  const deliveryCharge = subtotal > 0 ? 150 : 0;
  return { subtotal, discount: safeDiscount, deliveryCharge, total: subtotal - safeDiscount + deliveryCharge };
}
