import { Router, type Request } from "express";
import mongoose from "mongoose";
import crypto from "node:crypto";
import { Order } from "./order.model.js";
import { Cart, cartTotals } from "../cart/cart.model.js";
import { Product } from "../products/product.model.js";
import { Coupon } from "../coupons/coupon.model.js";
import { User } from "../users/user.model.js";
import { requireAuth, readCookieToken, readBearerToken, verifyAccessToken } from "../../common/middleware/auth.middleware.js";
import { reserveInventory, releaseInventory } from "./inventory.service.js";
import { env } from "../../config/env.js";
import { notifyCustomerOrderInvoice } from "../notifications/email.service.js";

export const orderRouter = Router();
type OrderRequest = Request & { user?: ReturnType<typeof verifyAccessToken>; cookies?: Record<string, string> };

orderRouter.use((request, _response, next) => {
  try {
    const token = readCookieToken(request) || readBearerToken(request.headers.authorization);
    if (token) (request as OrderRequest).user = verifyAccessToken(token);
  } catch { /* guest checkout */ }
  next();
});
orderRouter.use((_request, response, next) => {
  if (mongoose.connection.readyState !== 1) return response.status(503).json({ success: false, message: "Database is not available" });
  next();
});

function authUser(request: Request) { return (request as OrderRequest).user; }
function normalizePhone(value: unknown) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.startsWith("8801") && digits.length === 13) return `0${digits.slice(3)}`;
  return digits.startsWith("01") && digits.length === 11 ? digits : String(value || "").trim();
}
async function priceOrderItems(items: Array<{ slug: string; quantity: number }>) {
  const slugs = [...new Set(items.map((item) => item.slug).filter(Boolean))];
  const products = await Product.find({ slug: { $in: slugs }, isActive: true, $or: [{ status: "published" }, { status: { $exists: false } }] }).lean();
  const bySlug = new Map(products.map((product) => [product.slug, product]));
  if (products.length !== slugs.length) throw Object.assign(new Error("One or more products are no longer available"), { statusCode: 409 });
  return items.map((item) => {
    const product = bySlug.get(item.slug)!;
    const quantity = Math.floor(Number(item.quantity));
    if (!Number.isFinite(quantity) || quantity < 1 || quantity > 99 || product.stock < quantity) throw Object.assign(new Error(`Requested quantity is not available for ${product.name}`), { statusCode: 409 });
    return { productId: product._id, slug: product.slug, name: product.name, image: product.images?.[0], price: product.price, quantity };
  });
}
function normalizeShippingAddress(value: Record<string, string> | undefined) {
  const source = value || {};
  return { line1: String(source.line1 || source.address || "").trim(), line2: String(source.line2 || "").trim(), area: String(source.area || source.upazila || "").trim(), city: String(source.city || source.district || "").trim(), district: String(source.district || "").trim(), postalCode: String(source.postalCode || "").trim() };
}
function guestSession(request: Request, response: import("express").Response) {
  const req = request as OrderRequest;
  const headerSession = typeof request.headers["x-cart-session"] === "string" ? request.headers["x-cart-session"].trim() : "";
  let sessionId = headerSession || req.cookies?.cart_session || "";
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    response.cookie("cart_session", sessionId, { httpOnly: true, sameSite: env.nodeEnv === "production" ? "none" : "lax", secure: env.nodeEnv === "production", maxAge: 1000 * 60 * 60 * 24 * 30, path: "/" });
  }
  return sessionId;
}

