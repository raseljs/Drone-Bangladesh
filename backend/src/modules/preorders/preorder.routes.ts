import { Router, type Request } from "express";
import mongoose from "mongoose";
import crypto from "node:crypto";
import { Product } from "../products/product.model.js";
import { PreOrder } from "./preorder.model.js";
import { env } from "../../config/env.js";
import { readBearerToken, readCookieToken, requireAuth, verifyAccessToken } from "../../common/middleware/auth.middleware.js";
import { notifyAdminPreOrder, notifyCustomerPreOrderConfirmation } from "../notifications/email.service.js";

export const preorderRouter = Router();
type PreOrderRequest = Request & { user?: ReturnType<typeof verifyAccessToken>; cookies?: Record<string, string> };

preorderRouter.use((request, _response, next) => {
  try {
    const token = readCookieToken(request) || readBearerToken(request.headers.authorization);
    if (token) (request as PreOrderRequest).user = verifyAccessToken(token);
  } catch { /* optional customer authentication */ }
  next();
});
preorderRouter.use((_request, response, next) => {
  if (mongoose.connection.readyState !== 1) return response.status(503).json({ success: false, message: "Database is not available" });
  next();
});

function normalizePhone(value: unknown) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.startsWith("8801") && digits.length === 13) return `0${digits.slice(3)}`;
  return digits.startsWith("01") && digits.length === 11 ? digits : String(value || "").trim();
}
function address(value: Record<string, unknown> | undefined) {
  const source = value || {};
  return {
    line1: String(source.line1 || source.address || "").trim(),
    line2: String(source.line2 || "").trim(),
    area: String(source.area || source.upazila || "").trim(),
    city: String(source.city || source.district || "").trim(),
    district: String(source.district || "").trim(),
    postalCode: String(source.postalCode || "").trim(),
  };
}

preorderRouter.post("/", async (request, response, next) => {
  try {
    const body = request.body as {
      productSlug?: string; productId?: string; quantity?: number;
      customer?: { name?: string; email?: string; phone?: string };
      shippingAddress?: Record<string, unknown>; paymentPlan?: "full" | "partial";
      paymentMethod?: "cash_on_delivery" | "online" | "bank_transfer"; notes?: string;
    };
    const product = body.productId && mongoose.isValidObjectId(body.productId)
      ? await Product.findOne({ _id: body.productId, isActive: true }).lean()
      : await Product.findOne({ slug: String(body.productSlug || "").trim(), isActive: true }).lean();
    if (!product) return response.status(404).json({ success: false, message: "Product is unavailable" });
    if (Number(product.stock || 0) > 0 && product.preorderEnabled === false) return response.status(409).json({ success: false, message: "This product is currently in stock and preorder is disabled" });
    const quantity = Math.floor(Number(body.quantity || 1));
    if (!Number.isFinite(quantity) || quantity < 1 || quantity > 99) return response.status(400).json({ success: false, message: "Quantity must be between 1 and 99" });
    const name = String(body.customer?.name || "").trim();
    const email = String(body.customer?.email || "").trim().toLowerCase();
    const phone = normalizePhone(body.customer?.phone);
    if (!name || !/^\S+@\S+\.\S+$/.test(email) || !/^01\d{9}$/.test(phone)) return response.status(400).json({ success: false, message: "Name, valid email and Bangladesh mobile number are required" });
    const shippingAddress = address(body.shippingAddress);
    if (!shippingAddress.line1 || !shippingAddress.city) return response.status(400).json({ success: false, message: "Delivery address and district/city are required" });
    const subtotal = Number(product.price || 0) * quantity;
    const paymentPlan = body.paymentPlan === "partial" ? "partial" : "full";
    const depositPercent = paymentPlan === "partial" ? Math.min(100, Math.max(1, Number(product.preorderDepositPercent || 30))) : 100;
    const amountDue = Math.round(subtotal * depositPercent / 100);
    const user = (request as PreOrderRequest).user;
    const preOrderNumber = `PO-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
    const preOrder = await PreOrder.create({
      preOrderNumber, productId: product._id, productSlug: product.slug, productName: product.name,
      productImage: product.images?.[0], quantity, customer: { name, email, phone }, shippingAddress,
      unitPrice: product.price, subtotal, paymentPlan, depositPercent, amountDue, remainingAmount: subtotal - amountDue,
      paymentMethod: body.paymentMethod || (paymentPlan === "partial" ? "online" : "cash_on_delivery"),
      paymentStatus: "pending", status: "pending", notes: String(body.notes || "").trim() || undefined,
      userId: user?.id && mongoose.isValidObjectId(user.id) ? new mongoose.Types.ObjectId(user.id) : undefined,
    });
    const snapshot = { preOrderNumber, productName: product.name, quantity, customer: { name, email, phone }, amountDue, paymentPlan };
    void notifyAdminPreOrder(snapshot).catch((error) => console.error("Pre-order admin notification failed:", error));
    void notifyCustomerPreOrderConfirmation({ ...snapshot, customer: { name, email } }).catch((error) => console.error("Pre-order customer notification failed:", error));
    response.status(201).json({ success: true, data: preOrder, message: "Pre-order received. Our team will contact you for payment and availability confirmation." });
  } catch (error) { next(error); }
});

preorderRouter.get("/mine", requireAuth, async (request, response, next) => {
  try {
    const user = (request as PreOrderRequest).user;
    if (!user?.id || !mongoose.isValidObjectId(user.id)) return response.status(401).json({ success: false, message: "Authentication required" });
    response.json({ success: true, data: await PreOrder.find({ userId: user.id }).sort({ createdAt: -1 }).lean() });
  } catch (error) { next(error); }
});
