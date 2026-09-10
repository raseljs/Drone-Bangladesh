import { Schema, model } from "mongoose";

const contactMessageSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 180 },
  phone: { type: String, trim: true, maxlength: 40 },
  message: { type: String, required: true, trim: true, maxlength: 5000 },
  status: { type: String, enum: ["new", "in_progress", "resolved", "spam"], default: "new", index: true },
  notes: { type: String, maxlength: 2000 },
}, { timestamps: true });

export const ContactMessage = model("ContactMessage", contactMessageSchema);
