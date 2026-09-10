import dns from "node:dns";
import mongoose from "mongoose";
import { app } from "./app.js";
import { env } from "./config/env.js";
import { connectDatabase } from "./config/database.js";

try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
  dns.setDefaultResultOrder("ipv4first");
} catch { /* OS DNS remains available */ }

async function startServer() {
  try {
    console.log("Connecting to MongoDB Atlas...");
    await connectDatabase();
    const server = app.listen(env.port, "0.0.0.0", () => console.log(`✅ Drone Bangladesh API running on http://localhost:${env.port}`));
    server.on("error", (error: NodeJS.ErrnoException) => {
      if (error.code === "EADDRINUSE") console.error(`❌ Port ${env.port} is already in use.`);
      else console.error("❌ Server error:", error);
    });
  } catch (error) {
    console.error("❌ Backend startup failed:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

async function closeDatabase(signal: string) {
  if (mongoose.connection.readyState !== 0) await mongoose.connection.close();
  console.log(`✅ MongoDB connection closed (${signal})`);
  process.exit(0);
}
process.on("SIGINT", () => void closeDatabase("SIGINT"));
process.on("SIGTERM", () => void closeDatabase("SIGTERM"));
void startServer();
