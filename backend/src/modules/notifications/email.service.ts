import { env } from "../../config/env.js";
import nodemailer from "nodemailer";

/**
 * Small, provider-neutral email adapter.  Production can use Resend (or any
 * compatible JSON email endpoint) without adding a mail client dependency to
 * the storefront.  When no key is configured we log a safe, actionable
 * message and keep the stock/pre-order transaction successful.
 */
type EmailPayload = { to: string | string[]; subject: string; text: string; html: string };

function list(value: string | string[]) { return Array.isArray(value) ? value : [value]; }
function esc(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function sendNotificationEmail(payload: EmailPayload) {
  const recipients = list(payload.to).map((item) => item.trim()).filter(Boolean);
  if (!recipients.length) return { sent: false, reason: "no-recipient" };
  if (!env.emailApiKey && !(env.emailSmtpHost && env.emailSmtpUser && env.emailSmtpPassword)) {
    console.info(`[email] ${payload.subject} -> ${recipients.join(", ")} (configure EMAIL_API_KEY to send)`);
    return { sent: false, reason: "EMAIL_API_KEY_NOT_CONFIGURED" };
  }
  if (!env.emailApiKey && env.emailSmtpHost && env.emailSmtpUser && env.emailSmtpPassword) {
    const transport = nodemailer.createTransport({ host: env.emailSmtpHost, port: env.emailSmtpPort, secure: env.emailSmtpSecure, auth: { user: env.emailSmtpUser, pass: env.emailSmtpPassword }, connectionTimeout: 10_000, greetingTimeout: 10_000, socketTimeout: 10_000 });
    const sender = env.emailFrom === "Drone Bangladesh <onboarding@resend.dev>" ? env.emailSmtpUser : env.emailFrom;
    await transport.sendMail({ from: sender, to: recipients.join(", "), subject: payload.subject, text: payload.text, html: payload.html });
    return { sent: true, provider: "smtp" };
  }
  const result = await fetch(env.emailApiUrl, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.emailApiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: env.emailFrom, to: recipients, subject: payload.subject, text: payload.text, html: payload.html }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!result.ok) {
    const detail = await result.text().catch(() => "");
    throw new Error(`Email provider rejected the message (${result.status}): ${detail.slice(0, 240)}`);
  }
  return { sent: true };
}

export async function notifyAdminStockOut(product: { name: string; slug: string; sku?: string; stock: number }, reference?: string) {
  const subject = `Stock-out alert: ${product.name}`;
  const text = [
    "Drone Bangladesh stock-out alert",
    `Product: ${product.name}`,
    `SKU: ${product.sku || "N/A"}`,
    `Slug: ${product.slug}`,
    `Current stock: ${product.stock}`,
    `Reference: ${reference || "N/A"}`,
  ].join("\n");
  const html = `<h2>Stock-out alert</h2><p><strong>${esc(product.name)}</strong> is now out of stock.</p><ul><li>SKU: ${esc(product.sku || "N/A")}</li><li>Current stock: ${esc(product.stock)}</li><li>Reference: ${esc(reference || "N/A")}</li></ul>`;
  return sendNotificationEmail({ to: env.notificationEmail, subject, text, html });
}

export async function notifyCustomerRestock(customer: { name: string; email: string }, product: { name: string; slug: string; stock: number }) {
  const subject = `${product.name} is back in stock — Drone Bangladesh`;
  const productUrl = `${env.frontendUrl.replace(/\/$/, "")}/products/${encodeURIComponent(product.slug)}`;
  const text = `Hello ${customer.name},\n\n${product.name} is back in stock. Your pre-order is now ready for confirmation.\n\nView product: ${productUrl}`;
  const html = `<p>Hello ${esc(customer.name)},</p><p><strong>${esc(product.name)}</strong> is back in stock at Drone Bangladesh.</p><p>Your pre-order is now ready for confirmation.</p><p><a href="${productUrl}">View product and complete your order</a></p>`;
  return sendNotificationEmail({ to: customer.email, subject, text, html });
}

