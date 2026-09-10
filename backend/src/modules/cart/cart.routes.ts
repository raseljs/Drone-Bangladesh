import { Router, type Request } from "express";
import mongoose from "mongoose";
import crypto from "node:crypto";
import { Cart, cartTotals, type CartOwner } from "./cart.model.js";
import { Product } from "../products/product.model.js";
import { Coupon, calculateDiscount } from "../coupons/coupon.model.js";
import { readCookieToken, readBearerToken, verifyAccessToken } from "../../common/middleware/auth.middleware.js";
import { env } from "../../config/env.js";

export const cartRouter = Router();
type CartRequest = Request & { user?: ReturnType<typeof verifyAccessToken>; cartOwner?: CartOwner; cookies?: Record<string, string> };

cartRouter.use((request, response, next) => {
  try {
    const cookie = readCookieToken(request);
    const bearer = readBearerToken(request.headers.authorization);
    const token = cookie || bearer;
    if (token) {
      const user = verifyAccessToken(token);
      if (user.role === "customer" && user.id && mongoose.isValidObjectId(user.id)) {
        (request as CartRequest).user = user;
        (request as CartRequest).cartOwner = { userId: new mongoose.Types.ObjectId(user.id) };
        return next();
      }
    }
  } catch { /* guest cart */ }
  const req = request as CartRequest;
  const headerSession = typeof request.headers["x-cart-session"] === "string" ? request.headers["x-cart-session"].trim() : "";
  let sessionId = headerSession || req.cookies?.cart_session || "";
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    response.cookie("cart_session", sessionId, { httpOnly: true, sameSite: env.nodeEnv === "production" ? "none" : "lax", secure: env.nodeEnv === "production", maxAge: 1000 * 60 * 60 * 24 * 30, path: "/" });
    req.cookies = { ...(req.cookies || {}), cart_session: sessionId };
  }
  req.cartOwner = { sessionId };
  next();
});

cartRouter.use((_request, response, next) => {
  if (mongoose.connection.readyState !== 1) return response.status(503).json({ success: false, message: "Database is not available" });
  next();
});

function owner(request: Request): CartOwner {
  const resolved = (request as CartRequest).cartOwner;
  if (!resolved) throw Object.assign(new Error("Unable to resolve cart session"), { statusCode: 400 });
  return resolved;
}
function withTotals(cart: any) {
  if (!cart) return { items: [], subtotal: 0, discount: 0, deliveryCharge: 0, total: 0, couponCode: "" };
  const items = cart.items || [];
  return { ...(cart.toObject ? cart.toObject() : cart), ...cartTotals(items, cart.discount || 0) };
}

cartRouter.get("/", async (request, response, next) => {
  try { response.json({ success: true, data: withTotals(await Cart.findOne(owner(request)).lean()) }); } catch (error) { next(error); }
});

cartRouter.post("/items", async (request, response, next) => {
  try {
    const { slug, productId, quantity = 1 } = request.body as { slug?: string; productId?: string; quantity?: number };
    const qty = Math.floor(Number(quantity));
    if ((!slug && !productId) || !Number.isFinite(qty) || qty < 1 || qty > 99) return response.status(400).json({ success: false, message: "A product and quantity between 1 and 99 are required" });
    const product = productId && mongoose.isValidObjectId(productId)
      ? await Product.findOne({ _id: productId, isActive: true, $or: [{ status: "published" }, { status: { $exists: false } }] }).lean()
      : await Product.findOne({ slug, isActive: true, $or: [{ status: "published" }, { status: { $exists: false } }] }).lean();
    if (!product) return response.status(404).json({ success: false, message: "Product is unavailable" });
    const cart = await Cart.findOneAndUpdate(owner(request), { $setOnInsert: owner(request) }, { upsert: true, new: true });
    const existing = cart.items.find((item) => item.slug === product.slug);
    const requestedTotal = (existing?.quantity || 0) + qty;
    if (requestedTotal > 99 || product.stock < requestedTotal) return response.status(409).json({ success: false, message: `Only ${product.stock} item(s) are currently available` });
    if (existing) existing.quantity = requestedTotal;
    else cart.items.push({ productId: product._id, slug: product.slug, name: product.name, image: product.images?.[0], price: product.price, quantity: qty });
    cart.discount = 0; cart.couponCode = undefined;
    await cart.save();
    response.status(201).json({ success: true, data: withTotals(cart) });
  } catch (error) { next(error); }
});

