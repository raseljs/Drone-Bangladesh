import { Router } from "express";
import mongoose from "mongoose";
import { WarrantyRecord } from "./warranty-record.model.js";

export const warrantyRouter = Router();
warrantyRouter.use((_request, response, next) => {
  if (mongoose.connection.readyState !== 1) return response.status(503).json({ success: false, message: "Database is not available" });
  next();
});

function result(record: any) {
  const now = new Date();
  const active = record.status === "active" && new Date(record.warrantyEnd) >= now;
  return {
    authentic: record.status !== "revoked",
    serialNumber: record.serialNumber,
    productName: record.productName,
    productSlug: record.productSlug,
    warrantyStatus: active ? "active" : record.status === "revoked" ? "revoked" : "expired",
    warrantyStart: record.warrantyStart,
    warrantyEnd: record.warrantyEnd,
    message: active ? "Authentic product. Warranty is active." : record.status === "revoked" ? "Serial number has been revoked." : "Authentic serial number, but the warranty has expired.",
  };
}

warrantyRouter.get("/verify/:serialNumber", async (request, response, next) => {
  try {
    const serialNumber = String(request.params.serialNumber || "").trim().toUpperCase();
    if (!serialNumber) return response.status(400).json({ success: false, message: "Serial number is required" });
    const record = await WarrantyRecord.findOne({ serialNumber }).lean();
    if (!record) return response.status(404).json({ success: false, message: "Serial number was not found in the Drone Bangladesh authenticity register", data: { authentic: false, serialNumber } });
    response.json({ success: true, data: result(record) });
  } catch (error) { next(error); }
});

warrantyRouter.post("/verify", async (request, response, next) => {
  try {
    const serialNumber = String(request.body?.serialNumber || "").trim().toUpperCase();
    if (!serialNumber) return response.status(400).json({ success: false, message: "Serial number is required" });
    const record = await WarrantyRecord.findOne({ serialNumber }).lean();
    if (!record) return response.status(404).json({ success: false, message: "Serial number was not found in the Drone Bangladesh authenticity register", data: { authentic: false, serialNumber } });
    response.json({ success: true, data: result(record) });
  } catch (error) { next(error); }
});
