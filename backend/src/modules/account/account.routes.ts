import { Router } from "express";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { requireAuth } from "../../common/middleware/auth.middleware.js";
import { User } from "../users/user.model.js";
import { Product } from "../products/product.model.js";
import { Quote } from "../quotes/quote.model.js";
import crypto from "node:crypto";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { v2 as cloudinary } from "cloudinary";
import { env } from "../../config/env.js";

export const accountRouter = Router();
accountRouter.use(requireAuth);

const avatarUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: (_request, file, callback) => callback(null, file.mimetype.startsWith("image/")) });
const avatarRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "uploads", "avatars");
const cloudinaryEnabled = Boolean(env.cloudinary.cloudName && env.cloudinary.apiKey && env.cloudinary.apiSecret);
if (cloudinaryEnabled) cloudinary.config({ cloud_name: env.cloudinary.cloudName, api_key: env.cloudinary.apiKey, api_secret: env.cloudinary.apiSecret, secure: true });
function validAvatar(buffer: Buffer) { const hex=buffer.subarray(0,12).toString("hex"); const ascii=buffer.subarray(0,12).toString("ascii"); return hex.startsWith("ffd8ff") || hex.startsWith("89504e470d0a1a0a") || ascii.startsWith("GIF87a") || ascii.startsWith("GIF89a") || (ascii.slice(0,4)==="RIFF" && ascii.slice(8,12)==="WEBP"); }
function uploadAvatarToCloudinary(buffer: Buffer) { return new Promise<string>((resolve,reject)=>{ const stream=cloudinary.uploader.upload_stream({folder:"drone-bangladesh/avatars",resource_type:"image",transformation:[{width:600,height:600,crop:"limit"}]},(error,result)=>{ if(error||!result?.secure_url)return reject(error||new Error("Avatar upload failed")); resolve(result.secure_url); }); stream.end(buffer); }); }

function currentUser(request: import("express").Request) {
  return (request as typeof request & { user?: { id?: string; email: string; role: string } }).user;
}

function normalizePhone(value: unknown) {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("8801") && digits.length === 13) return `0${digits.slice(3)}`;
  if (digits.startsWith("01") && digits.length === 11) return digits;
  return String(value || "").trim();
}

accountRouter.get("/profile", async (request, response, next) => {
  try {
    const user = currentUser(request);
    const record = user?.id ? await User.findById(user.id).lean() : null;
    if (!record) return response.status(404).json({ success: false, message: "Account not found" });
    response.json({ success: true, data: record });
  } catch (error) { next(error); }
});

accountRouter.patch("/profile", async (request, response, next) => {
  try {
    const user = currentUser(request);
    const name = String(request.body?.name || "").trim();
    const phone = normalizePhone(request.body?.phone);
    const avatar = String(request.body?.avatar || "").trim();
    const changes: Record<string, unknown> = {};
    if (name) changes.name = name;
    if (phone) changes.phone = phone;
    if (avatar || request.body?.avatar === "") changes.avatar = avatar;
    const data = await User.findByIdAndUpdate(user?.id, changes, { new: true, runValidators: true }).lean();
    if (!data) return response.status(404).json({ success: false, message: "Account not found" });
    response.json({ success: true, data });
  } catch (error) { next(error); }
});

accountRouter.post("/avatar", avatarUpload.single("avatar"), async (request, response, next) => {
  try {
    if (!request.file) return response.status(400).json({ success:false, message:"Profile photo is required" });
    if (!validAvatar(request.file.buffer)) return response.status(415).json({ success:false, message:"Unsupported or invalid image file" });
    let avatar = "";
    if (cloudinaryEnabled) avatar = await uploadAvatarToCloudinary(request.file.buffer);
    else { fs.mkdirSync(avatarRoot,{recursive:true}); const extension=request.file.mimetype.includes("png")?"png":request.file.mimetype.includes("webp")?"webp":"jpg"; const filename=`${currentUser(request)?.id || "customer"}-${Date.now()}.${extension}`; fs.writeFileSync(path.join(avatarRoot,filename),request.file.buffer); avatar=`${env.apiPublicUrl}/uploads/avatars/${filename}`; }
    const data = await User.findByIdAndUpdate(currentUser(request)?.id,{avatar},{new:true,runValidators:true}).lean();
    if (!data) return response.status(404).json({ success:false, message:"Account not found" });
    response.status(201).json({ success:true, data:{ avatar:data.avatar } });
  } catch (error) { next(error); }
});

accountRouter.post("/change-password", async (request, response, next) => {
  try {
    const user = currentUser(request);
    const currentPassword = String(request.body?.currentPassword || "");
    const newPassword = String(request.body?.newPassword || "");
    if (newPassword.length < 8) return response.status(400).json({ success: false, message: "New password must be at least 8 characters" });
    const record = await User.findById(user?.id).select("+passwordHash");
    if (!record || !(await bcrypt.compare(currentPassword, record.passwordHash))) return response.status(401).json({ success: false, message: "Current password is incorrect" });
    record.passwordHash = await bcrypt.hash(newPassword, 12);
    await record.save();
    response.json({ success: true, message: "Password changed successfully" });
  } catch (error) { next(error); }
});