orderRouter.post("/", async (request, response, next) => {
  let reserved: Array<{ productId: unknown; quantity: number }> = [];
  try {
    const body = request.body as { items?: Array<{ slug: string; quantity: number }>; customer?: { firstName?: string; lastName?: string; name?: string; email?: string; phone?: string }; shippingAddress?: Record<string, string>; paymentMethod?: "cash_on_delivery" | "online" | "emi"; notes?: string };
    const user = authUser(request);
    const owner = user?.id && mongoose.isValidObjectId(user.id) ? { userId: new mongoose.Types.ObjectId(user.id) } : { sessionId: guestSession(request, response) };
    const cart = await Cart.findOne(owner);
    const sourceItems = body.items?.length ? body.items : cart?.items || [];
    if (!sourceItems.length) return response.status(400).json({ success: false, message: "Your cart is empty" });
    const customerName = String(body.customer?.name || `${body.customer?.firstName || ""} ${body.customer?.lastName || ""}`).trim();
    const phone = normalizePhone(body.customer?.phone);
    if (!customerName || !phone) return response.status(400).json({ success: false, message: "Customer name and phone are required" });
    if (!/^01\d{9}$/.test(phone)) return response.status(400).json({ success: false, message: "A valid Bangladesh mobile number is required" });
    const shippingAddress = normalizeShippingAddress(body.shippingAddress);
    if (!shippingAddress.line1 || !shippingAddress.city) return response.status(400).json({ success: false, message: "Delivery address and district/city are required" });

    const items = await priceOrderItems(sourceItems.map((item) => ({ slug: item.slug, quantity: item.quantity })));
    const discount = cart?.discount || 0;
    const totals = cartTotals(items, discount);
    const orderNumber = `DB-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
    reserved = await reserveInventory(items, orderNumber);
    const userId = user?.id && mongoose.isValidObjectId(user.id) ? new mongoose.Types.ObjectId(user.id) : undefined;
    const order = await Order.create({
      orderNumber, userId,
      customer: { name: customerName, email: body.customer?.email?.trim().toLowerCase(), phone },
      items, shippingAddress,
      paymentMethod: body.paymentMethod || "cash_on_delivery",
      paymentStatus: "pending",
      deliveryMethod: "courier",
      courierPartner: "Courier Delivery",
      deliveryStatus: "confirmed",
      notes: body.notes?.trim(),
      couponCode: cart?.couponCode,
      ...totals,
    });
    if (cart?.couponCode) await Coupon.updateOne({ code: cart.couponCode }, { $inc: { usedCount: 1 } });
    if (cart) await Cart.updateOne({ _id: cart._id }, { $set: { items: [], discount: 0 }, $unset: { couponCode: 1 } });
    if (body.paymentMethod === "online") {
      if (!env.ssl.storeId || !env.ssl.storePassword) return response.status(201).json({ success: true, data: order, paymentRequired: true, message: "SSLCommerz credentials are not configured" });
      const base = env.ssl.sandbox ? "https://sandbox.sslcommerz.com" : "https://securepay.sslcommerz.com";
      const params = new URLSearchParams({ store_id: env.ssl.storeId, store_passwd: env.ssl.storePassword, total_amount: String(order.total), currency: "BDT", tran_id: order.orderNumber, success_url: `${env.apiPublicUrl}/api/v1/orders/payment/success`, fail_url: `${env.apiPublicUrl}/api/v1/orders/payment/fail`, cancel_url: `${env.apiPublicUrl}/api/v1/orders/payment/cancel`, cus_name: customerName, cus_email: body.customer?.email || "", cus_phone: phone, shipping_method: "Courier", product_name: "Drone Bangladesh Order", product_category: "Electronics", product_profile: "general" });
      const gateway = await fetch(`${base}/gwprocess/v4/api.php`, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: params }).then(r => r.json() as Promise<any>);
      if (gateway.GatewayPageURL) return response.status(201).json({ success: true, data: order, paymentUrl: gateway.GatewayPageURL });
      return response.status(502).json({ success: false, message: "Unable to initialize SSLCommerz payment", data: order });
    }
    response.status(201).json({ success: true, data: order });
  } catch (error) {
    if (reserved.length) await releaseInventory(reserved).catch(() => undefined);
    next(error);
  }
});

async function paymentCallback(request: Request, response: import("express").Response, status: "paid" | "failed") {
  const tranId = String(request.body?.tran_id || request.query?.tran_id || "");
  const order = await Order.findOne({ orderNumber: tranId });
  if (!order) return response.redirect(`${env.frontendUrl}/checkout?payment=${status === "paid" ? "success" : "failed"}`);
  order.paymentStatus = status;
  if (status === "paid") await notifyCustomerOrderInvoice(order.toObject()).catch(err => console.error("Invoice email failed", err));
  await order.save();
  return response.redirect(`${env.frontendUrl}/checkout?payment=${status === "paid" ? "success" : "failed"}&order=${encodeURIComponent(order.orderNumber)}`);
}
orderRouter.post("/payment/success", (req,res,next) => paymentCallback(req,res,"paid").catch(next));
orderRouter.all("/payment/fail", (req,res,next) => paymentCallback(req,res,"failed").catch(next));
orderRouter.all("/payment/cancel", (req,res,next) => paymentCallback(req,res,"failed").catch(next));

orderRouter.get("/mine", requireAuth, async (request, response, next) => {
  try {
    const user = authUser(request);
    if (!user?.id || !mongoose.isValidObjectId(user.id)) return response.status(401).json({ success: false, message: "Authentication required" });
    response.json({ success: true, data: await Order.find({ userId: user.id }).sort({ createdAt: -1 }).lean() });
  } catch (error) { next(error); }
});

orderRouter.get("/track/:orderNumber", async (request, response, next) => {
  try {
    const phone = normalizePhone(request.query.phone);
    if (!phone) return response.status(400).json({ success: false, message: "Phone number is required to track an order" });
    const order = await Order.findOne({ orderNumber: request.params.orderNumber, "customer.phone": phone }).lean();
    if (!order) return response.status(404).json({ success: false, message: "Order not found for this phone number" });
    response.json({ success: true, data: order });
  } catch (error) { next(error); }
});

orderRouter.get("/:orderNumber", requireAuth, async (request, response, next) => {
  try {
    const user = authUser(request);
    const filter: Record<string, unknown> = { orderNumber: request.params.orderNumber };
    if (user?.role !== "admin") filter.userId = user?.id;
    const order = await Order.findOne(filter).lean();
    if (!order) return response.status(404).json({ success: false, message: "Order not found" });
    response.json({ success: true, data: order });
  } catch (error) { next(error); }
});