cartRouter.patch("/items/:slug", async (request, response, next) => {
  try {
    const qty = Math.floor(Number(request.body?.quantity));
    if (!Number.isFinite(qty) || qty < 1 || qty > 99) return response.status(400).json({ success: false, message: "Quantity must be between 1 and 99" });
    const cart = await Cart.findOne(owner(request));
    const item = cart?.items.find((entry) => entry.slug === request.params.slug);
    if (!cart || !item) return response.status(404).json({ success: false, message: "Cart item not found" });
    const product = await Product.findOne({ slug: request.params.slug, isActive: true }).select("stock").lean();
    if (!product || product.stock < qty) return response.status(409).json({ success: false, message: "Requested quantity is not available" });
    item.quantity = qty; cart.discount = 0; cart.couponCode = undefined; await cart.save();
    response.json({ success: true, data: withTotals(cart) });
  } catch (error) { next(error); }
});

cartRouter.delete("/items/:slug", async (request, response, next) => {
  try {
    const cart = await Cart.findOne(owner(request));
    if (!cart) return response.status(404).json({ success: false, message: "Cart not found" });
    cart.items.splice(0, cart.items.length, ...cart.items.filter((entry) => entry.slug !== request.params.slug));
    cart.discount = 0; cart.couponCode = undefined; await cart.save();
    response.json({ success: true, data: withTotals(cart) });
  } catch (error) { next(error); }
});

cartRouter.post("/coupon", async (request, response, next) => {
  try {
    const code = String(request.body?.code || "").trim().toUpperCase();
    if (!code) return response.status(400).json({ success: false, message: "Coupon code is required" });
    const cart = await Cart.findOne(owner(request));
    if (!cart?.items.length) return response.status(400).json({ success: false, message: "Your cart is empty" });
    const subtotal = cartTotals(cart.items).subtotal;
    const now = new Date();
    const coupon = await Coupon.findOne({ code, isActive: true, $and: [{ $or: [{ startsAt: { $exists: false } }, { startsAt: null }, { startsAt: { $lte: now } }] }, { $or: [{ expiresAt: { $exists: false } }, { expiresAt: null }, { expiresAt: { $gte: now } }] }] }).lean();
    if (!coupon) return response.status(404).json({ success: false, message: "Coupon is invalid or expired" });
    if (coupon.minimumSubtotal && subtotal < coupon.minimumSubtotal) return response.status(409).json({ success: false, message: `Minimum order amount is ৳${coupon.minimumSubtotal}` });
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) return response.status(409).json({ success: false, message: "Coupon usage limit has been reached" });
    cart.couponCode = code; cart.discount = Math.round(calculateDiscount(coupon as any, subtotal)); await cart.save();
    response.json({ success: true, data: withTotals(cart), message: "Coupon applied" });
  } catch (error) { next(error); }
});

cartRouter.delete("/coupon", async (request, response, next) => {
  try { const cart = await Cart.findOne(owner(request)); if (cart) { cart.couponCode = undefined; cart.discount = 0; await cart.save(); } response.json({ success: true, data: withTotals(cart) }); } catch (error) { next(error); }
});

cartRouter.delete("/", async (request, response, next) => {
  try { await Cart.findOneAndDelete(owner(request)); response.json({ success: true, data: { items: [], subtotal: 0, discount: 0, deliveryCharge: 0, total: 0 } }); } catch (error) { next(error); }
});
