import { Router } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import mongoose from "mongoose";
import { User } from "../users/user.model.js";
import { Cart } from "../cart/cart.model.js";
import { env } from "../../config/env.js";
import { requireAuth } from "../../common/middleware/auth.middleware.js";

export const authRouter = Router();

type Credentials = { name?: string; email?: string; phone?: string; password?: string };
type TokenUser = { id?: string; email: string; role: "customer" | "admin" };

function issueAccessToken(user: TokenUser) {
  const options = user.id ? { subject: user.id, expiresIn: "2h" as const } : { expiresIn: "2h" as const };
  return jwt.sign({ email: user.email, role: user.role }, env.jwtAccessSecret, options);
}
function issueRefreshToken(user: TokenUser) {
  const options = user.id ? { subject: user.id, expiresIn: "14d" as const } : { expiresIn: "14d" as const };
  return jwt.sign({ email: user.email, role: user.role, type: "refresh" }, env.jwtRefreshSecret, options);
}
function cookieOptions(maxAge: number) {
  return { httpOnly: true, secure: env.nodeEnv === "production", sameSite: env.nodeEnv === "production" ? "none" as const : "lax" as const, maxAge, path: "/" };
}
function setAuthCookies(response: import("express").Response, user: TokenUser) {
  const accessToken = issueAccessToken(user);
  const refreshToken = issueRefreshToken(user);
  response.cookie("access_token", accessToken, cookieOptions(1000 * 60 * 60 * 2));
  response.cookie("refresh_token", refreshToken, cookieOptions(1000 * 60 * 60 * 24 * 14));
  return { accessToken, refreshToken };
}
function normalizePhone(value: unknown) {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("8801") && digits.length === 13) return `0${digits.slice(3)}`;
  return digits.startsWith("01") && digits.length === 11 ? digits : String(value || "").trim();
}
function publicUser(user: any) {
  return { id: user.id || (user._id ? String(user._id) : undefined), name: user.name, email: user.email, phone: user.phone, avatar: user.avatar, role: user.role, isActive: user.isActive, starPoints: user.starPoints || 0, storeCredit: user.storeCredit || 0 };
}

async function mergeGuestCart(userId: string, request: import("express").Request) {
  const cookies = (request as typeof request & { cookies?: Record<string, string> }).cookies;
  const sessionId = cookies?.cart_session;
  if (!sessionId || !mongoose.isValidObjectId(userId)) return;
  const [guest, customer] = await Promise.all([Cart.findOne({ sessionId }), Cart.findOne({ userId })]);
  if (!guest?.items.length) return;
  const target = customer || new Cart({ userId, items: [] });
  for (const item of guest.items) {
    const existing = target.items.find((entry) => entry.slug === item.slug);
    if (existing) existing.quantity = Math.min(99, existing.quantity + item.quantity);
    else target.items.push(item.toObject ? item.toObject() : item);
  }
  await target.save();
  await Cart.deleteOne({ _id: guest._id });
}

authRouter.post("/register", async (request, response, next) => {
  try {
    const { name, email, phone, password } = request.body as Credentials;
    if (!name?.trim() || !email?.trim() || !password || password.length < 8) return response.status(400).json({ success: false, message: "Name, email and a password of at least 8 characters are required" });
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return response.status(400).json({ success: false, message: "A valid email address is required" });
    if (mongoose.connection.readyState !== 1) return response.status(503).json({ success: false, message: "Database is not available" });
    const normalizedEmail = email.trim().toLowerCase();
    if (await User.exists({ email: normalizedEmail })) return response.status(409).json({ success: false, message: "An account with this email already exists" });
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name: name.trim(), email: normalizedEmail, phone: normalizePhone(phone), passwordHash, role: "customer" });
    const tokens = setAuthCookies(response, { id: String(user._id), email: user.email, role: user.role });
    await mergeGuestCart(String(user._id), request);
    response.status(201).json({ success: true, data: { token: tokens.accessToken, user: publicUser(user) } });
  } catch (error) { next(error); }
});

authRouter.post("/login", async (request, response, next) => {
  try {
    const { email, password } = request.body as Credentials;
    if (!email?.trim() || !password) return response.status(400).json({ success: false, message: "Email and password are required" });
    const normalizedEmail = email.trim().toLowerCase();
    // Configured admin credentials take precedence over an older customer record.
    if (normalizedEmail === env.adminEmail.toLowerCase() && password === env.adminPassword) {
      const tokens = setAuthCookies(response, { email: env.adminEmail, role: "admin" });
      return response.json({ success: true, data: { token: tokens.accessToken, user: { email: env.adminEmail, role: "admin" } } });
    }
    const user = mongoose.connection.readyState === 1 ? await User.findOne({ email: normalizedEmail, isActive: true }).select("+passwordHash") : null;
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) return response.status(401).json({ success: false, message: "Invalid credentials" });
    const tokens = setAuthCookies(response, { id: String(user._id), email: user.email, role: user.role });
    if (user.role === "customer") await mergeGuestCart(String(user._id), request);
    response.json({ success: true, data: { token: tokens.accessToken, user: publicUser(user) } });
  } catch (error) { next(error); }
});

