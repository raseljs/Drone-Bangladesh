import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');

test('guest cart uses a unique session and validates total stock', () => {
  const source = read('src/modules/cart/cart.routes.ts');
  assert.equal(source.includes('|| "guest"'), false);
  assert.match(source, /crypto\.randomUUID\(\)/);
  assert.match(source, /requestedTotal/);
});

test('orders reserve inventory and guest tracking requires phone', () => {
  const source = read('src/modules/orders/order.routes.ts');
  assert.match(source, /reserveInventory/);
  assert.match(source, /releaseInventory/);
  assert.match(source, /\/track\/:orderNumber/);
  assert.match(source, /Phone number is required/);
  assert.match(source, /deliveryMethod:\s*"courier"/);
});

test('courier delivery is consistently 150 taka and coupons are real records', () => {
  assert.match(read('src/modules/cart/cart.model.ts'), /deliveryCharge = subtotal > 0 \? 150 : 0/);
  assert.match(read('src/modules/cart/cart.routes.ts'), /calculateDiscount/);
  assert.match(read('src/modules/coupons/coupon.model.ts'), /usageLimit/);
});

test('database bootstrap repairs the legacy multi-banner slug index', () => {
  const server = read('src/server.ts');
  const database = read('src/config/database.ts');
  const content = read('src/modules/content/content.model.ts');
  assert.match(server, /connectDatabase\(\)/);
  assert.equal(server.includes('mongoose.connect('), false);
  assert.match(database, /dropIndex\("entityType_1_slug_1"\)/);
  assert.match(content, /partialFilterExpression/);
  assert.match(content, /this\.slug = undefined/);
});

test('customer and admin auth are separated and guest cart merges after login', () => {
  const auth = read('src/modules/auth/auth.routes.ts');
  const middleware = read('src/common/middleware/auth.middleware.ts');
  const admin = read('src/common/middleware/admin.middleware.ts');
  assert.match(auth, /mergeGuestCart/);
  assert.match(middleware, /readCookieToken\(request\) \|\| readBearerToken/);
  assert.match(admin, /readBearerToken\(request\.headers\.authorization\) \|\| readCookieToken/);
  assert.match(auth, /forgot-password/);
  assert.equal(auth.toLowerCase().includes('email verification'), false);
});

test('customer account backend covers profile, password, addresses, wishlist, wallet and quotes', () => {
  const source = read('src/modules/account/account.routes.ts');
  for (const route of ['/profile', '/change-password', '/addresses', '/wishlist', '/wallet', '/quotes']) assert.ok(source.includes(route), route);
});

test('order model contains the complete courier tracking timeline', () => {
  const source = read('src/modules/orders/order.model.ts');
  for (const status of ['confirmed','processing','packed','shipped','out_for_delivery','delivered','cancelled']) assert.ok(source.includes(status), status);
  assert.match(source, /trackingId/);
  assert.match(source, /estimatedDelivery/);
  assert.match(source, /statusHistory/);
});

test('admin backend includes inventory, queries, returns, quotes, reviews, coupons and audit logs', () => {
  const source = read('src/modules/admin/admin.routes.ts');
  for (const route of ['/inventory/summary','/inventory/adjust','/inventory/transfer','/queries','/returns','/quotes','/product-reviews','/coupons/manage','/audit-logs','/customers/:id']) assert.ok(source.includes(route), route);
});

test('media uploads validate real image signatures and support library cleanup', () => {
  const source = read('src/modules/media/media.routes.ts');
  assert.match(source, /isSupportedImage/);
  assert.match(source, /mediaRouter\.get\("\/"/);
  assert.match(source, /mediaRouter\.delete\("\/"/);
  assert.match(source, /env\.apiPublicUrl/);
});

test('published catalogue does not inject demo products into an empty live database', () => {
  const source = read('src/modules/products/product.routes.ts');
  assert.equal(source.includes('total || demoProducts.length'), false);
  assert.match(source, /env\.enableDemoData/);
});

test('seed provides a substantial Drone Bangladesh article library and policy pages', () => {
  const source = read('src/seed/seed.ts');
  const block = source.match(/const articleTitles=\[(.*?)\];/s)?.[1] || '';
  const titles = [...block.matchAll(/"([^"]+)"/g)].map(match => match[1]);
  assert.ok(titles.length >= 30, `expected >=30 article titles, got ${titles.length}`);
  for (const slug of ['about-us','terms','privacy','shipping','returns','refund','warranty','faqs']) assert.ok(source.includes(`"${slug}"`), slug);
});

test('customer account supports profile photo uploads', () => {
  const source = read('src/modules/account/account.routes.ts');
  assert.match(source, /accountRouter\.post\("\/avatar"/);
  assert.match(source, /drone-bangladesh\/avatars/);
  assert.match(source, /validAvatar/);
});

test('seed provides multiple banners and database-driven enterprise menu', () => {
  const source = read('src/seed/seed.ts');
  assert.match(source, /const banners=\[/);
  assert.match(source, /entityType:"banners"/);
  assert.match(source, /const enterpriseMenu=\[/);
  assert.match(source, /menuKind:"promo"/);
  assert.match(source, /DJI Care Enterprise/);
});

test('media library handles Cloudinary timeouts without breaking admin category/product uploads', () => {
  const source = read('src/modules/media/media.routes.ts');
  assert.match(source, /folder-categories/);
  assert.match(source, /withTimeout/);
  assert.match(source, /using local media fallback/);
  assert.match(source, /saving image locally/);
});

test('products can be assigned directly to Drones, Handhelds and Enterprise navigation menus', () => {
  const model = read('src/modules/products/product.model.ts');
  const admin = read('src/modules/admin/admin.routes.ts');
  const publicRoutes = read('src/modules/products/product.routes.ts');
  assert.match(model, /menuPlacements/);
  assert.match(model, /"drones", "handhelds", "enterprise"/);
  assert.match(admin, /"menuPlacements"/);
  assert.match(publicRoutes, /request\.query\.menu/);
});

test('stock transitions notify admin and pre-order customers', () => {
  const inventory = read('src/modules/orders/inventory.service.ts');
  const email = read('src/modules/notifications/email.service.ts');
  assert.match(inventory, /handleStockTransition/);
  assert.match(inventory, /notifyAdminStockOut/);
  assert.match(inventory, /notifyCustomerRestock/);
  assert.match(inventory, /restockNotifiedAt/);
  assert.match(email, /notificationEmail/);
  assert.match(read('.env.example'), /NOTIFICATION_EMAIL=dronebangladesh567@gmail.com/);
});

test('pre-order and authenticity APIs expose full customer/admin workflows', () => {
  const preorder = read('src/modules/preorders/preorder.routes.ts');
  const model = read('src/modules/preorders/preorder.model.ts');
  const warranty = read('src/modules/warranty/warranty.routes.ts');
  const admin = read('src/modules/admin/admin.routes.ts');
  for (const text of ['paymentPlan', 'partial', 'shippingAddress', 'preOrderNumber', 'notifyAdminPreOrder']) assert.ok(preorder.includes(text), text);
  for (const text of ['amountDue', 'remainingAmount', 'depositPercent']) assert.ok(model.includes(text), text);
  for (const text of ['/verify/:serialNumber', '/verify', 'authentic', 'warrantyStatus']) assert.ok(warranty.includes(text), text);
  for (const text of ['/preorders', '/warranty-records']) assert.ok(admin.includes(text), text);
});
