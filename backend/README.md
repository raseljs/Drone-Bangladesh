# Drone Bangladesh Backend

Express + TypeScript + MongoDB backend for the Drone Bangladesh storefront and admin panel.

## Run in VS Code (Windows)

1. Install Node.js 20 LTS or newer.
2. Open a terminal in `backend`.
3. Copy `.env.example` to `.env`.
4. Put your MongoDB Atlas connection string in `MONGODB_URI`.
5. Change the JWT secrets and `ADMIN_PASSWORD`.
6. Run:

```powershell
npm install
npm run seed
npm run dev
```

The API runs at `http://localhost:5000/api/v1`.

If MongoDB is not configured, the server still starts in degraded mode so you can diagnose the frontend/API connection. Database-backed routes return a clear 503 response until MongoDB is connected.

## Important routes

- Storefront: `/api/v1/products`, `/api/v1/content/*`
- Auth: `/api/v1/auth/register`, `/login`, `/refresh`, `/me`, `/logout`
- Cart: `/api/v1/cart`
- Orders: `/api/v1/orders`; secure guest tracking: `/api/v1/orders/track/:orderNumber?phone=...`
- Pre-orders: `POST /api/v1/preorders`, customer history at `/api/v1/preorders/mine`
- Authenticity & warranty: `POST /api/v1/warranty/verify` or `GET /api/v1/warranty/verify/:serialNumber`
- Maintenance requests: `/api/v1/maintenance-requests`
- Admin: `/api/v1/admin/*`
- Uploads: `/api/v1/admin/media`

Admin CRUD covers products, categories, brands, banners, articles, reviews, stores, coupons, menus, home sections, maintenance content, combos/accessories, orders, customers, pre-orders, warranty records and reports.

## Stock-out alerts and pre-orders

When an order or admin inventory change moves a product from available to zero,
the backend sends a stock-out alert to `NOTIFICATION_EMAIL` (default:
`dronebangladesh567@gmail.com`). Customers can use **Pre-Order** on an out-of-
stock product and submit name, email, mobile, delivery address and either a
full or configurable partial-payment plan. When stock is added again, each
active pre-order customer receives a restock email and their booking is marked
`ready`.

Email delivery supports a Resend-compatible endpoint or SMTP/Gmail. Set
`EMAIL_API_KEY` + `EMAIL_FROM` (and optionally `EMAIL_API_URL`), or set
`EMAIL_SMTP_HOST=smtp.gmail.com`, `EMAIL_SMTP_USER` and a Gmail App Password.
Without either provider configuration, alerts are logged and all commerce
transactions still complete.

Admins can review bookings at `/admin/preorders` and manage serial/warranty
records at `/admin/warranty-records`. The public checker is
`/authenticity-checker`.
