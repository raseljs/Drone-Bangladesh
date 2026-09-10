import { Schema, model } from "mongoose";

const warrantyRecordSchema = new Schema({
  serialNumber: { type: String, required: true, unique: true, index: true, trim: true, uppercase: true },
  productId: { type: Schema.Types.ObjectId, ref: "Product", index: true },
  productSlug: { type: String, required: true, index: true },
  productName: { type: String, required: true },
  purchaseOrderNumber: String,
  customerName: String,
  customerEmail: String,
  warrantyStart: { type: Date, required: true },
  warrantyEnd: { type: Date, required: true },
  status: { type: String, enum: ["active", "expired", "revoked"], default: "active", index: true },
  notes: String,
}, { timestamps: true });

export const WarrantyRecord = model("WarrantyRecord", warrantyRecordSchema);
