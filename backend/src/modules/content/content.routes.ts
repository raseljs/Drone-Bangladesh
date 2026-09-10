import { Router } from "express";
import mongoose from "mongoose";
import { ContentEntry } from "./content.model.js";
import { ComboMapping } from "../combo/combo-mapping.model.js";

const publicResources = ["categories", "brands", "featured-categories", "banners", "articles", "reviews", "faqs", "stores", "accessories", "accessory-mapping", "home-sections", "settings", "mega-menu", "handheld-menu", "enterprise-menu", "all-products-menu", "announcements", "ai-faqs", "maintenance", "coupons", "pages"];

export const contentRouter = Router();

contentRouter.get("/:resource", async (request, response, next) => {
  if (!publicResources.includes(request.params.resource)) return response.status(404).json({ success: false, message: "Unknown content resource" });
  try {
    if (mongoose.connection.readyState !== 1) return response.json({ success: true, data: [] });
    // Accessory mappings are stored in their dedicated collection so the
    // product detail page can query one source of truth for both combo and
    // standalone accessories. Keep the content URL for frontend compatibility.
    if (request.params.resource === "accessory-mapping") {
      const data = await ComboMapping.find({ status: "published" }).sort({ productSlug: 1, kind: 1, sortOrder: 1, createdAt: -1 }).lean();
      return response.json({ success: true, data });
    }
    const data = await ContentEntry.find({ entityType: request.params.resource, status: "published", isActive: true }).sort({ sortOrder: 1, createdAt: -1 }).lean();
    response.json({ success: true, data });
  } catch (error) { next(error); }
});

contentRouter.get("/:resource/:slug", async (request, response, next) => {
  if (!publicResources.includes(request.params.resource)) return response.status(404).json({ success: false, message: "Unknown content resource" });
  try {
    if (mongoose.connection.readyState !== 1) return response.status(404).json({ success: false, message: "Content entry not found" });
    const data = await ContentEntry.findOne({ entityType: request.params.resource, slug: request.params.slug, status: "published", isActive: true }).lean();
    if (!data) return response.status(404).json({ success: false, message: "Content entry not found" });
    response.json({ success: true, data });
  } catch (error) { next(error); }
});
