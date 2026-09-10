import mongoose from "mongoose";
import { Product } from "../products/product.model.js";
import { StockActivity } from "../inventory/inventory.model.js";
import { PreOrder } from "../preorders/preorder.model.js";
import { notifyAdminStockOut, notifyCustomerRestock } from "../notifications/email.service.js";

export type InventoryLine = { productId?: unknown; name?: string; quantity: number };

async function record(product: any, type: "order" | "cancel_restore" | "stock_in" | "stock_out" | "adjustment" | "transfer" | "return", quantity: number, before: number, after: number, reference?: string, actor?: string, note?: string) {
  await StockActivity.create({ productId: product._id, sku: product.sku, warehouse: product.warehouse || "Dhaka Main Warehouse", type, quantity, before, after, reference, actor, note }).catch(() => undefined);
}

/** Fire-and-forget alerts around the two meaningful inventory transitions. */
export async function handleStockTransition(product: any, before: number, after: number, reference?: string) {
  const wasAvailable = Number(before || 0) > 0;
  const isAvailable = Number(after || 0) > 0;
  if (wasAvailable && !isAvailable) {
    void notifyAdminStockOut({ name: product.name, slug: product.slug, sku: product.sku, stock: Number(after || 0) }, reference).catch((error) => console.error("Stock-out notification failed:", error));
  }
  if (!wasAvailable && isAvailable) {
    const pending = await PreOrder.find({ productId: product._id, status: { $in: ["pending", "confirmed", "ready"] }, "customer.email": { $exists: true }, restockNotifiedAt: { $exists: false } }).select("preOrderNumber customer productName productSlug").lean();
    await Promise.allSettled(pending.map(async (entry: any) => {
      try {
        const delivery = await notifyCustomerRestock({ name: entry.customer?.name || "Customer", email: entry.customer?.email }, { name: entry.productName || product.name, slug: entry.productSlug || product.slug, stock: Number(after || 0) });
        if (delivery.sent) await PreOrder.updateOne({ _id: entry._id }, { $set: { restockNotifiedAt: new Date(), status: "ready" } });
      } catch (error) { console.error("Restock notification failed:", error); }
    }));
  }
}

export async function reserveInventory(items: InventoryLine[], reference?: string) {
  const reserved: Array<{ productId: unknown; quantity: number }> = [];
  for (const item of items) {
    if (!item.productId || !mongoose.isValidObjectId(String(item.productId))) throw Object.assign(new Error(`Inventory record is missing for ${item.name || "a product"}`), { statusCode: 409 });
    const product = await Product.findById(item.productId);
    if (!product || product.stock < item.quantity) throw Object.assign(new Error(`Requested quantity is not available for ${item.name || product?.name || "a product"}`), { statusCode: 409 });
    const before = product.stock;
    product.stock -= item.quantity;
    await product.save();
    await record(product, "order", -item.quantity, before, product.stock, reference);
    await handleStockTransition(product, before, product.stock, reference);
    reserved.push({ productId: product._id, quantity: item.quantity });
  }
  return reserved;
}

export async function releaseInventory(items: InventoryLine[], reference?: string) {
  for (const item of items) {
    if (!item.productId || !mongoose.isValidObjectId(String(item.productId))) continue;
    const product = await Product.findById(item.productId);
    if (!product) continue;
    const before = product.stock;
    product.stock += item.quantity;
    await product.save();
    await record(product, "cancel_restore", item.quantity, before, product.stock, reference);
    await handleStockTransition(product, before, product.stock, reference);
  }
}

export async function adjustInventory(productId: string, delta: number, type: "stock_in" | "stock_out" | "adjustment" | "transfer" | "return", reference?: string, actor?: string, note?: string) {
  const product = await Product.findById(productId);
  if (!product) throw Object.assign(new Error("Product not found"), { statusCode: 404 });
  const before = product.stock;
  const after = before + delta;
  if (after < 0) throw Object.assign(new Error("Stock cannot be negative"), { statusCode: 409 });
  product.stock = after;
  await product.save();
  await record(product, type, delta, before, after, reference, actor, note);
  await handleStockTransition(product, before, after, reference);
  return product;
}

export async function transferInventory(productId: string, toWarehouse: string, reference?: string, actor?: string, note?: string) {
  const product = await Product.findById(productId);
  if (!product) throw Object.assign(new Error("Product not found"), { statusCode: 404 });
  const fromWarehouse = product.warehouse || "Dhaka Main Warehouse";
  const target = String(toWarehouse || "").trim();
  if (!target) throw Object.assign(new Error("Destination warehouse is required"), { statusCode: 400 });
  if (fromWarehouse === target) return product;
  const before = product.stock;
  product.warehouse = target;
  await product.save();
  await StockActivity.create({ productId: product._id, sku: product.sku, warehouse: target, type: "transfer", quantity: product.stock, before, after: product.stock, reference, actor, note: note || `Transferred SKU from ${fromWarehouse} to ${target}` }).catch(() => undefined);
  return product;
}
