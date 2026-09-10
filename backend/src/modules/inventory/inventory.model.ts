import { Schema, model } from "mongoose";

const warehouseSchema = new Schema({
  name: { type: String, required: true, unique: true, trim: true },
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  address: String,
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const stockActivitySchema = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: "Product", required: true, index: true },
  sku: String,
  warehouse: { type: String, default: "Dhaka Main Warehouse", index: true },
  type: { type: String, enum: ["stock_in", "stock_out", "adjustment", "transfer", "return", "order", "cancel_restore"], required: true, index: true },
  quantity: { type: Number, required: true },
  before: { type: Number, required: true },
  after: { type: Number, required: true },
  reference: String,
  note: String,
  actor: String,
}, { timestamps: true });

export const Warehouse = model("Warehouse", warehouseSchema);
export const StockActivity = model("StockActivity", stockActivitySchema);