accountRouter.get("/addresses", async (request, response, next) => {
  try {
    const record = await User.findById(currentUser(request)?.id).select("addresses").lean();
    response.json({ success: true, data: record?.addresses || [] });
  } catch (error) { next(error); }
});

accountRouter.post("/addresses", async (request, response, next) => {
  try {
    const user = await User.findById(currentUser(request)?.id);
    if (!user) return response.status(404).json({ success: false, message: "Account not found" });
    const line1 = String(request.body?.line1 || "").trim();
    const city = String(request.body?.city || "").trim();
    if (!line1 || !city) return response.status(400).json({ success: false, message: "Address and city are required" });
    if (request.body?.isDefault) user.addresses.forEach((entry: any) => { entry.isDefault = false; });
    user.addresses.push({ ...request.body, phone: normalizePhone(request.body?.phone), line1, city });
    await user.save();
    response.status(201).json({ success: true, data: user.addresses });
  } catch (error) { next(error); }
});

accountRouter.patch("/addresses/:id", async (request, response, next) => {
  try {
    if (!mongoose.isValidObjectId(request.params.id)) return response.status(400).json({ success: false, message: "Invalid address id" });
    const user = await User.findById(currentUser(request)?.id);
    if (!user) return response.status(404).json({ success: false, message: "Account not found" });
    const address = user.addresses.id(request.params.id) as any;
    if (!address) return response.status(404).json({ success: false, message: "Address not found" });
    if (request.body?.isDefault) user.addresses.forEach((entry: any) => { entry.isDefault = false; });
    for (const key of ["label", "recipientName", "phone", "line1", "line2", "area", "city", "district", "postalCode", "isDefault"]) if (key in request.body) address[key] = key === "phone" ? normalizePhone(request.body[key]) : request.body[key];
    await user.save();
    response.json({ success: true, data: user.addresses });
  } catch (error) { next(error); }
});

accountRouter.delete("/addresses/:id", async (request, response, next) => {
  try {
    const user = await User.findById(currentUser(request)?.id);
    if (!user) return response.status(404).json({ success: false, message: "Account not found" });
    const address = user.addresses.id(request.params.id) as any;
    if (!address) return response.status(404).json({ success: false, message: "Address not found" });
    address.deleteOne();
    await user.save();
    response.json({ success: true, data: user.addresses });
  } catch (error) { next(error); }
});

accountRouter.get("/wishlist", async (request, response, next) => {
  try {
    const user = await User.findById(currentUser(request)?.id).select("wishlist").lean();
    const products = await Product.find({ slug: { $in: user?.wishlist || [] }, isActive: true }).lean();
    response.json({ success: true, data: products });
  } catch (error) { next(error); }
});

accountRouter.post("/wishlist/:slug", async (request, response, next) => {
  try {
    const exists = await Product.exists({ slug: request.params.slug, isActive: true });
    if (!exists) return response.status(404).json({ success: false, message: "Product not found" });
    const data = await User.findByIdAndUpdate(currentUser(request)?.id, { $addToSet: { wishlist: request.params.slug } }, { new: true }).select("wishlist").lean();
    response.status(201).json({ success: true, data: data?.wishlist || [] });
  } catch (error) { next(error); }
});

accountRouter.delete("/wishlist/:slug", async (request, response, next) => {
  try {
    const data = await User.findByIdAndUpdate(currentUser(request)?.id, { $pull: { wishlist: request.params.slug } }, { new: true }).select("wishlist").lean();
    response.json({ success: true, data: data?.wishlist || [] });
  } catch (error) { next(error); }
});

accountRouter.get("/wallet", async (request, response, next) => {
  try {
    const data = await User.findById(currentUser(request)?.id).select("starPoints storeCredit transactions").lean();
    response.json({ success: true, data: data || { starPoints: 0, storeCredit: 0, transactions: [] } });
  } catch (error) { next(error); }
});

accountRouter.get("/quotes", async (request, response, next) => {
  try { response.json({ success: true, data: await Quote.find({ userId: currentUser(request)?.id }).sort({ createdAt: -1 }).lean() }); } catch (error) { next(error); }
});
accountRouter.post("/quotes", async (request, response, next) => {
  try {
    const user = await User.findById(currentUser(request)?.id).lean();
    const subject = String(request.body?.subject || "").trim();
    const message = String(request.body?.message || "").trim();
    if (!subject || !message) return response.status(400).json({ success: false, message: "Subject and message are required" });
    const data = await Quote.create({ quoteNumber: `Q-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`, userId: user?._id, name: user?.name, email: user?.email, phone: user?.phone, subject, message });
    response.status(201).json({ success: true, data });
  } catch (error) { next(error); }
});
