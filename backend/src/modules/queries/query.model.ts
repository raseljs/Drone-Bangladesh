import { Schema, model } from "mongoose";

const messageSchema = new Schema({
  sender: { type: String, enum: ["customer", "admin"], required: true },
  name: String,
  message: { type: String, required: true, trim: true },
}, { timestamps: true });

const querySchema = new Schema({
  queryNumber: { type: String, required: true, unique: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
  customer: { name: String, email: String, phone: String },
  subject: { type: String, required: true, trim: true },
  type: { type: String, enum: ["courier", "delivery_time", "shipping", "payment", "support", "service", "product", "wholesale"], default: "courier", index: true },
  source: { type: String, default: "Website" },
  status: { type: String, enum: ["new", "in_progress", "resolved"], default: "new", index: true },
  messages: { type: [messageSchema], default: [] },
}, { timestamps: true });

export const CustomerQuery = model("CustomerQuery", querySchema);
