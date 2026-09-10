"use client";

import { Check, Minus, Plus, ShoppingCart, X, MapPin, Mail, Phone, UserRound } from "lucide-react";
import { useState } from "react";
import type { CatalogProduct } from "@/lib/catalog";
import { accessoryMappingsKey, normalizeAccessoryMappings, type AccessoryMapping } from "@/lib/accessories";
import { useEffect } from "react";
import { apiRequest, getApiBase } from "@/lib/api";

const cartKey = "drone-bangladesh-cart";

export default function ProductPurchaseActions({ product, comboAccessories = [] }: { product: CatalogProduct; comboAccessories?: AccessoryMapping[] }) {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [comboOpen, setComboOpen] = useState(false);
  const [configuredCombo, setConfiguredCombo] = useState(comboAccessories);
  const [selectedComboIds, setSelectedComboIds] = useState<string[]>(comboAccessories.map((item) => item.id));
  const [preorderOpen, setPreorderOpen] = useState(false);
  const [preorderBusy, setPreorderBusy] = useState(false);
  const [preorderMessage, setPreorderMessage] = useState("");
  const [preorderError, setPreorderError] = useState("");
  const [paymentPlan, setPaymentPlan] = useState<"full" | "partial">("full");

  useEffect(() => {
    const load = async () => {
      try {
      const saved = normalizeAccessoryMappings(JSON.parse(window.localStorage.getItem(accessoryMappingsKey) || "[]"));
      const managed = saved.filter((item) => item.productSlug === product.slug && item.kind === "combo" && item.status !== "draft");
      if (managed.length) setConfiguredCombo(managed);
      const base = getApiBase();
      if (base && !managed.length) {
        const response = await fetch(`${base}/products/${encodeURIComponent(product.slug)}/combo-mappings`);
        if (response.ok) {
          const remote = normalizeAccessoryMappings((await response.json() as { data?: unknown }).data).filter((item) => item.kind === "combo" && item.status !== "draft");
          if (remote.length) setConfiguredCombo(remote);
        }
      }
      } catch { /* fallback combo remains available */ }
    };
    void load();
  }, [product.slug, comboAccessories]);

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash === "#preorder" && Number(product.stock || 0) <= 0 && product.preorderEnabled !== false) setPreorderOpen(true);
  }, [product.slug, product.stock, product.preorderEnabled]);

  async function saveToCart() {
    if (getApiBase()) {
      try {
        await apiRequest("/cart/items", { method: "POST", body: JSON.stringify({ slug: product.slug, quantity }) });
        window.dispatchEvent(new Event("drone-cart-updated")); setAdded(true); window.setTimeout(() => setAdded(false), 1400); return;
      } catch { setAdded(false); return; }
    }
    try {
      const cart = JSON.parse(window.localStorage.getItem(cartKey) || "[]") as Array<CatalogProduct & { quantity: number }>;
      const existing = cart.find((item) => item.slug === product.slug);
      if (existing) existing.quantity += quantity;
      else cart.push({ ...product, quantity });
      window.localStorage.setItem(cartKey, JSON.stringify(cart));
      window.dispatchEvent(new Event("drone-cart-updated"));
      setAdded(true);
      window.setTimeout(() => setAdded(false), 1400);
    } catch {
      setAdded(false);
    }
  }

  async function addSelectedCombosToCart() {
    const selected = configuredCombo.filter((item) => selectedComboIds.includes(item.id));
    if (!selected.length) return;
    try {
      const cart = JSON.parse(window.localStorage.getItem(cartKey) || "[]") as Array<CatalogProduct & { quantity: number }>;
      selected.forEach((item) => {
        const slug = item.linkedSlug || `${product.slug}-combo-${item.id}`;
        const existing = cart.find((entry) => entry.slug === slug);
        const comboItem = {
          slug,
          name: item.title,
          image: item.image,
          price: item.price,
          oldPrice: item.price,
          meta: `Combo product for ${product.name}`,
          quantity: 1,
        } as CatalogProduct & { quantity: number };
        if (existing) existing.quantity += 1;
        else cart.push(comboItem);
      });
      window.localStorage.setItem(cartKey, JSON.stringify(cart));
      window.dispatchEvent(new Event("drone-cart-updated"));
    } catch {}
  }

  async function buyNow() {
    if (Number(product.stock || 0) <= 0) { setPreorderOpen(true); return; }
    window.dispatchEvent(new CustomEvent("drone-product-accessory-view", { detail: "combo" }));
    if (configuredCombo.length) setComboOpen(true);
    else { await saveToCart(); window.location.href = "/checkout"; }
  }

  async function continueToCheckout() {
    await saveToCart();
    await addSelectedCombosToCart();
    setComboOpen(false);
    window.location.href = "/checkout";
  }

  async function submitPreorder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPreorderBusy(true); setPreorderError(""); setPreorderMessage("");
    const form = new FormData(event.currentTarget);
    try {
      if (!getApiBase()) throw new Error("Pre-order checkout needs the backend API to be configured.");
      const response = await apiRequest<{ data?: { preOrderNumber?: string }; message?: string }>("/preorders", {
        method: "POST",
        body: JSON.stringify({
          productSlug: product.slug,
          quantity,
          customer: { name: form.get("name"), email: form.get("email"), phone: form.get("phone") },
          shippingAddress: { line1: form.get("address"), area: form.get("area"), city: form.get("district"), district: form.get("district") },
          paymentPlan,
          paymentMethod: paymentPlan === "partial" ? "online" : "cash_on_delivery",
          notes: form.get("notes"),
        }),
      });
      setPreorderMessage(`${response.message || "Pre-order received."} Reference: ${response.data?.preOrderNumber || "pending"}`);
      event.currentTarget.reset();
    } catch (error) { setPreorderError(error instanceof Error ? error.message : "Unable to submit pre-order"); }
    finally { setPreorderBusy(false); }
  }

  const partialPercent = Math.min(100, Math.max(1, Number(product.preorderDepositPercent || 30)));
  const dueNow = paymentPlan === "partial" ? Math.round(Number(product.price || 0) * quantity * partialPercent / 100) : Number(product.price || 0) * quantity;
  const canPreorder = Number(product.stock || 0) <= 0 && product.preorderEnabled !== false;

  return <>
  <div className="purchase-actions">
    <div className="quantity" aria-label="Product quantity">
      <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} aria-label="Decrease quantity"><Minus size={15} /></button>
      <span>{quantity}</span>
      <button type="button" onClick={() => setQuantity((value) => value + 1)} aria-label="Increase quantity"><Plus size={15} /></button>
    </div>
    {Number(product.stock || 0) > 0 ? <button type="button" className="button button-outline cart-action" onClick={saveToCart}><ShoppingCart size={15} /> {added ? "Added to cart ✓" : "Add to cart"}</button> : canPreorder ? <button type="button" id="preorder" className="button button-outline cart-action preorder-button" onClick={() => setPreorderOpen(true)}><ShoppingCart size={15} /> Pre-Order</button> : <span className="out-of-stock-copy">Out of stock</span>}
    {Number(product.stock || 0) > 0 ? <button type="button" className="button button-red buy-now-action" onClick={buyNow}>Buy Now</button> : (canPreorder ? <button type="button" className="button button-red" onClick={buyNow}>Pre-Order</button> : null)}
  </div>
  {comboOpen && <div className="combo-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setComboOpen(false); }}>
    <section className="combo-modal" role="dialog" aria-modal="true" aria-labelledby="combo-modal-title">
      <header><div><p className="eyebrow">CONFIGURED FOR THIS PRODUCT</p><h2 id="combo-modal-title">{product.name} combo accessories</h2><span>Review the included kit before you continue to checkout.</span></div><button type="button" className="icon-button" onClick={() => setComboOpen(false)} aria-label="Close combo accessories"><X size={16} /></button></header>
      <div className="combo-modal-grid">{configuredCombo.map((item) => {
        const selected = selectedComboIds.includes(item.id);
        return <article key={item.id} className={selected ? "selected-combo" : ""} onClick={() => setSelectedComboIds((ids) => ids.includes(item.id) ? ids.filter((id) => id !== item.id) : [...ids, item.id])}>
          <input type="checkbox" checked={selected} onChange={() => undefined} aria-label={`Select ${item.title}`} />
          <img src={item.image} alt={item.title} />
          <div><strong>{item.title}</strong><small><Check size={13} />{selected ? "Selected for combo" : "Optional add-on"}</small></div>
        </article>;
      })}</div>
      <footer><button type="button" className="button button-outline" onClick={() => setComboOpen(false)}>Keep browsing</button><button type="button" className="button button-red" onClick={continueToCheckout}>Continue to checkout <ShoppingCart size={14} /></button></footer>
    </section>
  </div>}
  {preorderOpen && <div className="combo-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setPreorderOpen(false); }}>
    <section className="combo-modal preorder-modal" role="dialog" aria-modal="true" aria-labelledby="preorder-title">
      <header><div><p className="eyebrow">PRE-ORDER / ADVANCE BOOKING</p><h2 id="preorder-title">Reserve {product.name}</h2><span>{product.preorderNote || "Secure your unit before the next shipment arrives."}</span></div><button type="button" className="icon-button" onClick={() => setPreorderOpen(false)} aria-label="Close pre-order form"><X size={16} /></button></header>
      {preorderMessage && <div className="crud-notice">{preorderMessage}</div>}
      {preorderError && <div className="crud-error">{preorderError}</div>}
      {!preorderMessage && <form className="preorder-form" onSubmit={submitPreorder}>
        <div className="preorder-form-grid"><label><UserRound size={14}/>Full name<input name="name" required placeholder="Your full name" /></label><label><Mail size={14}/>Email<input name="email" type="email" required placeholder="you@example.com" /></label><label><Phone size={14}/>Mobile number<input name="phone" required placeholder="01XXXXXXXXX" /></label><label><MapPin size={14}/>District<input name="district" required defaultValue="Dhaka" /></label><label className="full"><MapPin size={14}/>Delivery address<input name="address" required placeholder="House / Road / Flat / Building" /></label><label className="full">Upazila / Thana<input name="area" required placeholder="Upazila / Thana" /></label><label className="full">Note (optional)<textarea name="notes" rows={3} placeholder="Any delivery or product note" /></label></div>
        <div className="preorder-payment"><strong>Payment plan</strong><label><input type="radio" name="paymentPlan" checked={paymentPlan === "full"} onChange={() => setPaymentPlan("full")} /> Full payment — ৳{(Number(product.price || 0) * quantity).toLocaleString("en-BD")}</label><label><input type="radio" name="paymentPlan" checked={paymentPlan === "partial"} onChange={() => setPaymentPlan("partial")} /> Partial booking ({partialPercent}%) — ৳{dueNow.toLocaleString("en-BD")} now; balance on confirmation</label></div>
        <footer><button type="button" className="button button-outline" onClick={() => setPreorderOpen(false)}>Cancel</button><button type="submit" className="button button-red" disabled={preorderBusy}>{preorderBusy ? "Submitting…" : "Confirm Pre-Order"}</button></footer>
      </form>}
    </section>
  </div>}
  </>;
}