export async function notifyAdminPreOrder(preOrder: { preOrderNumber: string; productName: string; quantity: number; customer: { name: string; email: string; phone: string }; amountDue: number; paymentPlan: string }) {
  const subject = `New pre-order ${preOrder.preOrderNumber}: ${preOrder.productName}`;
  const text = [
    "New Drone Bangladesh pre-order",
    `Pre-order: ${preOrder.preOrderNumber}`,
    `Product: ${preOrder.productName}`,
    `Quantity: ${preOrder.quantity}`,
    `Customer: ${preOrder.customer.name}`,
    `Email: ${preOrder.customer.email}`,
    `Phone: ${preOrder.customer.phone}`,
    `Plan: ${preOrder.paymentPlan}`,
    `Amount due: BDT ${preOrder.amountDue}`,
  ].join("\n");
  const html = `<h2>New pre-order ${esc(preOrder.preOrderNumber)}</h2><p><strong>${esc(preOrder.productName)}</strong> × ${esc(preOrder.quantity)}</p><ul><li>Customer: ${esc(preOrder.customer.name)}</li><li>Email: ${esc(preOrder.customer.email)}</li><li>Phone: ${esc(preOrder.customer.phone)}</li><li>Payment plan: ${esc(preOrder.paymentPlan)}</li><li>Amount due: ৳${esc(preOrder.amountDue)}</li></ul>`;
  return sendNotificationEmail({ to: env.notificationEmail, subject, text, html });
}

export async function notifyCustomerPreOrderConfirmation(preOrder: { preOrderNumber: string; productName: string; customer: { name: string; email: string }; amountDue: number; paymentPlan: string }) {
  const subject = `Pre-order received: ${preOrder.productName}`;
  const text = `Hello ${preOrder.customer.name},\n\nWe received your pre-order ${preOrder.preOrderNumber} for ${preOrder.productName}. Payment plan: ${preOrder.paymentPlan}. Amount due now: BDT ${preOrder.amountDue}. Our team will contact you with availability and payment instructions.`;
  const html = `<p>Hello ${esc(preOrder.customer.name)},</p><p>We received your pre-order <strong>${esc(preOrder.preOrderNumber)}</strong> for <strong>${esc(preOrder.productName)}</strong>.</p><p>Payment plan: ${esc(preOrder.paymentPlan)} · Amount due now: ৳${esc(preOrder.amountDue)}</p><p>Our team will contact you with availability and payment instructions.</p>`;
  return sendNotificationEmail({ to: preOrder.customer.email, subject, text, html });
}


export async function notifyCustomerOrderInvoice(order: any) {
  const customer = order.customer || {};
  if (!customer.email) return { sent: false, reason: "no-recipient" };
  const rows = (order.items || []).map((item: any) => `<tr><td>${esc(item.name)}</td><td>${esc(item.quantity)}</td><td>৳${Number(item.price || 0).toLocaleString("en-BD")}</td><td>৳${Number((item.price || 0) * (item.quantity || 0)).toLocaleString("en-BD")}</td></tr>`).join("");
  const subject = `Payment confirmed & invoice — ${order.orderNumber}`;
  const text = `Hello ${customer.name || "Customer"},\n\nYour payment for order ${order.orderNumber} was successful. Total: BDT ${order.total}. Thank you for shopping with Drone Bangladesh.`;
  const html = `<div style="font-family:Arial,sans-serif;max-width:680px;margin:auto"><h2 style="color:#e11d2e">Drone Bangladesh</h2><h3>Payment confirmed</h3><p>Hello ${esc(customer.name || "Customer")}, your payment for <b>${esc(order.orderNumber)}</b> was successful.</p><table style="width:100%;border-collapse:collapse" border="1" cellpadding="8"><tr><th>Product</th><th>Qty</th><th>Unit</th><th>Total</th></tr>${rows}</table><p style="text-align:right;font-size:18px"><b>Total paid: ৳${Number(order.total || 0).toLocaleString("en-BD")}</b></p><p>Delivery method: Courier Delivery</p><p>Keep this email as your invoice.</p></div>`;
  return sendNotificationEmail({ to: customer.email, subject, text, html });
}