authRouter.post("/refresh", async (request, response) => {
  try {
    const cookies = (request as typeof request & { cookies?: Record<string, string> }).cookies;
    const token = cookies?.refresh_token;
    if (!token) return response.status(401).json({ success: false, message: "Refresh token is required" });
    const payload = jwt.verify(token, env.jwtRefreshSecret) as { sub?: string; email?: string; role?: string; type?: string };
    if (payload.type !== "refresh" || !payload.email || (payload.role !== "customer" && payload.role !== "admin")) throw new Error("Invalid refresh token");
    if (payload.sub && mongoose.connection.readyState === 1) {
      const record = await User.findById(payload.sub).lean();
      if (!record?.isActive) return response.status(401).json({ success: false, message: "Account is not active" });
    }
    const accessToken = issueAccessToken({ id: payload.sub, email: payload.email, role: payload.role });
    response.cookie("access_token", accessToken, cookieOptions(1000 * 60 * 60 * 2));
    return response.json({ success: true, data: { token: accessToken } });
  } catch {
    response.clearCookie("refresh_token", { path: "/" });
    return response.status(401).json({ success: false, message: "Refresh token is invalid or expired" });
  }
});

authRouter.post("/forgot-password", async (request, response, next) => {
  try {
    const email = String(request.body?.email || "").trim().toLowerCase();
    if (!email) return response.status(400).json({ success: false, message: "Email is required" });
    const user = await User.findOne({ email, role: "customer", isActive: true }).select("+passwordResetTokenHash +passwordResetExpiresAt");
    if (!user) return response.json({ success: true, message: "If the account exists, a reset request has been created. Contact support if you need assistance." });
    const token = crypto.randomBytes(32).toString("hex");
    user.passwordResetTokenHash = crypto.createHash("sha256").update(token).digest("hex");
    user.passwordResetExpiresAt = new Date(Date.now() + 30 * 60 * 1000);
    await user.save();
    const data = env.nodeEnv === "production" ? undefined : { resetToken: token };
    return response.json({ success: true, message: "Password reset request created. In production, connect an email provider or contact support.", data });
  } catch (error) { next(error); }
});

authRouter.post("/reset-password", async (request, response, next) => {
  try {
    const token = String(request.body?.token || "");
    const password = String(request.body?.password || "");
    if (!token || password.length < 8) return response.status(400).json({ success: false, message: "Valid reset token and an 8+ character password are required" });
    const hash = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({ passwordResetTokenHash: hash, passwordResetExpiresAt: { $gt: new Date() } }).select("+passwordHash +passwordResetTokenHash +passwordResetExpiresAt");
    if (!user) return response.status(400).json({ success: false, message: "Reset token is invalid or expired" });
    user.passwordHash = await bcrypt.hash(password, 12);
    user.passwordResetTokenHash = undefined;
    user.passwordResetExpiresAt = undefined;
    await user.save();
    response.json({ success: true, message: "Password reset successfully" });
  } catch (error) { next(error); }
});

authRouter.post("/seed-admin", async (request, response, next) => {
  try {
    const { key, name = "Drone Bangladesh Admin" } = request.body as { key?: string; name?: string };
    if (!env.adminSeedKey || key !== env.adminSeedKey) return response.status(403).json({ success: false, message: "Invalid admin seed key" });
    const passwordHash = await bcrypt.hash(env.adminPassword, 12);
    const user = await User.findOneAndUpdate({ email: env.adminEmail.toLowerCase() }, { $set: { name, passwordHash, role: "admin", isActive: true } }, { upsert: true, new: true, setDefaultsOnInsert: true });
    response.json({ success: true, data: publicUser(user), message: "Admin account is ready" });
  } catch (error) { next(error); }
});

authRouter.post("/logout", (_request, response) => {
  response.clearCookie("access_token", { path: "/" });
  response.clearCookie("refresh_token", { path: "/" });
  response.json({ success: true, message: "Signed out" });
});

authRouter.get("/me", requireAuth, async (request, response, next) => {
  try {
    const user = (request as typeof request & { user: TokenUser }).user;
    const record = user.id && mongoose.connection.readyState === 1 ? await User.findById(user.id).lean() : null;
    response.json({ success: true, data: record ? publicUser(record) : user });
  } catch (error) { next(error); }
});
