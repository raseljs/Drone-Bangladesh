import { Schema, model } from "mongoose";

const preorderSchema = new Schema({
  preOrderNumber: { type: String, required: true, unique: true, index: true },
  productId: { type: Schema.Types.ObjectId, ref: "Product", required: true, index: true },
  productSlug: { type: String, required: true, index: true },
  productName: { type: String, required: true },
  productImage: String,
  quantity: { type: Number, required: true, min: 1, max: 99 },
  customer: {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
  },
  shippingAddress: {
    line1: { type: String, required: true, trim: true },
    line2: String,
    area: String,
    city: { type: String, required: true, trim: true },
    district: String,
    postalCode: String,
  },
  unitPrice: { type: Number, required: true, min: 0 },
  subtotal: { type: Number, required: true, min: 0 },
  paymentPlan: { type: String, enum: ["full", "partial"], default: "full" },
  depositPercent: { type: Number, required: true, min: 0, max: 100 },
  amountDue: { type: Number, required: true, min: 0 },
  remainingAmount: { type: Number, required: true, min: 0 },
  paymentMethod: { type: String, enum: ["cash_on_delivery", "online", "bank_transfer"], default: "cash_on_delivery" },
  paymentStatus: { type: String, enum: ["pending", "partial", "paid", "failed", "refunded"], default: "pending" },
  status: { type: String, enum: ["pending", "confirmed", "ready", "fulfilled", "cancelled"], default: "pending", index: true },
  notes: String,
  restockNotifiedAt: Date,
  userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
}, { timestamps: true });

preorderSchema.index({ productId: 1, "customer.email": 1, status: 1 });

export const PreOrder = model("PreOrder", preorderSchema);
