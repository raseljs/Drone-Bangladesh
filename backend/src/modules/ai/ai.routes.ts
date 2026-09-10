import { Router } from "express";
import mongoose from "mongoose";
import { ContentEntry } from "../content/content.model.js";

export const aiRouter = Router();

const builtInKnowledge = [
  { question: "What is the price of DJI Mini 5 Pro?", answer: "The latest DJI Mini 5 Pro price and stock are shown on its product details page. Add it to cart or contact Drone Bangladesh for the current offer." },
  { question: "Which drone is good for a beginner?", answer: "DJI Neo and DJI Mini models are a great starting point because they are compact, easy to fly and include helpful safety features." },
  { question: "Do you deliver anywhere in Bangladesh?", answer: "Yes. Drone Bangladesh offers fast nationwide delivery, with cash on delivery available for eligible orders." },
  { question: "What payment options are available?", answer: "You can choose cash on delivery, online payment or selected EMI plans at checkout. Our team can confirm the final plan before dispatch." },
  { question: "How long is the warranty?", answer: "Official DJI products include the warranty shown on the product page. Keep your invoice and contact support for warranty assistance." },
  { question: "Can I buy a combo with accessories?", answer: "Yes. Each product can have its own Buy Combo and Accessories mapping. Open the product details page to review the configured bundle." },
  { question: "How do I place an order?", answer: "Open a product, select Add to Cart or Buy Now, enter your delivery details and submit the checkout form." },
  { question: "How can I contact support?", answer: "Call or WhatsApp Drone Bangladesh at +880 1896-123434 for product guidance, delivery and after-sales support." },
];

function words(value: string) {
  return new Set(value.toLowerCase().split(/[^a-z0-9]+/).filter((word) => word.length > 2));
}

function score(question: string, candidate: string) {
  const queryWords = words(question);
  const candidateWords = words(candidate);
  if (!queryWords.size || !candidateWords.size) return 0;
  let matches = 0;
  for (const word of queryWords) if (candidateWords.has(word)) matches += 1;
  return matches / Math.max(queryWords.size, 1);
}

aiRouter.get("/knowledge", async (_request, response, next) => {
  try {
    const entries = mongoose.connection.readyState === 1
      ? await ContentEntry.find({ entityType: "ai-faqs", status: "published", isActive: true }).select("name title body bodyHtml").sort({ sortOrder: 1, createdAt: -1 }).lean()
      : [];
    const data = entries.length ? entries : builtInKnowledge;
    response.json({ success: true, data, meta: { count: data.length, source: entries.length ? "admin" : "built-in" } });
  } catch (error) { next(error); }
});

aiRouter.post("/ask", async (request, response, next) => {
  try {
    const question = typeof request.body?.question === "string" ? request.body.question.trim().slice(0, 500) : "";
    if (!question) return response.status(400).json({ success: false, message: "A question is required" });

    const entries = mongoose.connection.readyState === 1
      ? await ContentEntry.find({ entityType: "ai-faqs", status: "published", isActive: true }).select("name title body bodyHtml").sort({ sortOrder: 1, createdAt: -1 }).lean()
      : [];
    const pool = entries.length
      ? entries.map((entry) => ({ question: entry.name, answer: entry.body || entry.title || "Please contact our support team.", source: "admin" as const }))
      : builtInKnowledge.map((entry) => ({ ...entry, source: "built-in" as const }));
    const match = pool.map((entry) => ({ entry, value: score(question, `${entry.question} ${entry.answer}`) })).sort((a, b) => b.value - a.value)[0];
    const answer = match && match.value > 0 ? match.entry.answer : "I can help with Drone Bangladesh prices, specifications, flight time, warranty, delivery and accessories. Please include the product model or contact our support team on WhatsApp.";
    response.json({ success: true, data: { answer, matchedQuestion: match && match.value > 0 ? match.entry.question : null, source: match && match.value > 0 ? match.entry.source : "fallback", knowledgeCount: pool.length } });
  } catch (error) { next(error); }
});
