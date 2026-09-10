import { Schema, model } from "mongoose";
const quoteSchema = new Schema({
  quoteNumber: { type: String, required: true, unique: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
  name: String, email: String, phone: String,
  subject: { type: String, required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ["new", "reviewing", "quoted", "closed"], default: "new", index: true },
  adminResponse: String,
  quotedAmount: Number,
}, { timestamps: true });
export const Quote = model("Quote", quoteSchema);
