import { Router } from "express";
import mongoose from "mongoose";
import { ContactMessage } from "./contact.model.js";

export const contactRouter = Router();

contactRouter.post("/", async (request, response, next) => {
  try {
    const { name, email, phone, message } = request.body as { name?: string; email?: string; phone?: string; message?: string };
    if (!name?.trim() || !email?.trim() || !message?.trim()) return response.status(400).json({ success: false, message: "Name, email and message are required" });
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return response.status(400).json({ success: false, message: "A valid email is required" });
    if (mongoose.connection.readyState !== 1) return response.status(503).json({ success: false, message: "Database is not available" });
    const data = await ContactMessage.create({ name: name.trim(), email: email.trim().toLowerCase(), phone: phone?.trim(), message: message.trim() });
    response.status(201).json({ success: true, data: { id: data._id, status: data.status }, message: "Message received" });
  } catch (error) { next(error); }
});
