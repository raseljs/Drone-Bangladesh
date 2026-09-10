import { Router } from "express";
import mongoose from "mongoose";
import { Product } from "../products/product.model.js";
import { ContentEntry } from "../content/content.model.js";
import { requireAdmin } from "../../common/middleware/admin.middleware.js";
import { ComboMapping } from "../combo/combo-mapping.model.js";
import { Order } from "../orders/order.model.js";
import { ContactMessage } from "../contact/contact.model.js";
import { MaintenanceRequest } from "../maintenance/maintenance-request.model.js";
import { User } from "../users/user.model.js";
import { sanitizeRichCss, sanitizeRichHtml } from "../../common/utils/sanitize.js";
import { releaseInventory, reserveInventory, adjustInventory, transferInventory, handleStockTransition } from "../orders/inventory.service.js";
import { Coupon } from "../coupons/coupon.model.js";
import { StockActivity, Warehouse } from "../inventory/inventory.model.js";
import { CustomerQuery } from "../queries/query.model.js";
import { ReturnRequest } from "../returns/return.model.js";
import { Quote } from "../quotes/quote.model.js";
import { Review } from "../reviews/review.model.js";
import { AuditLog } from "../audit/audit.model.js";
import { PreOrder } from "../preorders/preorder.model.js";
import { WarrantyRecord } from "../warranty/warranty-record.model.js";

export const adminRouter = Router();
adminRouter.use(requireAdmin);
adminRouter.use((_request, response, next) => {
  if (mongoose.connection.readyState !== 1) return response.status(503).json({ success: false, message: "Database is not available" });
  next();
});

const contentResources = ["categories", "brands", "featured-categories", "banners", "articles", "reviews", "faqs", "stores", "accessories", "accessory-mapping", "home-sections", "settings", "mega-menu", "handheld-menu", "enterprise-menu", "all-products-menu", "announcements", "ai-faqs", "maintenance", "coupons", "pages"] as const;
type ContentResource = typeof contentResources[number];
const isContentResource = (resource: string): resource is ContentResource => contentResources.includes(resource as ContentResource);

function cleanHtml(value: unknown) { return sanitizeRichHtml(value); }
function cleanCss(value: unknown) { return sanitizeRichCss(value); }
function slugify(value: string) { return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""); }
function prepareContentBody(resource: string, input: Record<string, unknown>) {
  const body = { ...input };
  delete body.entityType;
  if (body.slug === null || body.slug === undefined || String(body.slug).trim() === "") delete body.slug;
  else body.slug = String(body.slug).trim();
  for (const key of ["bodyHtml", "descriptionHtml"]) if (key in body) body[key] = cleanHtml(body[key]);
  for (const key of ["bodyCss", "descriptionCss"]) if (key in body) body[key] = cleanCss(body[key]);
  if (!body.slug && ["articles", "categories", "brands", "pages"].includes(resource)) {
    const source = String(body.title || body.name || "");
    const generated = slugify(source);
    if (generated) body.slug = generated;
  }
  return body;
}

function productPayload(body: Record<string, unknown>) {
  const fields = ["name", "slug", "brand", "category", "sku", "images", "youtubeUrl", "shortDescription", "description", "descriptionHtml", "descriptionCss", "keyFeatures", "specifications", "price", "oldPrice", "discount", "stock", "preorderEnabled", "preorderDepositPercent", "preorderNote", "reorderLevel", "unitCost", "warehouse", "supplier", "badge", "status", "isFeatured", "isNewArrival", "isPopular", "isActive", "menuPlacements"];
  const payload = Object.fromEntries(fields.filter((field) => field in body).map((field) => [field, body[field]])) as Record<string, unknown>;
  // Accept the singular `image` used by the storefront admin form while
  // persisting the canonical gallery array in MongoDB.
  if (!payload.images && typeof body.image === "string" && body.image.trim()) payload.images = [body.image.trim()];
  if (typeof payload.images === "string") payload.images = [payload.images];
  if ("descriptionHtml" in payload) payload.descriptionHtml = cleanHtml(payload.descriptionHtml);
  if ("descriptionCss" in payload) payload.descriptionCss = cleanCss(payload.descriptionCss);
  return payload;
}

