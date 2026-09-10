"use client";

import { ChevronRight, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { SectionHeading } from "@/components/storefront";
import { accessoryMappingsKey, fallbackAccessoriesFor, normalizeAccessoryMappings, type AccessoryKind, type AccessoryMapping } from "@/lib/accessories";
import type { CatalogProduct } from "@/lib/catalog";
import { apiRequest, getApiBase } from "@/lib/api";

const cartKey = "drone-bangladesh-cart";

async function addAccessoryToCart(product: CatalogProduct, item: AccessoryMapping) {
  if (getApiBase()) {
    if (!item.linkedSlug) return false;
    try { await apiRequest("/cart/items", { method: "POST", body: JSON.stringify({ slug: item.linkedSlug, quantity: 1 }) }); window.dispatchEvent(new Event("drone-cart-updated")); return true; } catch { return false; }
  }
  try {
    const cart = JSON.parse(window.localStorage.getItem(cartKey) || "[]") as Array<CatalogProduct & { quantity: number }>;
    const slug = item.linkedSlug || `${product.slug}-${item.id}`;
    const existing = cart.find((entry) => entry.slug === slug);
    const accessory = { slug, name: item.title, image: item.image, price: item.price, oldPrice: item.price, meta: `Accessory for ${product.name}` };
    if (existing) existing.quantity += 1;
    else cart.push({ ...accessory, quantity: 1 });
    window.localStorage.setItem(cartKey, JSON.stringify(cart));
    window.dispatchEvent(new Event("drone-cart-updated"));
    return true;
  } catch { return false; }
}

function showAccessoryView(view: AccessoryKind) {
  window.dispatchEvent(new CustomEvent("drone-product-accessory-view", { detail: view }));
}

export function ProductDetailsTabs({ productSlug, hasCombo = true }: { productSlug?: string; hasCombo?: boolean }) {
  const [active, setActive] = useState<"tech" | "combo" | "accessories" | "faq">("tech");
  const [comboAvailable, setComboAvailable] = useState(hasCombo);

  useEffect(() => {
    if (!productSlug) return;
    const refreshAvailability = async () => {
      try {
        const local = normalizeAccessoryMappings(JSON.parse(window.localStorage.getItem(accessoryMappingsKey) || "[]"));
        if (local.some((item) => item.productSlug === productSlug && item.kind === "combo" && item.status !== "draft")) {
          setComboAvailable(true);
          return;
        }
      } catch { /* server-provided availability remains */ }
      const base = getApiBase();
      if (!base) return;
      try {
        const response = await fetch(`${base}/products/${encodeURIComponent(productSlug)}/combo-mappings`);
        if (!response.ok) return;
        const remote = normalizeAccessoryMappings((await response.json() as { data?: unknown }).data);
        // Keep the server-rendered fallback for combo-labelled products when
        // the API has no mapping yet; remote admin mappings can only enable
        // the tab, never make an already configured combo disappear.
        if (remote.some((item) => item.kind === "combo" && item.status !== "draft")) setComboAvailable(true);
      } catch { /* unavailable remote data leaves the server decision intact */ }
    };
    void refreshAvailability();
    const onMappingsUpdated = () => { void refreshAvailability(); };
    window.addEventListener("drone-accessory-mappings-updated", onMappingsUpdated);
    return () => window.removeEventListener("drone-accessory-mappings-updated", onMappingsUpdated);
  }, [hasCombo, productSlug]);

  useEffect(() => {
    const onView = (event: Event) => {
      const view = (event as CustomEvent<AccessoryKind>).detail;
      if (view === "combo") setActive("combo");
      if (view === "accessory") setActive("accessories");
    };
    window.addEventListener("drone-product-accessory-view", onView);
    return () => window.removeEventListener("drone-product-accessory-view", onView);
  }, []);

  function select(next: "tech" | "combo" | "accessories" | "faq") {
    setActive(next);
    if (next === "combo") showAccessoryView("combo");
    if (next === "accessories") showAccessoryView("accessory");
  }

  return <div className={`page-container detail-tabs ${comboAvailable ? "with-combo" : "without-combo"}`} role="tablist" aria-label="Product options">
    <button type="button" className={active === "tech" ? "active" : ""} onClick={() => select("tech")}>▣ Tech Space</button>
    {comboAvailable && <button type="button" className={active === "combo" ? "active" : ""} onClick={() => select("combo")}>♧ Buy Combo</button>}
    <button type="button" className={active === "accessories" ? "active" : ""} onClick={() => select("accessories")}>▦ Accessories</button>
    <button type="button" className={active === "faq" ? "active" : ""} onClick={() => select("faq")}>◯ FAQ</button>
  </div>;
}

export default function ProductAccessories({ product, fallback }: { product: CatalogProduct; fallback?: AccessoryMapping[] }) {
  const sectionRef = useRef<HTMLElement>(null);
  const [view, setView] = useState<AccessoryKind>("accessory");
  const [managed, setManaged] = useState<AccessoryMapping[]>([]);
  const [addedId, setAddedId] = useState<string | null>(null);

  useEffect(() => {
    const onView = (event: Event) => {
      const next = (event as CustomEvent<AccessoryKind>).detail;
      if (next !== "combo" && next !== "accessory") return;
      setView(next);
      window.setTimeout(() => sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 30);
    };
    window.addEventListener("drone-product-accessory-view", onView);
    return () => window.removeEventListener("drone-product-accessory-view", onView);
  }, [product.slug]);

  useEffect(() => {
    const load = async () => {
      let entries: AccessoryMapping[] = [];
      try { entries = normalizeAccessoryMappings(JSON.parse(window.localStorage.getItem(accessoryMappingsKey) || "[]")); } catch { /* fallback below */ }
      const base = getApiBase();
      if (base) {
        try {
          const response = await fetch(`${base}/content/accessory-mapping`);
          if (response.ok) {
            const remote = normalizeAccessoryMappings((await response.json() as { data?: unknown }).data);
            if (remote.length) entries = remote;
          }
          const comboResponse = await fetch(`${base}/products/${encodeURIComponent(product.slug)}/combo-mappings`);
          if (comboResponse.ok) {
            const combo = normalizeAccessoryMappings((await comboResponse.json() as { data?: unknown }).data).filter((item) => item.kind === "combo");
            if (combo.length) entries = [...entries.filter((item) => !(item.productSlug === product.slug && item.kind === "combo")), ...combo];
          }
        } catch { /* local mapping remains authoritative */ }
      }
      setManaged(entries);
    };
    void load();
  }, [product.slug]);

  const mappings = useMemo(() => {
    const local = managed.filter((item) => item.productSlug === product.slug && item.status !== "draft");
    if (local.length) return local;
    return (fallback?.length ? fallback : fallbackAccessoriesFor(product.slug)).filter((item) => item.status !== "draft");
  }, [fallback, managed, product.slug]);

  const visible = mappings.filter((item) => item.kind === view);
  const title = view === "combo" ? "Combo accessories" : "Products accessories";
  const description = view === "combo" ? "Included with this Fly More Combo. Review the configured kit before checkout." : "Shop every accessory configured for this product.";

  async function add(item: AccessoryMapping) {
    if (!await addAccessoryToCart(product, item)) return;
    setAddedId(item.id);
    window.setTimeout(() => setAddedId(null), 1300);
  }

  return <section ref={sectionRef} className="page-container accessories-section" id="product-accessories">
    <SectionHeading title={title} href="/products" />
    <p className="accessory-context">{description} <button type="button" onClick={() => { const next = view === "combo" ? "accessory" : "combo"; showAccessoryView(next); }}>Show {view === "combo" ? "all accessories" : "combo items"} <ChevronRight size={13} /></button></p>
    {visible.length ? <div className="accessory-grid">{visible.map((item) => <article className="accessory-card" key={item.id}>
      <Link href={item.linkedSlug ? `/products/${item.linkedSlug}` : `/products/${product.slug}`} className="accessory-image-link"><img src={item.image} alt={item.title} /></Link>
      <Link href={item.linkedSlug ? `/products/${item.linkedSlug}` : `/products/${product.slug}`}><h3>{item.title}</h3></Link>
      <strong>৳{item.price.toLocaleString("en-BD")}</strong>
      <button type="button" className="button button-outline" onClick={() => add(item)} disabled={Boolean(getApiBase()) && !item.linkedSlug}><ShoppingCart size={13} />{addedId === item.id ? "Added to cart ✓" : (Boolean(getApiBase()) && !item.linkedSlug ? "Link product in admin" : "Add to cart")}</button>
    </article>)}</div> : <div className="accessory-empty">No {view === "combo" ? "combo accessories" : "accessories"} configured for this product yet.</div>}
  </section>;
}
