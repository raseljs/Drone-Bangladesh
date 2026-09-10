import { Router } from "express";
import { Review } from "./review.model.js";
import { Product } from "../products/product.model.js";
import { requireAuth } from "../../common/middleware/auth.middleware.js";
import { User } from "../users/user.model.js";

export const reviewRouter = Router();
reviewRouter.get("/:slug", async (request, response, next) => {
  try { response.json({ success: true, data: await Review.find({ productSlug: request.params.slug, status: "approved" }).sort({ createdAt: -1 }).lean() }); } catch (error) { next(error); }
});
reviewRouter.post("/:slug", requireAuth, async (request, response, next) => {
  try {
    const auth = (request as typeof request & { user?: { id?: string; role: string } }).user;
    if (!auth?.id || auth.role !== "customer") return response.status(403).json({ success: false, message: "Customer account required" });
    const product = await Product.findOne({ slug: request.params.slug, isActive: true }).lean();
    if (!product) return response.status(404).json({ success: false, message: "Product not found" });
    const customer = await User.findById(auth.id).lean();
    const rating = Number(request.body?.rating);
    const body = String(request.body?.body || "").trim();
    if (!Number.isFinite(rating) || rating < 1 || rating > 5 || !body) return response.status(400).json({ success: false, message: "Rating 1-5 and review text are required" });
    const data = await Review.findOneAndUpdate({ productSlug: product.slug, userId: auth.id }, { $set: { productId: product._id, customerName: customer?.name || "Customer", rating, title: String(request.body?.title || "").trim(), body, status: "pending" } }, { upsert: true, new: true, runValidators: true });
    response.status(201).json({ success: true, data, message: "Review submitted for approval" });
  } catch (error) { next(error); }
});