function mappingPayload(body: Record<string, unknown>) {
  const fields = ["productSlug", "kind", "title", "subtitle", "price", "oldPrice", "image", "linkedSlug", "quantity", "status", "sortOrder"];
  return Object.fromEntries(fields.filter((field) => field in body).map((field) => [field, body[field]]));
}

async function writeAudit(request: import("express").Request, action: string, resource: string, resourceId?: unknown, details?: unknown) {
  const actor = (request as typeof request & { user?: { email?: string } }).user;
  await AuditLog.create({ actorEmail: actor?.email || "admin", action, resource, resourceId: resourceId ? String(resourceId) : undefined, details }).catch(() => undefined);
}

adminRouter.get("/dashboard", async (_request, response, next) => {
  try {
    const [products, activeProducts, orders, pendingOrders, content, pendingMaintenance, unreadMessages] = await Promise.all([
      Product.countDocuments(), Product.countDocuments({ isActive: true }), Order.countDocuments(), Order.countDocuments({ deliveryStatus: { $in: ["confirmed", "processing", "packed"] } }), ContentEntry.countDocuments({ status: "published", isActive: true }), MaintenanceRequest.countDocuments({ status: { $in: ["pending", "in_progress"] } }), ContactMessage.countDocuments({ status: "new" }),
    ]);
    response.json({ success: true, data: { products, activeProducts, orders, pendingOrders, pendingMaintenance, unreadMessages, publishedContent: content } });
  } catch (error) { next(error); }
});

