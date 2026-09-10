import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');

test('frontend uses native Next.js scripts for Windows-friendly development', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.match(pkg.scripts.dev, /^next dev/);
  assert.match(pkg.scripts.build, /^next build/);
  assert.equal(JSON.stringify(pkg).includes('vinext'), false);
});

test('search and product pages are data-driven', () => {
  assert.match(read('app/search/page.tsx'), /ProductListing/);
  assert.match(read('lib/catalog.ts'), /encodeURIComponent\(slug\)/);
  assert.match(read('app/products/\[slug\]/page.tsx'), /notFound\(\)/);
});

test('admin login cannot bypass a missing backend and customer auth does not attach admin tokens', () => {
  const login = read('app/admin/login/page.tsx');
  const api = read('lib/api.ts');
  assert.equal(login.includes('router.replace("/admin"); return;'), false);
  assert.match(login, /Backend API is not configured/);
  assert.match(api, /path\.startsWith\("\/admin"\)/);
});

test('checkout matches courier-only reference and sends normalized address fields', () => {
  const source = read('components/content-pages.tsx');
  assert.match(source, /Shipping Information/);
  assert.match(source, /Courier Delivery/);
  assert.match(source, /150৳/);
  assert.match(source, /Have a Coupon/);
  assert.match(source, /shippingAddress: \{ line1:/);
  assert.match(source, /Order Note \(Optional\)/);
});

test('customer account includes requested dashboard features and forgot password without email verification', () => {
  const source = read('components/customer-surfaces.tsx');
  for (const text of ['Orders','Quote','Edit Profile','Change Password','Addresses','Wish List','Star Points','Store Credit','Your Transactions','Forgot password']) assert.ok(source.includes(text), text);
  assert.equal(source.toLowerCase().includes('email verification'), false);
});

test('tracking, invoice and returns are connected to backend APIs', () => {
  const customer = read('components/customer-surfaces.tsx');
  const support = read('components/order-support-surfaces.tsx');
  assert.match(customer, /\/orders\/track\//);
  for (const status of ['confirmed','processing','packed','shipped','out_for_delivery','delivered']) assert.ok(customer.includes(status), status);
  assert.match(support, /Print \/ Save PDF/);
  assert.match(support, /\/returns/);
});

test('featured categories are backend-driven and have no small arrow button', () => {
  const home = read('app/page.tsx');
  const catalog = read('lib/catalog.ts');
  assert.match(home, /getFeaturedCategories/);
  assert.match(catalog, /\/content\/featured-categories/);
  const featuredLine = home.split('\n').find(line => line.includes('id="featured-categories"')) || '';
  assert.equal(featuredLine.includes('ChevronRight'), false);
});

test('home personal, beginner and DJI sections use real filters rather than generic slices', () => {
  const source = read('app/page.tsx');
  assert.match(source, /getProducts\(\{brand:"DJI"/);
  assert.match(source, /getProducts\(\{category:"Personal Drone"/);
  assert.match(source, /getProducts\(\{category:"Beginner Drone"/);
});

test('admin products provide CRUD, import/export, filters and rich HTML/CSS editing', () => {
  const products = read('components/admin-products.tsx');
  const editor = read('components/rich-description-editor.tsx');
  for (const text of ['Export','Import','Create product','All categories','All brands','All status']) assert.ok(products.includes(text), text);
  assert.match(editor, />HTML</);
  assert.match(editor, />CSS</);
  assert.match(editor, />Preview</);
});

test('admin inventory, queries and media are functional surfaces', () => {
  const advanced = read('components/admin-advanced.tsx');
  const media = read('components/admin-media.tsx');
  for (const text of ['Inventory Management','Add Stock','Stock Transfer','Recent Stock Activity','Warehouse Stock Summary','Total Queries','Send Reply']) assert.ok(advanced.includes(text), text);
  assert.match(media, /Media Library/);
  assert.match(media, /\/admin\/media/);
});

test('admin topbar actions route to real destinations', () => {
  const source = read('components/admin-shell.tsx');
  assert.match(source, /router\.push\("\/admin\/inventory"\)/);
  assert.match(source, /router\.push\("\/admin\/queries"\)/);
  assert.match(source, /\/admin\/products\?new=1/);
});

test('WhatsApp uses the requested number, message and faster pulse', () => {
  const store = read('components/storefront.tsx');
  const css = read('app/globals.css');
  const env = read('.env.example');
  assert.match(store, /8801317768213/);
  assert.match(store, /আমি Drone Bangladesh থেকে আপনার তৈরি করা ওয়েবসাইটটি দেখছিলাম/);
  assert.match(env, /NEXT_PUBLIC_WHATSAPP_NUMBER=8801317768213/);
  assert.match(css, /1\.35s/);
});

test('footer policies and article routes exist', () => {
  for (const route of ['about-us','terms','privacy','shipping','returns','refund','warranty','faqs','articles']) assert.ok(fs.existsSync(new URL(`../app/${route}/page.tsx`, import.meta.url)), route);
});

test('media and customer/report admin operations have working actions', () => {
  const ops = read('components/admin-operations.tsx');
  assert.match(ops, /Enable/);
  assert.match(ops, /Disable/);
  assert.match(ops, /Export CSV/);
  assert.match(ops, /out_for_delivery/);
});

test('final hero is a multi-banner reference slider with admin-driven CTA metadata', () => {
  const hero = read('components/hero-banner-slider.tsx');
  const admin = read('components/admin-content.tsx');
  assert.match(hero, /hero-slider-track/);
  assert.match(hero, /Previous banner/);
  assert.match(hero, /primaryLabel/);
  assert.match(hero, /warrantyText/);
  assert.match(admin, /Banner slider controls/);
  assert.match(admin, /secondaryUrl/);
});

test('Drones, Handhelds and Enterprise mega menus use the shared admin-driven visual menu system', () => {
  const store = read('components/storefront.tsx');
  const admin = read('components/admin-content.tsx');
  const products = read('components/admin-products.tsx');
  assert.match(store, /VisualMegaMenu/);
  assert.match(store, /enterprise-top-grid/);
  assert.match(store, /enterprise-promo-grid/);
  assert.match(store, /entriesToVisualMenu/);
  assert.match(store, /productsToMenuGroups/);
  assert.match(store, /dronePromos/);
  assert.match(store, /handheldPromos/);
  assert.match(store, /fallbackEnterpriseGroups/);
  for (const label of ['DJI Enterprise Drones', 'Payloads', 'DJI Dock', 'AGRAS', 'DJI Delivery', 'DJI Enterprise Accessories', 'Software', 'Hardware', 'Services']) assert.ok(store.includes(label), label);
  assert.match(admin, /Products can also be assigned to these menu groups/);
  assert.match(admin, /menuKind/);
  assert.match(products, /Navigation mega-menu placement/);
  assert.match(products, /enterpriseMenuGroup/);
});

test('customer account reference has breadcrumb, avatar upload and exactly requested primary dashboard labels', () => {
  const source = read('components/customer-surfaces.tsx');
  assert.match(source, /account-breadcrumb/);
  assert.match(source, /\/account\/avatar/);
  for (const label of ['Orders','Quote','Edit Profile','Change Password','Addresses','Wish List','Star Points','Your Transactions']) assert.ok(source.includes(label), label);
  assert.match(source, /Store Credit/);
});

test('professional SEO covers canonical, social, schema, sitemap and noindex rules', () => {
  const seo = read('lib/seo.ts');
  const layout = read('app/layout.tsx');
  const sitemap = read('app/sitemap.ts');
  const robots = read('app/robots.ts');
  const product = read('app/products/[slug]/page.tsx');
  const article = read('app/articles/[slug]/page.tsx');
  const faq = read('app/faqs/page.tsx');
  const footer = read('components/storefront.tsx');
  assert.match(seo, /alternates: \{ canonical \}/);
  assert.match(layout, /LocalBusiness|"@type": "Store"/);
  assert.match(layout, /WebSite/);
  assert.match(layout, /Organization/);
  assert.match(product, /"@type": "Product"/);
  assert.match(product, /priceCurrency: "BDT"/);
  assert.match(article, /"@type":"Article"/);
  assert.match(faq, /"@type":"FAQPage"/);
  assert.match(product, /breadcrumbJsonLd/);
  assert.match(sitemap, /\/products\//);
  assert.match(sitemap, /\/articles\//);
  assert.match(robots, /\/checkout/);
  assert.match(robots, /\/admin\//);
  assert.match(footer, /https:\/\/www\.youtube\.com\/@dronebangladesh9726/);
  assert.match(footer, /https:\/\/web\.facebook\.com\/dronebangladesh\?/);
});

test('hero slider keeps the reference design with a more compact desktop height', () => {
  const css = read('app/globals.css');
  assert.match(css, /hero-slider \.hero-shell \{ min-height: 395px;/);
  assert.match(css, /hero-slider \.hero-media \{ min-height: 395px;/);
});

test('About Us navigation, reference body and standalone favicon are included', () => {
  const store = read('components/storefront.tsx');
  const about = read('app/about-us/page.tsx');
  const layout = read('app/layout.tsx');
  assert.match(store, /href="\/articles">Article<\/Link>\s*<Link[^>]+href="\/about-us">About Us<\/Link>/);
  for (const text of ['Your Trusted Drone','Mission','Vision','Values','Advanced Drone Portfolio','Proven Track Record','OUR STORY','Our community']) assert.ok(about.includes(text), text);
  assert.match(layout, /\/favicon\.png/);
  assert.ok(fs.existsSync(new URL('../public/favicon.png', import.meta.url)));
  assert.ok(fs.existsSync(new URL('../app/icon.png', import.meta.url)));
});

test('out-of-stock products use Pre-Order and expose customer verification surfaces', () => {
  const purchase = read('components/product-purchase-actions.tsx');
  const card = read('components/storefront.tsx');
  const checker = read('components/authenticity-checker.tsx');
  const admin = read('components/admin-preorders.tsx');
  for (const text of ['Pre-Order', '/preorders', 'paymentPlan', 'partial']) assert.ok(purchase.includes(text), text);
  assert.match(card, /preorder-card-action/);
  assert.match(checker, /Authenticity &amp; Warranty Checker/);
  assert.match(admin, /Pre-Order Management/);
  assert.ok(fs.existsSync(new URL('../app/authenticity-checker/page.tsx', import.meta.url)));
  assert.ok(fs.existsSync(new URL('../app/admin/preorders/page.tsx', import.meta.url)));
  assert.ok(fs.existsSync(new URL('../app/admin/warranty-records/page.tsx', import.meta.url)));
});
