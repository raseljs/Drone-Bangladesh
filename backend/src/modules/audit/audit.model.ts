import { Schema, model } from "mongoose";
const auditSchema = new Schema({
  actorEmail: String,
  action: { type: String, required: true },
  resource: { type: String, required: true },
  resourceId: String,
  details: Schema.Types.Mixed,
}, { timestamps: true });
export const AuditLog = model("AuditLog", auditSchema);