adminRouter.get("/products", async (request, response, next) => {
  try {
    const q = typeof request.query.q === "string" ? request.query.q.trim() : "";
    const page = Math.max(1, Number(request.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(request.query.limit) || 25));
    const filter: Record<string, unknown> = {};
    if (q) filter.$or = [{ name: { $regex: q, $options: "i" } }, { sku: { $regex: q, $options: "i" } }, { category: { $regex: q, $options: "i" } }];
    for (const key of ["category", "brand", "badge"] as const) if (typeof request.query[key] === "string" && request.query[key]) filter[key] = request.query[key];
    if (request.query.active === "true" || request.query.active === "false") filter.isActive = request.query.active === "true";
    const [data, total] = await Promise.all([Product.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(), Product.countDocuments(filter)]);
    response.json({ success: true, data, meta: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
});

adminRouter.post("/products", async (request, response, next) => {
  try { const data=await Product.create(productPayload(request.body as Record<string, unknown>)); await writeAudit(request,"create","product",data._id,{name:data.name,sku:data.sku}); response.status(201).json({ success: true, data }); } catch (error) { next(error); }
});

adminRouter.patch("/products/:id", async (request, response, next) => {
  try {
    if (!mongoose.isValidObjectId(request.params.id)) return response.status(400).json({ success: false, message: "Invalid product id" });
    const previous = await Product.findById(request.params.id).select("name slug sku stock").lean();
    const data = await Product.findByIdAndUpdate(request.params.id, productPayload(request.body as Record<string, unknown>), { new: true, runValidators: true });
    if (!data) return response.status(404).json({ success: false, message: "Product not found" });
    if (previous && Number(previous.stock || 0) !== Number(data.stock || 0)) void handleStockTransition(data, Number(previous.stock || 0), Number(data.stock || 0), `ADMIN-${data._id}`).catch((error) => console.error("Stock transition notification failed:", error));
    await writeAudit(request,"update","product",data._id,{name:data.name,sku:data.sku});
    response.json({ success: true, data });
  } catch (error) { next(error); }
});

adminRouter.delete("/products/:id", async (request, response, next) => {
  try {
    if (!mongoose.isValidObjectId(request.params.id)) return response.status(400).json({ success: false, message: "Invalid product id" });
    const data = await Product.findByIdAndDelete(request.params.id);
    if (!data) return response.status(404).json({ success: false, message: "Product not found" });
    await ComboMapping.deleteMany({ $or: [{ productSlug: data.slug }, { linkedSlug: data.slug }] });
    await writeAudit(request,"delete","product",data._id,{name:data.name,sku:data.sku});
    response.json({ success: true, data: { id: request.params.id } });
  } catch (error) { next(error); }
});

async function listMappings(request: import("express").Request, response: import("express").Response, next: import("express").NextFunction) {
  try {
    const filter: Record<string, unknown> = {};
    if (typeof request.query.productSlug === "string" && request.query.productSlug) filter.productSlug = request.query.productSlug;
    if (request.query.kind === "combo" || request.query.kind === "accessory") filter.kind = request.query.kind;
    response.json({ success: true, data: await ComboMapping.find(filter).sort({ productSlug: 1, sortOrder: 1, createdAt: -1 }).lean() });
  } catch (error) { next(error); }
}

adminRouter.get("/combo-mappings", listMappings);
adminRouter.get("/accessory-mappings", listMappings);
adminRouter.post("/combo-mappings", async (request, response, next) => {
  try { response.status(201).json({ success: true, data: await ComboMapping.create(mappingPayload(request.body as Record<string, unknown>)) }); } catch (error) { next(error); }
});
adminRouter.post("/accessory-mappings", async (request, response, next) => {
  try { response.status(201).json({ success: true, data: await ComboMapping.create({ ...mappingPayload(request.body as Record<string, unknown>), kind: "accessory" }) }); } catch (error) { next(error); }
});
adminRouter.patch("/combo-mappings/:id", async (request, response, next) => {
  try {
    if (!mongoose.isValidObjectId(request.params.id)) return response.status(400).json({ success: false, message: "Invalid mapping id" });
    const data = await ComboMapping.findByIdAndUpdate(request.params.id, mappingPayload(request.body as Record<string, unknown>), { new: true, runValidators: true });
    if (!data) return response.status(404).json({ success: false, message: "Mapping not found" });
    response.json({ success: true, data });
  } catch (error) { next(error); }
});
adminRouter.patch("/accessory-mappings/:id", async (request, response, next) => {
  try {
    if (!mongoose.isValidObjectId(request.params.id)) return response.status(400).json({ success: false, message: "Invalid mapping id" });
    const data = await ComboMapping.findByIdAndUpdate(request.params.id, { ...mappingPayload(request.body as Record<string, unknown>), kind: "accessory" }, { new: true, runValidators: true });
    if (!data) return response.status(404).json({ success: false, message: "Mapping not found" });
    response.json({ success: true, data });
  } catch (error) { next(error); }
});
adminRouter.delete(["/combo-mappings/:id", "/accessory-mappings/:id"], async (request, response, next) => {
  try {
    if (!mongoose.isValidObjectId(request.params.id)) return response.status(400).json({ success: false, message: "Invalid mapping id" });
    const data = await ComboMapping.findByIdAndDelete(request.params.id);
    if (!data) return response.status(404).json({ success: false, message: "Mapping not found" });
    response.json({ success: true, data: { id: request.params.id } });
  } catch (error) { next(error); }
});

adminRouter.get("/orders", async (request, response, next) => {
  try {
    const filter: Record<string, unknown> = {};
    if (typeof request.query.deliveryStatus === "string") filter.deliveryStatus = request.query.deliveryStatus;
    if (typeof request.query.paymentStatus === "string") filter.paymentStatus = request.query.paymentStatus;
    response.json({ success: true, data: await Order.find(filter).sort({ createdAt: -1 }).limit(200).lean() });
  } catch (error) { next(error); }
});
adminRouter.patch("/orders/:id", async (request, response, next) => {
  try {
    if (!mongoose.isValidObjectId(request.params.id)) return response.status(400).json({ success: false, message: "Invalid order id" });
    const allowed = ["paymentStatus", "deliveryStatus", "notes", "courierPartner", "trackingId", "estimatedDelivery"];
    const changes = Object.fromEntries(allowed.filter((key) => key in request.body).map((key) => [key, request.body[key]]));
    const current = await Order.findById(request.params.id);
    if (!current) return response.status(404).json({ success: false, message: "Order not found" });
    const nextDelivery = typeof changes.deliveryStatus === "string" ? changes.deliveryStatus : current.deliveryStatus;
    if (current.deliveryStatus !== "cancelled" && nextDelivery === "cancelled") {
      await releaseInventory(current.items.map((item) => ({ productId: item.productId, quantity: item.quantity })), current.orderNumber);
    } else if (current.deliveryStatus === "cancelled" && nextDelivery !== "cancelled") {
      await reserveInventory(current.items.map((item) => ({ productId: item.productId, name: item.name, quantity: item.quantity })), current.orderNumber);
    }
    const statusChanged = typeof changes.deliveryStatus === "string" && changes.deliveryStatus !== current.deliveryStatus;
    const statusNote = String(request.body?.statusNote || "").trim();
    Object.assign(current, changes);
    if (statusChanged || statusNote) current.statusHistory.push({ status: String(changes.deliveryStatus || current.deliveryStatus), note: statusNote || "Status updated", actor: (request as typeof request & { user?: { email?: string } }).user?.email || "admin", at: new Date() } as any);
    if (statusChanged && nextDelivery === "delivered" && current.userId && !Number(current.pointsAwarded || 0)) {
      const points = Math.max(0, Math.floor(Number(current.subtotal || 0) / 1000));
      if (points > 0) {
        const customer = await User.findById(current.userId);
        if (customer) {
          customer.starPoints = Number(customer.starPoints || 0) + points;
          customer.transactions.push({ type: "points_earn", amount: points, balanceAfter: customer.starPoints, reference: current.orderNumber, note: "Points earned after order delivery" } as any);
          await customer.save();
          current.pointsAwarded = points;
        }
      }
    }
    await current.save();
    await writeAudit(request,"update","order",current._id,{orderNumber:current.orderNumber,deliveryStatus:current.deliveryStatus,paymentStatus:current.paymentStatus});
    response.json({ success: true, data: current });
  } catch (error) { next(error); }
});

adminRouter.get("/contact-messages", async (request, response, next) => {
  try {
    const filter: Record<string, unknown> = {};
    if (typeof request.query.status === "string") filter.status = request.query.status;
    response.json({ success: true, data: await ContactMessage.find(filter).sort({ createdAt: -1 }).limit(200).lean() });
  } catch (error) { next(error); }
});
adminRouter.patch("/contact-messages/:id", async (request, response, next) => {
  try {
    if (!mongoose.isValidObjectId(request.params.id)) return response.status(400).json({ success: false, message: "Invalid message id" });
    const allowed = ["status", "notes"];
    const changes = Object.fromEntries(allowed.filter((key) => key in request.body).map((key) => [key, request.body[key]]));
    const data = await ContactMessage.findByIdAndUpdate(request.params.id, changes, { new: true, runValidators: true });
    if (!data) return response.status(404).json({ success: false, message: "Message not found" });
    response.json({ success: true, data });
  } catch (error) { next(error); }
});
adminRouter.delete("/contact-messages/:id", async (request, response, next) => {
  try {
    if (!mongoose.isValidObjectId(request.params.id)) return response.status(400).json({ success: false, message: "Invalid message id" });
    const data = await ContactMessage.findByIdAndDelete(request.params.id);
    if (!data) return response.status(404).json({ success: false, message: "Message not found" });
    response.json({ success: true, data: { id: request.params.id } });
  } catch (error) { next(error); }
});

adminRouter.get("/maintenance-requests", async (request, response, next) => {
  try {
    const filter: Record<string, unknown> = {};
    if (typeof request.query.status === "string") filter.status = request.query.status;
    response.json({ success: true, data: await MaintenanceRequest.find(filter).sort({ createdAt: -1 }).limit(200).lean() });
  } catch (error) { next(error); }
});
adminRouter.patch("/maintenance-requests/:id", async (request, response, next) => {
  try {
    if (!mongoose.isValidObjectId(request.params.id)) return response.status(400).json({ success: false, message: "Invalid request id" });
    const allowed = ["status", "notes", "preferredDate"];
    const changes = Object.fromEntries(allowed.filter((key) => key in request.body).map((key) => [key, request.body[key]]));
    const data = await MaintenanceRequest.findByIdAndUpdate(request.params.id, changes, { new: true, runValidators: true });
    if (!data) return response.status(404).json({ success: false, message: "Maintenance request not found" });
    response.json({ success: true, data });
  } catch (error) { next(error); }
});


adminRouter.get("/customers", async (request, response, next) => {
  try {
    const q = typeof request.query.q === "string" ? request.query.q.trim() : "";
    const filter: Record<string, unknown> = { role: "customer" };
    if (q) filter.$or = [{ name: { $regex: q, $options: "i" } }, { email: { $regex: q, $options: "i" } }, { phone: { $regex: q, $options: "i" } }];
    const data = await User.find(filter).select("-passwordHash").sort({ createdAt: -1 }).limit(500).lean();
    response.json({ success: true, data });
  } catch (error) { next(error); }
});

adminRouter.get("/reports/summary", async (_request, response, next) => {
  try {
    const [orderSummary, lowStock, customers] = await Promise.all([
      Order.aggregate([
        { $match: { deliveryStatus: { $ne: "cancelled" } } },
        { $group: { _id: null, revenue: { $sum: "$total" }, orders: { $sum: 1 }, averageOrder: { $avg: "$total" } } },
      ]),
      Product.find({ isActive: true, stock: { $lte: 5 } }).select("name slug sku stock").sort({ stock: 1 }).limit(50).lean(),
      User.countDocuments({ role: "customer", isActive: true }),
    ]);
    response.json({ success: true, data: { ...(orderSummary[0] || { revenue: 0, orders: 0, averageOrder: 0 }), customers, lowStock } });
  } catch (error) { next(error); }
});



adminRouter.get("/inventory/summary", async (_request, response, next) => {
  try {
    const products = await Product.find({ isActive: true }).select("name slug sku category stock reorderLevel unitCost warehouse supplier images updatedAt").sort({ name: 1 }).lean();
    const data = products.map((p: any) => ({ ...p, stockValue: Number(p.stock || 0) * Number(p.unitCost || 0), stockStatus: Number(p.stock || 0) <= 0 ? "out_of_stock" : Number(p.stock || 0) <= Number(p.reorderLevel || 5) ? "low_stock" : "in_stock" }));
    const warehouses = Object.values(data.reduce((acc:any, x:any) => { const name=x.warehouse||"Dhaka Main Warehouse"; acc[name] ||= { name, totalSkus:0, stockValue:0, lowStockAlerts:0 }; acc[name].totalSkus += 1; acc[name].stockValue += x.stockValue; if(x.stockStatus!=="in_stock") acc[name].lowStockAlerts += 1; return acc; }, {}));
    response.json({ success: true, data, meta: { totalSkus: data.length, inStock: data.filter((x:any)=>x.stockStatus==="in_stock").length, lowStock: data.filter((x:any)=>x.stockStatus==="low_stock").length, outOfStock: data.filter((x:any)=>x.stockStatus==="out_of_stock").length, inventoryValue: data.reduce((sum:number,x:any)=>sum+x.stockValue,0), warehouses } });
  } catch (error) { next(error); }
});
adminRouter.get("/inventory/activity", async (_request, response, next) => { try { response.json({ success: true, data: await StockActivity.find().sort({ createdAt: -1 }).limit(200).populate("productId", "name images").lean() }); } catch (error) { next(error); } });
adminRouter.post("/inventory/adjust", async (request, response, next) => {
  try {
    const productId = String(request.body?.productId || ""); const delta = Number(request.body?.delta);
    if (!mongoose.isValidObjectId(productId) || !Number.isFinite(delta) || delta === 0) return response.status(400).json({ success:false, message:"Valid product and non-zero stock quantity are required" });
    const data = await adjustInventory(productId, delta, delta > 0 ? "stock_in" : "stock_out", String(request.body?.reference || ""), (request as typeof request & { user?: { email?: string } }).user?.email, String(request.body?.note || ""));
    await writeAudit(request,"stock_adjustment","inventory",productId,{delta,stock:data.stock});
    response.json({ success:true, data });
  } catch (error) { next(error); }
});
adminRouter.post("/inventory/transfer", async (request, response, next) => { try { const productId=String(request.body?.productId||""); const toWarehouse=String(request.body?.toWarehouse||"").trim(); if(!mongoose.isValidObjectId(productId)||!toWarehouse)return response.status(400).json({success:false,message:"Product and destination warehouse are required"}); const warehouse=await Warehouse.findOne({name:toWarehouse,isActive:true}); if(!warehouse)return response.status(404).json({success:false,message:"Destination warehouse not found"}); const data=await transferInventory(productId,toWarehouse,String(request.body?.reference||`TRF-${Date.now()}`),(request as typeof request & {user?:{email?:string}}).user?.email,String(request.body?.note||"")); await writeAudit(request,"stock_transfer","inventory",productId,{toWarehouse}); response.json({success:true,data}); } catch(error){next(error);} });
adminRouter.get("/warehouses", async (_request, response, next) => { try { response.json({ success:true, data: await Warehouse.find({ isActive:true }).sort({ name:1 }).lean() }); } catch (error) { next(error); } });
adminRouter.post("/warehouses", async (request, response, next) => { try { response.status(201).json({ success:true, data: await Warehouse.create(request.body) }); } catch (error) { next(error); } });

adminRouter.get("/queries", async (request, response, next) => { try { const filter:any={}; if(typeof request.query.status==="string"&&request.query.status) filter.status=request.query.status; if(typeof request.query.type==="string"&&request.query.type) filter.type=request.query.type; const q=typeof request.query.q==="string"?request.query.q.trim():""; if(q) filter.$or=[{subject:{$regex:q,$options:"i"}},{"customer.name":{$regex:q,$options:"i"}},{"customer.email":{$regex:q,$options:"i"}},{"customer.phone":{$regex:q,$options:"i"}}]; response.json({success:true,data:await CustomerQuery.find(filter).sort({createdAt:-1}).limit(500).lean()}); } catch(error){next(error);} });
adminRouter.patch("/queries/:id", async (request,response,next)=>{ try { if(!mongoose.isValidObjectId(request.params.id)) return response.status(400).json({success:false,message:"Invalid query id"}); const update:any={}; if(["new","in_progress","resolved"].includes(String(request.body?.status))) update.status=request.body.status; if(String(request.body?.reply||"").trim()) update.$push={messages:{sender:"admin",name:"Admin",message:String(request.body.reply).trim()}}; const data=await CustomerQuery.findByIdAndUpdate(request.params.id,update,{new:true,runValidators:true}); if(!data)return response.status(404).json({success:false,message:"Query not found"}); response.json({success:true,data}); }catch(error){next(error);} });

adminRouter.get("/returns", async (_request,response,next)=>{try{response.json({success:true,data:await ReturnRequest.find().sort({createdAt:-1}).limit(500).lean()});}catch(error){next(error);}});
adminRouter.patch("/returns/:id", async (request,response,next)=>{try{const allowed=["status","resolutionNote","refundAmount"];const changes=Object.fromEntries(allowed.filter(k=>k in request.body).map(k=>[k,request.body[k]]));const current=await ReturnRequest.findById(request.params.id);if(!current)return response.status(404).json({success:false,message:"Return request not found"});Object.assign(current,changes);if(current.status==="refunded"&&!current.creditApplied&&current.userId&&Number(current.refundAmount||0)>0){const customer=await User.findById(current.userId);if(customer){const amount=Number(current.refundAmount||0);customer.storeCredit=Number(customer.storeCredit||0)+amount;customer.transactions.push({type:"refund",amount,balanceAfter:customer.storeCredit,reference:current.returnNumber,note:`Refund credit for ${current.orderNumber}`} as any);await customer.save();current.creditApplied=true;}}await current.save();response.json({success:true,data:current});}catch(error){next(error);}});
adminRouter.get("/quotes", async (_request,response,next)=>{try{response.json({success:true,data:await Quote.find().sort({createdAt:-1}).limit(500).lean()});}catch(error){next(error);}});
adminRouter.patch("/quotes/:id", async (request,response,next)=>{try{const allowed=["status","adminResponse","quotedAmount"];const changes=Object.fromEntries(allowed.filter(k=>k in request.body).map(k=>[k,request.body[k]]));const data=await Quote.findByIdAndUpdate(request.params.id,changes,{new:true,runValidators:true});if(!data)return response.status(404).json({success:false,message:"Quote not found"});response.json({success:true,data});}catch(error){next(error);}});
adminRouter.get("/product-reviews", async (_request,response,next)=>{try{response.json({success:true,data:await Review.find().sort({createdAt:-1}).limit(500).lean()});}catch(error){next(error);}});
adminRouter.patch("/product-reviews/:id", async (request,response,next)=>{try{const status=String(request.body?.status||"");if(!["pending","approved","rejected"].includes(status))return response.status(400).json({success:false,message:"Invalid review status"});const data=await Review.findByIdAndUpdate(request.params.id,{status},{new:true});if(!data)return response.status(404).json({success:false,message:"Review not found"});response.json({success:true,data});}catch(error){next(error);}});

adminRouter.get("/coupons/manage", async (_request,response,next)=>{try{response.json({success:true,data:await Coupon.find().sort({createdAt:-1}).lean()});}catch(error){next(error);}});
adminRouter.post("/coupons/manage", async (request,response,next)=>{try{response.status(201).json({success:true,data:await Coupon.create({...request.body,code:String(request.body?.code||"").trim().toUpperCase()})});}catch(error){next(error);}});
adminRouter.patch("/coupons/manage/:id", async (request,response,next)=>{try{const body={...request.body};if(body.code)body.code=String(body.code).trim().toUpperCase();const data=await Coupon.findByIdAndUpdate(request.params.id,body,{new:true,runValidators:true});if(!data)return response.status(404).json({success:false,message:"Coupon not found"});response.json({success:true,data});}catch(error){next(error);}});
adminRouter.delete("/coupons/manage/:id", async (request,response,next)=>{try{await Coupon.findByIdAndDelete(request.params.id);response.json({success:true,data:{id:request.params.id}});}catch(error){next(error);}});

adminRouter.patch("/customers/:id", async (request,response,next)=>{try{if(!mongoose.isValidObjectId(request.params.id))return response.status(400).json({success:false,message:"Invalid customer id"});const allowed=["name","phone","isActive","starPoints","storeCredit"];const changes=Object.fromEntries(allowed.filter(k=>k in request.body).map(k=>[k,request.body[k]]));const data=await User.findOneAndUpdate({_id:request.params.id,role:"customer"},changes,{new:true,runValidators:true}).select("-passwordHash");if(!data)return response.status(404).json({success:false,message:"Customer not found"});response.json({success:true,data});}catch(error){next(error);}});
adminRouter.get("/audit-logs", async (_request,response,next)=>{try{response.json({success:true,data:await AuditLog.find().sort({createdAt:-1}).limit(500).lean()});}catch(error){next(error);}});

// Pre-orders are reviewed separately from regular orders. Inventory is not
// reserved until an admin converts a ready booking into a normal order.
adminRouter.get("/preorders", async (request, response, next) => {
  try {
    const filter: Record<string, unknown> = {};
    if (typeof request.query.status === "string" && request.query.status) filter.status = request.query.status;
    if (typeof request.query.paymentStatus === "string" && request.query.paymentStatus) filter.paymentStatus = request.query.paymentStatus;
    response.json({ success: true, data: await PreOrder.find(filter).sort({ createdAt: -1 }).limit(500).lean() });
  } catch (error) { next(error); }
});
adminRouter.patch("/preorders/:id", async (request, response, next) => {
  try {
    if (!mongoose.isValidObjectId(request.params.id)) return response.status(400).json({ success: false, message: "Invalid pre-order id" });
    const allowed = ["status", "paymentStatus", "paymentMethod", "notes", "remainingAmount"];
    const changes = Object.fromEntries(allowed.filter((key) => key in request.body).map((key) => [key, request.body[key]]));
    const data = await PreOrder.findByIdAndUpdate(request.params.id, changes, { new: true, runValidators: true });
    if (!data) return response.status(404).json({ success: false, message: "Pre-order not found" });
    await writeAudit(request, "update", "preorder", data._id, { preOrderNumber: data.preOrderNumber, status: data.status, paymentStatus: data.paymentStatus });
    response.json({ success: true, data });
  } catch (error) { next(error); }
});

adminRouter.get("/warranty-records", async (_request, response, next) => {
  try { response.json({ success: true, data: await WarrantyRecord.find().sort({ createdAt: -1 }).limit(1000).lean() }); } catch (error) { next(error); }
});
adminRouter.post("/warranty-records", async (request, response, next) => {
  try {
    const body = request.body as Record<string, unknown>;
    const serialNumber = String(body.serialNumber || "").trim().toUpperCase();
    const productSlug = String(body.productSlug || "").trim();
    const productName = String(body.productName || "").trim();
    const warrantyStart = new Date(String(body.warrantyStart || ""));
    const warrantyEnd = new Date(String(body.warrantyEnd || ""));
    if (!serialNumber || !productSlug || !productName || Number.isNaN(warrantyStart.valueOf()) || Number.isNaN(warrantyEnd.valueOf())) return response.status(400).json({ success: false, message: "Serial, product and valid warranty dates are required" });
    const data = await WarrantyRecord.create({ ...body, serialNumber, productSlug, productName, warrantyStart, warrantyEnd });
    await writeAudit(request, "create", "warranty_record", data._id, { serialNumber, productSlug });
    response.status(201).json({ success: true, data });
  } catch (error) { next(error); }
});
adminRouter.patch("/warranty-records/:id", async (request, response, next) => {
  try {
    if (!mongoose.isValidObjectId(request.params.id)) return response.status(400).json({ success: false, message: "Invalid warranty record id" });
    const allowed = ["serialNumber", "productId", "productSlug", "productName", "purchaseOrderNumber", "customerName", "customerEmail", "warrantyStart", "warrantyEnd", "status", "notes"];
    const changes: Record<string, unknown> = Object.fromEntries(allowed.filter((key) => key in request.body).map((key) => [key, request.body[key]]));
    if (typeof changes.serialNumber === "string") changes.serialNumber = changes.serialNumber.trim().toUpperCase();
    if (changes.warrantyStart) changes.warrantyStart = new Date(String(changes.warrantyStart));
    if (changes.warrantyEnd) changes.warrantyEnd = new Date(String(changes.warrantyEnd));
    const data = await WarrantyRecord.findByIdAndUpdate(request.params.id, changes, { new: true, runValidators: true });
    if (!data) return response.status(404).json({ success: false, message: "Warranty record not found" });
    response.json({ success: true, data });
  } catch (error) { next(error); }
});
adminRouter.delete("/warranty-records/:id", async (request, response, next) => {
  try {
    if (!mongoose.isValidObjectId(request.params.id)) return response.status(400).json({ success: false, message: "Invalid warranty record id" });
    const data = await WarrantyRecord.findByIdAndDelete(request.params.id);
    if (!data) return response.status(404).json({ success: false, message: "Warranty record not found" });
    response.json({ success: true, data: { id: request.params.id } });
  } catch (error) { next(error); }
});

adminRouter.get("/:resource", async (request, response, next) => {
  if (!isContentResource(request.params.resource)) return response.status(404).json({ success: false, message: "Unknown admin resource" });
  try { response.json({ success: true, data: await ContentEntry.find({ entityType: request.params.resource }).sort({ sortOrder: 1, createdAt: -1 }).lean() }); } catch (error) { next(error); }
});
adminRouter.post("/:resource", async (request, response, next) => {
  if (!isContentResource(request.params.resource)) return response.status(404).json({ success: false, message: "Unknown admin resource" });
  try {
    const body = prepareContentBody(request.params.resource, request.body as Record<string, unknown>);
    const data=await ContentEntry.create({ ...body, entityType: request.params.resource }); await writeAudit(request,"create",request.params.resource,data._id,{name:data.name,slug:data.slug}); response.status(201).json({ success: true, data });
  } catch (error) { next(error); }
});
adminRouter.patch("/:resource/:id", async (request, response, next) => {
  if (!isContentResource(request.params.resource)) return response.status(404).json({ success: false, message: "Unknown admin resource" });
  try {
    if (!mongoose.isValidObjectId(request.params.id)) return response.status(400).json({ success: false, message: "Invalid content id" });
    const body = prepareContentBody(request.params.resource, request.body as Record<string, unknown>);
    const data = await ContentEntry.findOneAndUpdate({ _id: request.params.id, entityType: request.params.resource }, body, { new: true, runValidators: true });
    if (!data) return response.status(404).json({ success: false, message: "Content entry not found" });
    await writeAudit(request,"update",request.params.resource,data._id,{name:data.name,slug:data.slug});
    response.json({ success: true, data });
  } catch (error) { next(error); }
});
adminRouter.delete("/:resource/:id", async (request, response, next) => {
  if (!isContentResource(request.params.resource)) return response.status(404).json({ success: false, message: "Unknown admin resource" });
  try {
    if (!mongoose.isValidObjectId(request.params.id)) return response.status(400).json({ success: false, message: "Invalid content id" });
    const data = await ContentEntry.findOneAndDelete({ _id: request.params.id, entityType: request.params.resource });
    if (!data) return response.status(404).json({ success: false, message: "Content entry not found" });
    await writeAudit(request,"delete",request.params.resource,data._id,{name:data.name,slug:data.slug});
    response.json({ success: true, data: { id: request.params.id } });
  } catch (error) { next(error); }
});
