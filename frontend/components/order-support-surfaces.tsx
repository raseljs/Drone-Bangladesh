"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FileText, PackageCheck, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { apiRequest } from "@/lib/api";

type OrderItem = { slug: string; name: string; image?: string; price: number; quantity: number };
type OrderRecord = {
  orderNumber: string;
  createdAt: string;
  deliveryStatus: string;
  paymentMethod?: string;
  paymentStatus?: string;
  customer?: { name?: string; email?: string; phone?: string };
  shippingAddress?: { line1?: string; line2?: string; area?: string; city?: string; district?: string; postalCode?: string };
  items?: OrderItem[];
  subtotal?: number;
  discount?: number;
  deliveryCharge?: number;
  total: number;
  couponCode?: string;
};
type ReturnRow = { _id?: string; returnNumber: string; orderNumber: string; type: string; reason: string; details?: string; status: string; refundAmount?: number; resolutionNote?: string; createdAt: string };

function money(value: number | undefined) { return `৳${Number(value || 0).toLocaleString("en-BD")}`; }

export function ReturnRequestSurface() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [returns, setReturns] = useState<ReturnRow[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const [orderResult, returnResult] = await Promise.all([
        apiRequest<{ data?: OrderRecord[] }>("/orders/mine"),
        apiRequest<{ data?: ReturnRow[] }>("/returns/mine"),
      ]);
      setOrders(orderResult.data || []);
      setReturns(returnResult.data || []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Please sign in to manage returns.");
    }
  }
  useEffect(() => { void load(); }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      await apiRequest("/returns", {
        method: "POST",
        body: JSON.stringify({
          orderNumber: form.get("orderNumber"),
          type: form.get("type"),
          reason: form.get("reason"),
          details: form.get("details"),
        }),
      });
      event.currentTarget.reset();
      setMessage("Return/refund request submitted successfully.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to submit request.");
    } finally { setBusy(false); }
  }

  return <main className="page-container return-request-page">
    <p className="breadcrumbs">Home / Account / Returns</p>
    <div className="return-page-head"><div><p className="eyebrow">AFTER-SALES SUPPORT</p><h1>Return & Refund Requests</h1><span>Submit and follow return/refund requests for your Drone Bangladesh orders.</span></div><Link className="button button-outline" href="/account">Back to account</Link></div>
    {message && <div className="crud-notice">{message}</div>}
    <div className="return-request-grid">
      <form className="customer-card account-form" onSubmit={submit}>
        <h2><RotateCcw size={20}/> New request</h2>
        <label>Order<select name="orderNumber" required defaultValue=""><option value="" disabled>Select an order</option>{orders.map(order => <option key={order.orderNumber} value={order.orderNumber}>{order.orderNumber} · {money(order.total)}</option>)}</select></label>
        <label>Request type<select name="type" defaultValue="return"><option value="return">Return</option><option value="refund">Refund</option></select></label>
        <label>Reason<input name="reason" required placeholder="Wrong item, damaged package, technical issue..."/></label>
        <label>Details<textarea name="details" rows={5} placeholder="Describe the issue and package condition."/></label>
        <button className="button button-red" disabled={busy || !orders.length}>{busy ? "Submitting…" : "Submit request"}</button>
        {!orders.length && <small>You need a signed-in account with an order before creating a return/refund request.</small>}
      </form>
      <section className="customer-card"><h2>Request history</h2>{returns.length ? <div className="return-history">{returns.map(item => <article key={item.returnNumber}><div><strong>{item.returnNumber}</strong><small>{item.orderNumber} · {new Date(item.createdAt).toLocaleDateString()}</small></div><span className={`query-status ${item.status}`}>{item.status.replaceAll("_", " ")}</span><p><b>{item.type}</b> · {item.reason}</p>{item.refundAmount ? <p>Refund: <strong>{money(item.refundAmount)}</strong></p> : null}{item.resolutionNote ? <small>{item.resolutionNote}</small> : null}</article>)}</div> : <p>No return/refund requests yet.</p>}</section>
    </div>
  </main>;
}

export function InvoiceSurface({ orderNumber }: { orderNumber: string }) {
  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { void apiRequest<{ data?: OrderRecord }>(`/orders/${encodeURIComponent(orderNumber)}`).then(result => setOrder(result.data || null)).catch(cause => setError(cause instanceof Error ? cause.message : "Unable to load invoice")); }, [orderNumber]);
  if (error) return <main className="page-container simple-surface"><div className="crud-error">{error}</div><Link href="/account" className="button button-outline">Back to account</Link></main>;
  if (!order) return <main className="page-container simple-surface">Loading invoice…</main>;
  const address = [order.shippingAddress?.line1, order.shippingAddress?.line2, order.shippingAddress?.area, order.shippingAddress?.city, order.shippingAddress?.district, order.shippingAddress?.postalCode].filter(Boolean).join(", ");
  return <main className="page-container invoice-page">
    <div className="invoice-actions no-print"><Link href="/account" className="button button-outline">Back to orders</Link><button className="button button-primary" onClick={() => window.print()}><FileText size={16}/> Print / Save PDF</button></div>
    <section className="invoice-sheet">
      <header><div><img src="/images/logo/drone-bangladesh.png" alt="Drone Bangladesh"/><p>Drones, cameras, accessories & expert support</p></div><div><strong>INVOICE</strong><span>{order.orderNumber}</span><small>{new Date(order.createdAt).toLocaleString()}</small></div></header>
      <div className="invoice-meta"><section><h3>Bill / Ship To</h3><strong>{order.customer?.name}</strong><p>{address}</p><p>{order.customer?.phone}<br/>{order.customer?.email}</p></section><section><h3>Order Information</h3><p><span>Payment</span><b>{(order.paymentMethod || "cash_on_delivery").replaceAll("_", " ")}</b></p><p><span>Status</span><b>{order.deliveryStatus.replaceAll("_", " ")}</b></p><p><span>Delivery</span><b>Courier Delivery</b></p></section></div>
      <div className="invoice-table"><div className="invoice-row head"><span>Product</span><span>Qty</span><span>Unit Price</span><span>Total</span></div>{(order.items || []).map(item => <div className="invoice-row" key={item.slug}><span className="invoice-product"><img src={item.image || "/images/products/mini-5.jpg"} alt=""/><b>{item.name}</b></span><span>{item.quantity}</span><span>{money(item.price)}</span><span>{money(item.price * item.quantity)}</span></div>)}</div>
      <div className="invoice-summary"><p><span>Subtotal</span><b>{money(order.subtotal)}</b></p>{order.discount ? <p><span>Discount{order.couponCode ? ` (${order.couponCode})` : ""}</span><b>-{money(order.discount)}</b></p> : null}<p><span>Courier Delivery</span><b>{money(order.deliveryCharge || 150)}</b></p><p className="grand"><span>Total</span><b>{money(order.total)}</b></p></div>
      <footer><span><PackageCheck/> Genuine products</span><span><ShieldCheck/> Warranty support</span><span><Truck/> Courier Delivery</span></footer>
    </section>
  </main>;
}
