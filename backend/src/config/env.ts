import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(moduleDir, "..", "..", ".env") });

const nodeEnv = process.env.NODE_ENV || "development";
const defaultFrontend = "http://localhost:3000";
const defaultApi = "http://localhost:5000";

export const env = {
  nodeEnv,
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGODB_URI || process.env.MONGO_URI || "",
  frontendUrl: process.env.FRONTEND_URL || defaultFrontend,
  apiPublicUrl: (process.env.API_PUBLIC_URL || defaultApi).replace(/\/$/, ""),
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || "local-development-access-secret-change-me",
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || "local-development-refresh-secret-change-me",
  adminEmail: process.env.ADMIN_EMAIL || "admin@dronebangladesh.com",
  notificationEmail: process.env.NOTIFICATION_EMAIL || "dronebangladesh567@gmail.com",
  adminPassword: process.env.ADMIN_PASSWORD || "change-this-password",
  adminSeedKey: process.env.ADMIN_SEED_KEY || "",
  enableDemoData: process.env.ENABLE_DEMO_DATA === "true",
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
    apiKey: process.env.CLOUDINARY_API_KEY || "",
    apiSecret: process.env.CLOUDINARY_API_SECRET || "",
  },
  emailApiUrl: process.env.EMAIL_API_URL || "https://api.resend.com/emails",
  emailApiKey: process.env.EMAIL_API_KEY || "",
  emailFrom: process.env.EMAIL_FROM || "Drone Bangladesh <onboarding@resend.dev>",
  emailSmtpHost: process.env.EMAIL_SMTP_HOST || "",
  emailSmtpPort: Number(process.env.EMAIL_SMTP_PORT || 465),
  emailSmtpSecure: process.env.EMAIL_SMTP_SECURE !== "false",
  emailSmtpUser: process.env.EMAIL_SMTP_USER || "",
  emailSmtpPassword: process.env.EMAIL_SMTP_PASSWORD || "",
  ssl: { storeId: process.env.SSLCOMMERZ_STORE_ID || "", storePassword: process.env.SSLCOMMERZ_STORE_PASSWORD || "", sandbox: process.env.SSLCOMMERZ_SANDBOX !== "false" },
};

if (nodeEnv === "production") {
  const insecure = [env.jwtAccessSecret, env.jwtRefreshSecret].some((value) => value.includes("change-me") || value.length < 32);
  if (insecure) throw new Error("Production JWT secrets must be configured and at least 32 characters long.");
  if (env.adminPassword === "change-this-password") throw new Error("ADMIN_PASSWORD must be changed in production.");
}
