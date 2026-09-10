import { Router } from "express";
import crypto from "node:crypto";
import { CustomerQuery } from "./query.model.js";
import { readCookieToken, readBearerToken, verifyAccessToken } from "../../common/middleware/auth.middleware.js";
import { User } from "../users/user.model.js";

export const queryRouter = Router();

function maybeUser(request: import("express").Request) {
  try {
    const token = readCookieToken(request) || readBearerToken(request.headers.authorization);
    return token ? verifyAccessToken(token) : undefined;
  } catch { return undefined; }
}

queryRouter.post("/", async (request, response, next) => {
  try {
    const user = maybeUser(request);
    const record = user?.id ? await User.findById(user.id).lean() : null;
    const name = String(request.body?.name || record?.name || "").trim();
    const email = String(request.body?.email || record?.email || "").trim().toLowerCase();
    const phone = String(request.body?.phone || record?.phone || "").trim();
    const subject = String(request.body?.subject || "Courier / Delivery Query").trim();
    const message = String(request.body?.message || "").trim();
    const type = String(request.body?.type || "courier");
    if (!name || !message) return response.status(400).json({ success: false, message: "Name and message are required" });
    const data = await CustomerQuery.create({ queryNumber: `QRY-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`, userId: record?._id, customer: { name, email, phone }, subject, type, source: request.body?.source || "Website", messages: [{ sender: "customer", name, message }] });
    response.status(201).json({ success: true, data });
  } catch (error) { next(error); }
});

queryRouter.get("/mine", async (request, response, next) => {
  try {
    const user = maybeUser(request);
    if (!user?.id) return response.status(401).json({ success: false, message: "Authentication required" });
    response.json({ success: true, data: await CustomerQuery.find({ userId: user.id }).sort({ createdAt: -1 }).lean() });
  } catch (error) { next(error); }
});
