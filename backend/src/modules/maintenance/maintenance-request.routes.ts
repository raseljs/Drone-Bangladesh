import { Router } from "express";
import mongoose from "mongoose";
import { MaintenanceRequest } from "./maintenance-request.model.js";

export const maintenanceRequestRouter = Router();

maintenanceRequestRouter.post("/", async (request, response, next) => {
  try {
    const { name, email, phone, serviceType, deviceModel, preferredDate, message } = request.body as { name?: string; email?: string; phone?: string; serviceType?: string; deviceModel?: string; preferredDate?: string; message?: string };
    if (!name?.trim() || !phone?.trim() || !serviceType?.trim()) return response.status(400).json({ success: false, message: "Name, phone and service type are required" });
    if (email && !/^\S+@\S+\.\S+$/.test(email.trim())) return response.status(400).json({ success: false, message: "A valid email is required" });
    if (mongoose.connection.readyState !== 1) return response.status(503).json({ success: false, message: "Database is not available" });
    const data = await MaintenanceRequest.create({ requestNumber: `MNT-${Date.now().toString(36).toUpperCase()}`, name: name.trim(), email: email?.trim().toLowerCase(), phone: phone.trim(), serviceType: serviceType.trim(), deviceModel: deviceModel?.trim(), preferredDate: preferredDate ? new Date(preferredDate) : undefined, message: message?.trim() });
    response.status(201).json({ success: true, data: { id: data._id, requestNumber: data.requestNumber, status: data.status }, message: "Maintenance request received" });
  } catch (error) { next(error); }
});
