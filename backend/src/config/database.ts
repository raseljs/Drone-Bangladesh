import mongoose from "mongoose";
import { env } from "./env.js";
import { ContentEntry } from "../modules/content/content.model.js";

async function repairContentIndexes() {
  const collection = mongoose.connection.collection("contententries");
  try {
    await collection.updateMany({ $or: [{ slug: null }, { slug: "" }] }, { $unset: { slug: "" } });
    const indexes = await collection.indexes();
    const legacy = indexes.find((index) => index.name === "entityType_1_slug_1" && !index.partialFilterExpression);
    if (legacy) {
      await collection.dropIndex("entityType_1_slug_1");
      console.log("✅ Repaired legacy content slug index");
    }
    await ContentEntry.syncIndexes();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.includes("ns not found") && !message.includes("NamespaceNotFound")) throw error;
  }
}

export async function connectDatabase() {
  if (!env.mongoUri) throw new Error("MONGODB_URI is not configured in backend/.env");
  await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 20_000, connectTimeoutMS: 20_000, socketTimeoutMS: 45_000, family: 4 });
  await repairContentIndexes();
  console.log("✅ MongoDB Atlas connected");
}
