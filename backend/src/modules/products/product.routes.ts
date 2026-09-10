import { Router } from "express";
import mongoose from "mongoose";
import { Product } from "./product.model.js";
import { ComboMapping } from "../combo/combo-mapping.model.js";
import { env } from "../../config/env.js";

export const productRouter = Router();

const demoProducts = [
  { slug: "dji-mini-5-pro-fly-more-combo-plus-rc2", name: "DJI Mini 5 Pro Fly More Combo Plus with RC2", price: 117000, oldPrice: 140000, brand: "DJI", category: "Camera Drone", badge: "HOT", images: ["/images/products/mini-5.jpg"], stock: 10 },
  { slug: "dji-air-3s-fly-more-combo", name: "DJI Air 3S Fly More Combo with RC2", price: 154000, oldPrice: 185000, brand: "DJI", category: "Camera Drone", badge: "BEST SELLER", images: ["/images/products/air-3.jpg"], stock: 10 },
];

function presentProduct(product: Record<string, unknown>) {
  const images = Array.isArray(product.images) ? product.images : [];
  return { ...product, id: product._id || product.id, image: product.image || images[0] || "" };
}

function escaped(value: string) { return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
function slugPattern(value: string) {
  return new RegExp(`^${escaped(value.trim()).replace(/[-_\s]+/g, "[-_\\s]+")}$`, "i");
}

productRouter.get("/", async (request, response, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const data = env.enableDemoData ? demoProducts.map((product) => presentProduct(product)) : [];
      return response.json({ success: true, data, meta: { page: 1, limit: 24, total: data.length, pages: data.length ? 1 : 0, demo: env.enableDemoData } });
    }

    const q = typeof request.query.q === "string" ? request.query.q.trim() : "";
    const category = typeof request.query.category === "string" ? request.query.category.trim() : "";
    const brand = typeof request.query.brand === "string" ? request.query.brand.trim() : "";
    const minPrice = Number(request.query.minPrice);
    const maxPrice = Number(request.query.maxPrice);
    const stock = typeof request.query.stock === "string" ? request.query.stock : "";
    const page = Math.max(1, Number(request.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(request.query.limit) || 24));
    const clauses: Record<string, unknown>[] = [{ $or: [{ status: "published" }, { status: { $exists: false } }] }];
    if (q) clauses.push({ $or: [{ name: { $regex: escaped(q), $options: "i" } }, { sku: { $regex: escaped(q), $options: "i" } }, { category: { $regex: escaped(q), $options: "i" } }, { brand: { $regex: escaped(q), $options: "i" } }, { shortDescription: { $regex: escaped(q), $options: "i" } }] });
    if (category) clauses.push({ category: slugPattern(category) });
    if (brand) clauses.push({ brand: slugPattern(brand) });
    if (Number.isFinite(minPrice) || Number.isFinite(maxPrice)) {
      const range: Record<string, number> = {};
      if (Number.isFinite(minPrice)) range.$gte = Math.max(0, minPrice);
      if (Number.isFinite(maxPrice)) range.$lte = Math.max(0, maxPrice);
      clauses.push({ price: range });
    }
    if (stock === "in") clauses.push({ stock: { $gt: 0 } });
    if (stock === "out") clauses.push({ stock: { $lte: 0 } });
    const menu = typeof request.query.menu === "string" ? request.query.menu.trim().toLowerCase() : "";
    if (["drones", "handhelds", "enterprise"].includes(menu)) clauses.push({ menuPlacements: { $elemMatch: { menu, isActive: true } } });

    const filter: Record<string, unknown> = { isActive: true, $and: clauses };
    for (const flag of ["isFeatured", "isNewArrival", "isPopular"] as const) if (request.query[flag] === "true") filter[flag] = true;
    const sort: Record<string, 1 | -1> = request.query.sort === "price-asc" ? { price: 1 } : request.query.sort === "price-desc" ? { price: -1 } : request.query.sort === "name" ? { name: 1 } : { createdAt: -1 };
    const [products, total] = await Promise.all([
      Product.find(filter).sort(sort).skip((page - 1) * limit).limit(limit).lean(),
      Product.countDocuments(filter),
    ]);
    response.json({ success: true, data: products.map((product) => presentProduct(product as Record<string, unknown>)), meta: { page, limit, total, pages: total ? Math.ceil(total / limit) : 0 } });
  } catch (error) { next(error); }
});

productRouter.get("/:slug/combo-mappings", async (request, response, next) => {
  try {
    if (mongoose.connection.readyState !== 1) return response.json({ success: true, data: [] });
    const kind = request.query.kind === "accessory" ? "accessory" : request.query.kind === "combo" ? "combo" : undefined;
    const filter: Record<string, unknown> = { productSlug: request.params.slug, status: "published" };
    if (kind) filter.kind = kind;
    const mappings = await ComboMapping.find(filter).sort({ sortOrder: 1, createdAt: 1 }).lean();
    response.json({ success: true, data: mappings });
  } catch (error) { next(error); }
});

productRouter.get("/:slug/mappings", async (request, response, next) => {
  try {
    if (mongoose.connection.readyState !== 1) return response.json({ success: true, data: [] });
    const mappings = await ComboMapping.find({ productSlug: request.params.slug, status: "published" }).sort({ kind: 1, sortOrder: 1, createdAt: 1 }).lean();
    response.json({ success: true, data: mappings });
  } catch (error) { next(error); }
});

productRouter.get("/:slug", async (request, response, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const demo = env.enableDemoData ? demoProducts.find((item) => item.slug === request.params.slug) : undefined;
      if (!demo) return response.status(404).json({ success: false, message: "Product not found" });
      return response.json({ success: true, data: presentProduct(demo) });
    }
    const product = await Product.findOne({ slug: request.params.slug, isActive: true, $or: [{ status: "published" }, { status: { $exists: false } }] }).lean();
    if (!product) return response.status(404).json({ success: false, message: "Product not found" });
    response.json({ success: true, data: presentProduct(product as Record<string, unknown>) });
  } catch (error) { next(error); }
});
