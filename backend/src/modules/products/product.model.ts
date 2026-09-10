import { Schema, model } from "mongoose";

const menuPlacementSchema = new Schema({
  menu: { type: String, enum: ["drones", "handhelds", "enterprise"], required: true },
  group: { type: String, required: true, trim: true },
  sortOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { _id: false });

const productSchema = new Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, index: true },
  // Keep brands data-driven so the admin can add DJI, Autel, Insta360,
  // Sony, and future manufacturers without a schema migration.
  brand: { type: String, trim: true, default: "DJI" },
  category: { type: String, required: true },
  sku: String,
  images: [String],
  youtubeUrl: String,
  shortDescription: String,
  description: String,
  descriptionHtml: String,
  descriptionCss: String,
  keyFeatures: [String],
  specifications: { type: Map, of: String },
  price: { type: Number, required: true },
  oldPrice: Number,
  discount: Number,
  stock: { type: Number, default: 0 },
  // Products marked for preorder can collect bookings while stock is zero or
  // before an upcoming launch. Admin can disable this per SKU at any time.
  preorderEnabled: { type: Boolean, default: true },
  preorderDepositPercent: { type: Number, default: 30, min: 1, max: 100 },
  preorderNote: { type: String, default: "Reserve this product before the next shipment arrives." },
  reorderLevel: { type: Number, default: 5, min: 0 },
  unitCost: { type: Number, default: 0, min: 0 },
  warehouse: { type: String, default: "Dhaka Main Warehouse" },
  supplier: { type: String, default: "" },
  badge: String,
  status: { type: String, enum: ["draft", "published", "archived"], default: "published", index: true },
  isFeatured: { type: Boolean, default: false },
  isNewArrival: { type: Boolean, default: false },
  isPopular: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  menuPlacements: { type: [menuPlacementSchema], default: [] },
}, { timestamps: true });

export const Product = model("Product", productSchema);
