import { Schema, model } from "mongoose";

const orderItemSchema = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: "Product" },
  slug: { type: String, required: true },
  name: { type: String, required: true },
  image: String,
  price: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1 },
}, { _id: false });

const statusEventSchema = new Schema({
  status: { type: String, required: true },
  note: String,
  actor: String,
  at: { type: Date, default: Date.now },
}, { _id: false });

const orderSchema = new Schema({
  orderNumber: { type: String, required: true, unique: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
  customer: { name: String, email: String, phone: String },
  items: { type: [orderItemSchema], required: true },
  shippingAddress: { line1: String, line2: String, city: String, area: String, district: String, postalCode: String },
  deliveryMethod: { type: String, enum: ["courier"], default: "courier" },
  courierPartner: { type: String, default: "Courier Delivery" },
  trackingId: String,
  estimatedDelivery: String,
  paymentMethod: { type: String, enum: ["cash_on_delivery", "online", "emi"], default: "cash_on_delivery" },
  paymentStatus: { type: String, enum: ["pending", "paid", "failed", "refunded"], default: "pending" },
  deliveryStatus: { type: String, enum: ["confirmed", "processing", "packed", "shipped", "out_for_delivery", "delivered", "cancelled"], default: "confirmed", index: true },
  statusHistory: { type: [statusEventSchema], default: [] },
  subtotal: { type: Number, required: true, min: 0 },
  discount: { type: Number, default: 0, min: 0 },
  couponCode: String,
  deliveryCharge: { type: Number, default: 150, min: 0 },
  total: { type: Number, required: true, min: 0 },
  notes: String,
  pointsAwarded: { type: Number, default: 0, min: 0 },
}, { timestamps: true });

orderSchema.pre("save", function(next) {
  if (this.isNew && (!this.statusHistory || this.statusHistory.length === 0)) {
    this.statusHistory = [{ status: this.deliveryStatus || "confirmed", note: "Order confirmed", actor: "system", at: new Date() }] as any;
  }
  next();
});

export const Order = model("Order", orderSchema);
