import { Schema, model } from "mongoose";
const returnSchema = new Schema({
  returnNumber: { type: String, required: true, unique: true, index: true },
  orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true, index: true },
  orderNumber: { type: String, required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
  type: { type: String, enum: ["return", "refund"], default: "return" },
  reason: { type: String, required: true },
  details: String,
  status: { type: String, enum: ["requested", "approved", "rejected", "received", "refunded", "closed"], default: "requested", index: true },
  resolutionNote: String,
  refundAmount: Number,
  creditApplied: { type: Boolean, default: false },
}, { timestamps: true });
export const ReturnRequest = model("ReturnRequest", returnSchema);
