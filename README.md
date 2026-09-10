# Drone Bangladesh — Final Full-Stack Source

This package contains the Drone Bangladesh storefront, customer account, admin CMS/operations panel, and Express + TypeScript + MongoDB API.

Start with **START-HERE.txt**.

## Local ports
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000/api/v1`
- Admin: `http://localhost:3000/admin/login`

## Main implemented areas
- Multi-banner homepage slider with MongoDB legacy-index repair
- Backend-driven Featured Categories without arrow buttons
- Product CRUD, gallery, rich HTML/CSS description editor, CSV import/export, filters and status flags
- Product detail gallery/tabs, accessories/combo mapping and moderated reviews
- Customer register/login, session refresh, forgot-password request, profile, password change, addresses, wishlist, quotes, Star Points, Store Credit and transactions
- Guest cart → customer cart merge
- Courier-only checkout with fixed ৳150 delivery charge, coupon validation and normalized Bangladesh address/phone handling
- Order creation, stock reservation/restoration, inventory activity, warehouses, low-stock status and stock transfer/adjustment controls
- Stock-out email alert to `dronebangladesh567@gmail.com` (configurable), customer restock alerts and full/partial-payment pre-order workflow
- Public authenticity & warranty checker with admin-managed serial-number register
- Order timeline: Confirmed → Processing → Packed → Shipped → Out for Delivery → Delivered
- Tracking ID, courier partner, estimated delivery, phone-verified public order tracking
- Printable invoice / Save-to-PDF flow
- Return/refund requests and admin workflow
- Courier/customer Queries desk with conversation replies
- Admin quotes, product review moderation, customers, reports and audit logs
- Media Library with upload/list/delete and image-signature validation
- 30+ seeded long-form Drone Bangladesh articles plus About/Terms/Privacy/Shipping/Returns/Refund/Warranty/FAQ CMS pages
- WhatsApp integration for `+8801317768213` with the requested prefilled message and faster pulse animation
- Professional SEO: dynamic metadata/canonicals, Open Graph/Twitter, dynamic sitemap, robots/noindex, Product/Article/FAQ/Breadcrumb/Organization/Store/WebSite schema, and image alt improvements
- Official Facebook and YouTube links integrated in footer and structured-data sameAs
- Auth-specific rate limits, CORS, Helmet, sanitized rich HTML/CSS and production secret checks

## Important
- Email verification is intentionally **not implemented**, per project requirement.
- Live payment gateway, courier-provider API, SMS/WhatsApp Business API, analytics IDs and production hosting credentials require the relevant third-party accounts/keys. Pre-order payment plans are recorded end-to-end; admins can mark online/bank-transfer payments as paid from the Pre-Orders panel.
- Do not commit real `.env` files or production credentials.
