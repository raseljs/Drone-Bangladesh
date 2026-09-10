import { Schema, model } from "mongoose";

const maintenanceRequestSchema = new Schema({
  requestNumber: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 120 },
  email: { type: String, trim: true, lowercase: true, maxlength: 180 },
  phone: { type: String, required: true, trim: true, maxlength: 40 },
  serviceType: { type: String, required: true, trim: true, maxlength: 120 },
  deviceModel: { type: String, trim: true, maxlength: 160 },
  preferredDate: Date,
  message: { type: String, trim: true, maxlength: 5000 },
  status: { type: String, enum: ["pending", "in_progress", "completed", "cancelled"], default: "pending", index: true },
  notes: { type: String, maxlength: 2000 },
}, { timestamps: true });

export const MaintenanceRequest = model("MaintenanceRequest", maintenanceRequestSchema);
