"use client";

import {
  Bot,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  CircleHelp,
  Heart,
  MapPin,
  Menu,
  MessageCircle,
  PackageCheck,
  Search,
  ShoppingCart,
  Sparkles,
  Truck,
  UserRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { AI_KNOWLEDGE_COUNT, findSupportAnswer, type SupportKnowledge } from "@/lib/ai-knowledge";
import { apiRequest, getApiBase } from "@/lib/api";

export type ProductData = {
  slug: string;
  name: string;
  image: string;
  hoverImage?: string;
  images?: string[];
  price: number;
  oldPrice: number;
  stock?: number;
  preorderEnabled?: boolean;
  badge?: string;
  meta?: string;
  description?: string;
  descriptionHtml?: string;
  descriptionCss?: string;
};

const cartKey = "drone-bangladesh-cart";

function getCartCount() {
  if (typeof window === "undefined") return 0;
  try {
    return JSON.parse(window.localStorage.getItem(cartKey) || "[]").reduce((sum: number, item: { quantity?: number }) => sum + (item.quantity || 1), 0);
  } catch { return 0; }
}

async function addToCart(product: ProductData) {
  if (typeof window === "undefined") return;
  if (getApiBase()) {
    await apiRequest("/cart/items", { method: "POST", body: JSON.stringify({ slug: product.slug, quantity: 1 }) });
    window.dispatchEvent(new Event("drone-cart-updated"));
    return;
  }
  const cart = JSON.parse(window.localStorage.getItem(cartKey) || "[]") as Array<ProductData & { quantity: number }>;
  const existing = cart.find((item) => item.slug === product.slug);
  if (existing) existing.quantity += 1;
  else cart.push({ ...product, quantity: 1 });
  window.localStorage.setItem(cartKey, JSON.stringify(cart));
  window.dispatchEvent(new Event("drone-cart-updated"));
}

function price(value: number) { return `৳${value.toLocaleString("en-BD")}`; }

const whatsappMessage = "Hello Drone Bangladesh, I need assistance regarding your drone products and services.";

/**
 * WhatsApp links require an international, digits-only number. Accept both
 * the configured 880-prefixed value and a local 01XXXXXXXXX value so a
 * Hostinger environment typo cannot silently send customers to a bad link.
 */
function normalizeWhatsAppNumber(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("880")) return digits;
  if (digits.startsWith("0")) return `880${digits.slice(1)}`;
  return digits || "8801896123434";
}

const whatsappNumber = normalizeWhatsAppNumber(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "8801896123434");
const whatsappHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;

const developerWhatsappMessage = "আসসালামু আলাইকুম, আপনাদের তৈরি Drone Bangladesh ওয়েবসাইটটি দেখলাম, ভালো লেগেছে। আমি আপনাদের দিয়ে একটি ওয়েবসাইট তৈরি করাতে চাই। ওয়েবসাইট তৈরির সেবা, খরচ ও সময় সম্পর্কে বিস্তারিত জানাবেন, অনুগ্রহ করে।";
const developerWhatsappHref = `https://wa.me/8801317768213?text=${encodeURIComponent(developerWhatsappMessage)}`;

type MegaProduct = { title: string; image: string; href: string; badge?: string; description?: string };
type MegaGroup = { name: string; products: MegaProduct[] };
type MegaPromo = { title: string; image: string; href: string; description: string };
type MenuPlacementLite = { menu?: string; group?: string; sortOrder?: number; isActive?: boolean };
type MenuProductLite = { slug?: string; name?: string; images?: string[]; image?: string; badge?: string; shortDescription?: string; status?: string; isActive?: boolean; menuPlacements?: MenuPlacementLite[] };
type ContentEntryLite = { name?: string; title?: string; body?: string; image?: string; status?: string; sortOrder?: number; data?: Record<string, unknown> };

const defaultProductDetailsHref = "/products/dji-mini-5-pro-fly-more-combo-plus-rc2";

const fallbackAnnouncements = [
  "🚚 Fast Delivery",
  "DJI Official Dealer",
  "EMI Available",
  "🇧🇩 Bangladesh Wide Delivery",
  "Expert Support",
  "100% Original Products",
  "1 Year Official Warranty",
  "7 Days Replacement",
  "Cash on Delivery Available",
];

const fallbackMegaGroups: MegaGroup[] = [];
const fallbackHandheldGroups: MegaGroup[] = [];

/*
 * The reference store always has a complete Enterprise & Agriculture menu.
 * Keep that structure available while the CMS request is loading (and when a
 * deployment has not run the seed yet).  CMS/product entries are merged into
 * these groups below, so one incomplete API response cannot turn the menu
 * into a mostly empty white panel.
 */
const fallbackEnterpriseGroups: MegaGroup[] = [];
const fallbackEnterprisePromos: MegaPromo[] = [];

function mapContentEntries(payload: unknown): ContentEntryLite[] {
  return Array.isArray(payload) ? payload.filter((entry): entry is ContentEntryLite => Boolean(entry && typeof entry === "object")) : [];
}

function safeHref(value?: string) {
  const href = String(value || "").trim();
  return href.startsWith("/") ? href : defaultProductDetailsHref;
}

function entriesToMegaGroups(entries: ReturnType<typeof mapContentEntries>): MegaGroup[] {
  const groups = new Map<string, MegaProduct[]>();
  entries.filter((entry) => entry.status !== "draft" && entry.status !== "archived" && String(entry.data?.menuKind || "category") !== "promo").sort((a,b)=>Number(a.sortOrder||0)-Number(b.sortOrder||0)).forEach((entry) => {
    const name = entry.name || "DJI Mini";
    const products = groups.get(name) || [];
    products.push({ title: entry.title || entry.name || "DJI Product", image: entry.image || "/images/products/mini-5.jpg", href: safeHref(entry.body), description: String(entry.data?.description || "") });
    groups.set(name, products);
  });
  return [...groups.entries()].map(([name, products]) => ({ name, products })).filter((group) => group.products.length > 0);
}

function entriesToVisualMenu(entries: ReturnType<typeof mapContentEntries>) {
  const published = entries.filter((entry) => entry.status !== "draft" && entry.status !== "archived").sort((a,b)=>Number(a.sortOrder||0)-Number(b.sortOrder||0));
  const groups = entriesToMegaGroups(published).slice(0, 6);
  const promos: MegaPromo[] = published.filter((entry) => String(entry.data?.menuKind || "category") === "promo").slice(0, 3).map((entry) => ({
    title: entry.title || entry.name || "Featured solution",
    image: entry.image || "/images/hero-drone.jpg",
    href: safeHref(entry.body),
    description: String(entry.data?.description || "Explore products and support from Drone Bangladesh."),
  }));
  return { groups, promos };
}

function productsToMenuGroups(products: MenuProductLite[], menu: "drones" | "handhelds" | "enterprise"): MegaGroup[] {
  const grouped = new Map<string, { order: number; items: Array<MegaProduct & { order: number }> }>();
  products.filter((product) => product.status !== "draft" && product.status !== "archived" && product.isActive !== false).forEach((product) => {
    const placements = Array.isArray(product.menuPlacements) ? product.menuPlacements : [];
    placements.filter((placement) => placement.menu === menu && placement.isActive !== false && String(placement.group || "").trim()).forEach((placement) => {
      const group = String(placement.group || "").trim();
      const order = Number(placement.sortOrder || 0);
      const bucket = grouped.get(group) || { order, items: [] };
      bucket.order = Math.min(bucket.order, order);
      bucket.items.push({ title: product.name || product.slug || "Drone Bangladesh Product", image: product.image || product.images?.[0] || "/images/products/mini-5.jpg", href: product.slug ? `/products/${encodeURIComponent(product.slug)}` : "/products", badge: product.badge, description: product.shortDescription, order });
      grouped.set(group, bucket);
    });
  });
  return [...grouped.entries()].sort((a,b)=>a[1].order-b[1].order).map(([name, bucket]) => ({ name, products: bucket.items.sort((a,b)=>a.order-b.order).map(({order:_order,...product})=>product) })).filter((group)=>group.products.length>0);
}

function mergeMegaGroups(...collections: MegaGroup[][]): MegaGroup[] {
  const groups = new Map<string, MegaProduct[]>();
  collections.flat().forEach((group) => {
    const products = groups.get(group.name) || [];
    group.products.forEach((product) => {
      if (!products.some((item) => item.title === product.title)) products.push(product);
    });
    groups.set(group.name, products);
  });
  return [...groups.entries()].map(([name, products]) => ({ name, products }));
}

function completeMenuGroups(incoming: MegaGroup[], fallback: MegaGroup[]) {
  return mergeMegaGroups(incoming, fallback);
}

function completeEnterpriseGroups(incoming: MegaGroup[]) {
  // Mega menu is fully admin/product driven. No demo fallback products.
  return incoming;
}

function completeEnterprisePromos(incoming: MegaPromo[]) {
  if (!incoming.length) return fallbackEnterprisePromos;
  const titles = new Set(incoming.map((promo) => promo.title));
  return [...incoming, ...fallbackEnterprisePromos.filter((promo) => !titles.has(promo.title))].slice(0, 3);
}

export function SiteHeader() {
  const pathname = usePathname();
  const [cartCount, setCartCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [megaTarget, setMegaTarget] = useState<"drones" | "handhelds" | "enterprise" | "all">("drones");
  const [megaCategory, setMegaCategory] = useState("DJI Mavic");
  const [megaGroups, setMegaGroups] = useState<MegaGroup[]>(fallbackMegaGroups);
  const [handheldGroups, setHandheldGroups] = useState<MegaGroup[]>(fallbackHandheldGroups);
  const [enterpriseGroups, setEnterpriseGroups] = useState<MegaGroup[]>(fallbackEnterpriseGroups);
  const [dronePromos, setDronePromos] = useState<MegaPromo[]>([]);
  const [handheldPromos, setHandheldPromos] = useState<MegaPromo[]>([]);
  const [enterprisePromos, setEnterprisePromos] = useState<MegaPromo[]>(fallbackEnterprisePromos);
  const [allMenuGroups, setAllMenuGroups] = useState<MegaGroup[]>([]);
  const [announcementItems, setAnnouncementItems] = useState(fallbackAnnouncements);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const update = () => setCartCount(getCartCount());
    const updateRemote = async () => {
      if (!getApiBase()) return update();
      try {
        const response = await apiRequest<{ data?: { items?: Array<{ quantity?: number }> } }>("/cart");
        setCartCount((response.data?.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0));
      } catch { update(); }
    };
    void updateRemote();
    window.addEventListener("drone-cart-updated", updateRemote);
    return () => window.removeEventListener("drone-cart-updated", updateRemote);
  }, []);

  useEffect(() => {
    const loadManagedContent = async () => {
      let managedAnnouncements: string[] = [];
      let managedMega: MegaGroup[] = fallbackMegaGroups;
      let managedHandheld: MegaGroup[] = fallbackHandheldGroups;
      let managedDronePromos: MegaPromo[] = [];
      let managedHandheldPromos: MegaPromo[] = [];
      let managedEnterprise: MegaGroup[] = fallbackEnterpriseGroups;
      let managedEnterprisePromos: MegaPromo[] = fallbackEnterprisePromos;
      let managedAll: MegaGroup[] = [];
      try {
        const saved = JSON.parse(window.localStorage.getItem("drone-admin-content") || "{}");
        const announcementEntries = mapContentEntries(saved.announcements).filter((entry) => entry.status !== "draft" && entry.status !== "archived");
        managedAnnouncements = announcementEntries.map((entry) => entry.title || entry.name || "").filter(Boolean);
        const droneMenu = entriesToVisualMenu(mapContentEntries(saved["mega-menu"]));
        managedMega = completeMenuGroups(droneMenu.groups, fallbackMegaGroups); managedDronePromos = droneMenu.promos;
        const handheldMenu = entriesToVisualMenu(mapContentEntries(saved["handheld-menu"]));
        managedHandheld = completeMenuGroups(handheldMenu.groups, fallbackHandheldGroups); managedHandheldPromos = handheldMenu.promos;
        const enterpriseMenu = entriesToVisualMenu(mapContentEntries(saved["enterprise-menu"]));
        managedEnterprise = completeEnterpriseGroups(enterpriseMenu.groups); managedEnterprisePromos = completeEnterprisePromos(enterpriseMenu.promos);
        managedAll = entriesToMegaGroups(mapContentEntries(saved["all-products-menu"]));
      } catch { /* demo fallback */ }
      const base = getApiBase();
      if (base) {
        try {
          const [announcementResponse, megaResponse, handheldResponse, enterpriseResponse, allResponse, productsResponse] = await Promise.all([fetch(`${base}/content/announcements`), fetch(`${base}/content/mega-menu`), fetch(`${base}/content/handheld-menu`), fetch(`${base}/content/enterprise-menu`), fetch(`${base}/content/all-products-menu`), fetch(`${base}/products?limit=100`)]);
          if (announcementResponse.ok) {
            const entries = mapContentEntries((await announcementResponse.json() as { data?: unknown }).data).filter((entry) => entry.status !== "draft" && entry.status !== "archived");
            const remote = entries.map((entry) => entry.title || entry.name || "").filter(Boolean);
            if (remote.length) managedAnnouncements = remote;
          }
          if (megaResponse.ok) {
            const remoteMenu = entriesToVisualMenu(mapContentEntries((await megaResponse.json() as { data?: unknown }).data));
            managedMega = completeMenuGroups(remoteMenu.groups, fallbackMegaGroups); managedDronePromos = remoteMenu.promos;
          }
          if (handheldResponse.ok) {
            const remoteMenu = entriesToVisualMenu(mapContentEntries((await handheldResponse.json() as { data?: unknown }).data));
            managedHandheld = completeMenuGroups(remoteMenu.groups, fallbackHandheldGroups); managedHandheldPromos = remoteMenu.promos;
          }
          if (enterpriseResponse.ok) {
            const remoteMenu = entriesToVisualMenu(mapContentEntries((await enterpriseResponse.json() as { data?: unknown }).data));
            managedEnterprise = completeEnterpriseGroups(remoteMenu.groups); managedEnterprisePromos = completeEnterprisePromos(remoteMenu.promos);
          }
          if (allResponse.ok) {
            const remoteGroups = entriesToMegaGroups(mapContentEntries((await allResponse.json() as { data?: unknown }).data));
            if (remoteGroups.length) managedAll = remoteGroups;
          }
          if (productsResponse.ok) {
            const payload = await productsResponse.json() as { data?: MenuProductLite[] };
            const products = Array.isArray(payload.data) ? payload.data : [];
            managedMega = mergeMegaGroups(managedMega, productsToMenuGroups(products, "drones"));
            managedHandheld = mergeMegaGroups(managedHandheld, productsToMenuGroups(products, "handhelds"));
            managedEnterprise = completeEnterpriseGroups(mergeMegaGroups(managedEnterprise, productsToMenuGroups(products, "enterprise")));
          }
        } catch { /* fallback to locally managed content */ }
      }
      if (managedAnnouncements.length) setAnnouncementItems(managedAnnouncements);
      if (managedMega.length) {
        setMegaGroups(managedMega);
        setMegaCategory((current) => managedMega.some((group) => group.name === current) ? current : managedMega[0].name);
      }
      if (managedHandheld.length) setHandheldGroups(managedHandheld);
      if (managedDronePromos.length) setDronePromos(managedDronePromos);
      if (managedHandheldPromos.length) setHandheldPromos(managedHandheldPromos);
      if (managedEnterprise.length) setEnterpriseGroups(managedEnterprise);
      if (managedEnterprisePromos.length) setEnterprisePromos(managedEnterprisePromos);
      if (managedAll.length) setAllMenuGroups(managedAll);
    };
    void loadManagedContent();
  }, []);

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    window.location.href = query.trim() ? `/search?q=${encodeURIComponent(query.trim())}` : "/search";
  }

  const openMega = (type: "drones" | "handhelds" | "enterprise") => {
    setMegaTarget(type);
    setMegaOpen(true);
  };
  const allProductGroups = allMenuGroups.length ? allMenuGroups : mergeMegaGroups(megaGroups, enterpriseGroups, handheldGroups);
  const openAllMega = () => {
    if (!allProductGroups.some((group) => group.name === megaCategory)) setMegaCategory(allProductGroups[0]?.name || "");
    setMegaTarget("all");
    setMegaOpen(true);
  };
  return (
    <>
      <div className="announcement" aria-label="Store announcements"><div className="announcement-viewport"><div className="announcement-track">{[...announcementItems, ...announcementItems].map((item, index) => <span key={`${item}-${index}`}><b>{item}</b><i>•</i></span>)}</div></div></div>
      <header className="main-header">
        <div className="page-container header-main">
          <Link href="/" className="logo" aria-label="Drone Bangladesh home">
            <img className="brand-logo-image" src="/images/logo/drone-bangladesh.png" alt="Drone Bangladesh" />
          </Link>
          <form className="search-box" onSubmit={submitSearch} role="search">
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search drones, cameras & accessories..." aria-label="Search products" />
            <button type="submit" aria-label="Submit search"><Search size={19} /></button>
          </form>
          <div className="header-actions">
            <Link href="/track-order" className="header-action"><Truck /><span>Track Order</span></Link>
            <Link href="/account" className="header-action"><UserRound /><span>Sign In</span></Link>
            <Link href="/wishlist" className="header-action"><Heart /><span>Wishlist</span></Link>
            <Link href="/cart" className="header-action"><ShoppingCart /><i className="count">{cartCount}</i><span>Cart</span></Link>
            <button className="header-action mobile-menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Open menu">{menuOpen ? <X /> : <Menu />}<span>Menu</span></button>
          </div>
        </div>
        <nav className="nav-bar" aria-label="Primary navigation">
          <Link href="/">Home</Link>
          <div className={`nav-mega-item ${megaOpen && megaTarget === "drones" ? "open" : ""}`} onMouseEnter={() => openMega("drones")} onMouseLeave={() => setMegaOpen(false)}>
            <button className="nav-mega-trigger" type="button" aria-expanded={megaOpen && megaTarget === "drones"} onClick={() => megaTarget === "drones" ? setMegaOpen((open) => !open) : openMega("drones")} onFocus={() => openMega("drones")}>Drones <ChevronDown size={14} /></button>
            {megaOpen && megaTarget === "drones" && <VisualMegaMenu groups={megaGroups} promos={dronePromos} variant="drones" emptyLabel="Drones" />}
          </div>
          <div className={`nav-mega-item ${megaOpen && megaTarget === "handhelds" ? "open" : ""}`} onMouseEnter={() => openMega("handhelds")} onMouseLeave={() => setMegaOpen(false)}>
            <button className="nav-mega-trigger" type="button" aria-expanded={megaOpen && megaTarget === "handhelds"} onClick={() => megaTarget === "handhelds" ? setMegaOpen((open) => !open) : openMega("handhelds")} onFocus={() => openMega("handhelds")}>Handhelds <ChevronDown size={14} /></button>
            {megaOpen && megaTarget === "handhelds" && <VisualMegaMenu groups={handheldGroups} promos={handheldPromos} variant="handhelds" emptyLabel="Handhelds" />}
          </div>
          <div className={`nav-mega-item enterprise-nav ${megaOpen && megaTarget === "enterprise" ? "open" : ""}`} onMouseEnter={() => openMega("enterprise")} onMouseLeave={() => setMegaOpen(false)}>
            <button className="nav-mega-trigger" type="button" aria-expanded={megaOpen && megaTarget === "enterprise"} onClick={() => megaTarget === "enterprise" ? setMegaOpen((open) => !open) : openMega("enterprise")} onFocus={() => openMega("enterprise")}>Enterprise &amp; Agriculture <ChevronDown size={14} /></button>
            {megaOpen && megaTarget === "enterprise" && <VisualMegaMenu groups={enterpriseGroups} promos={enterprisePromos} variant="enterprise" emptyLabel="Enterprise & Agriculture" />}
          </div>
          <div className={`nav-mega-item all-products-nav ${megaOpen && megaTarget === "all" ? "open" : ""}`} onMouseEnter={openAllMega} onMouseLeave={() => setMegaOpen(false)}>
            <button className="nav-mega-trigger" type="button" aria-expanded={megaOpen && megaTarget === "all"} onClick={() => { if (megaTarget !== "all") { openAllMega(); } else setMegaOpen((open) => !open); }} onFocus={openAllMega}>All Products <ChevronDown size={14} /></button>
            {megaOpen && megaTarget === "all" && <AllProductsMegaMenu groups={allProductGroups} activeName={megaCategory} onSelect={setMegaCategory} />}
          </div>
          <Link className={pathname.startsWith("/articles") ? "active" : ""} href="/articles">Article</Link>
          <Link className={pathname.startsWith("/about-us") ? "active" : ""} href="/about-us">About Us</Link>
          <Link className={`maintenance-link ${pathname.startsWith("/maintenance") || pathname.startsWith("/repairs") ? "active" : ""}`} href="/maintenance">Maintenance</Link>
          <Link href="/contact">Contact <ChevronDown size={12} /></Link>
        </nav>
        {menuOpen && <MobileStoreMenu query={query} setQuery={setQuery} onSearch={submitSearch} onClose={() => setMenuOpen(false)} drones={megaGroups} handhelds={handheldGroups} enterprise={enterpriseGroups} allProducts={allMenuGroups.length ? allMenuGroups : allProductGroups} cartCount={cartCount} />}
      </header>
    </>
  );
}

function MobileMenuAccordion({ label, open, accent = false, onToggle, children }: { label: string; open: boolean; accent?: boolean; onToggle: () => void; children: ReactNode }) {
  return <section className={`mobile-store-section ${open ? "is-open" : ""}`}>
    <button type="button" className={`mobile-store-section-trigger ${accent ? "accent" : ""}`} onClick={onToggle} aria-expanded={open}>{label}{open ? <ChevronUp size={22} /> : <ChevronDown size={22} />}</button>
    {open && <div className="mobile-store-section-content">{children}</div>}
  </section>;
}

function MobileStoreMenu({ query, setQuery, onSearch, onClose, drones, handhelds, enterprise, allProducts, cartCount }: { query: string; setQuery: (value: string) => void; onSearch: (event: React.FormEvent<HTMLFormElement>) => void; onClose: () => void; drones: MegaGroup[]; handhelds: MegaGroup[]; enterprise: MegaGroup[]; allProducts: MegaGroup[]; cartCount: number }) {
  const [openSection, setOpenSection] = useState<"drones" | "handhelds" | "enterprise" | "all" | null>("drones");
  const [activeCategory, setActiveCategory] = useState(allProducts[0]?.name || "");
  const [activeProduct, setActiveProduct] = useState(allProducts[0]?.products[0]?.title || "");

  useEffect(() => {
    if (!allProducts.length) return;
    if (!allProducts.some((group) => group.name === activeCategory)) queueMicrotask(() => {
      setActiveCategory(allProducts[0].name);
      setActiveProduct(allProducts[0].products[0]?.title || "");
    });
  }, [activeCategory, allProducts]);

  const productCards = (groups: MegaGroup[]) => <div className="mobile-menu-card-grid">{groups.map((group) => {
    const product = group.products[0];
    if (!product) return null;
    return <Link className="mobile-menu-product-card" key={group.name} href={product.href} onClick={onClose}>
      <span><img src={product.image || "/images/products/mini-5.jpg"} alt={group.name} /></span>
      <strong>{group.name}</strong>
    </Link>;
  })}</div>;

  const chooseCategory = (group: MegaGroup) => {
    setActiveCategory(group.name);
    setActiveProduct(group.products[0]?.title || "");
  };
  const activeGroup = allProducts.find((group) => group.name === activeCategory) || allProducts[0];

  return <div className="mobile-menu-backdrop" role="presentation" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <aside className="mobile-store-menu" aria-label="Mobile navigation">
      <header className="mobile-store-menu-header">
        <Link href="/" className="mobile-store-menu-logo" onClick={onClose}><img src="/images/logo/drone-bangladesh.png" alt="Drone Bangladesh" /></Link>
        <div className="mobile-store-menu-actions">
          <Link href="/track-order" onClick={onClose} aria-label="Track order"><Truck /></Link>
          <Link href="/account" onClick={onClose} aria-label="Sign in"><UserRound /></Link>
          <Link href="/wishlist" onClick={onClose} aria-label="Wishlist"><Heart /></Link>
          <Link href="/cart" onClick={onClose} aria-label="Cart" className="mobile-menu-cart"><ShoppingCart /><i>{cartCount}</i></Link>
          <button type="button" onClick={onClose} aria-label="Close menu"><X /></button>
        </div>
      </header>
      <form className="mobile-store-search" onSubmit={onSearch} role="search">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search drones, cameras & accessories..." aria-label="Search products" />
        <button type="submit" aria-label="Submit search"><Search size={22} /></button>
      </form>
      <nav className="mobile-store-menu-list" aria-label="Mobile primary navigation">
        <Link href="/" className="mobile-store-home" onClick={onClose}>Home</Link>
        <MobileMenuAccordion label="Drones" open={openSection === "drones"} accent={openSection === "drones"} onToggle={() => setOpenSection(openSection === "drones" ? null : "drones")}>{productCards(drones)}</MobileMenuAccordion>
        <MobileMenuAccordion label="Handhelds" open={openSection === "handhelds"} accent={openSection === "handhelds"} onToggle={() => setOpenSection(openSection === "handhelds" ? null : "handhelds")}>{productCards(handhelds)}</MobileMenuAccordion>
        <MobileMenuAccordion label="Enterprise & Agriculture" open={openSection === "enterprise"} accent={openSection === "enterprise"} onToggle={() => setOpenSection(openSection === "enterprise" ? null : "enterprise")}>{productCards(enterprise)}</MobileMenuAccordion>
        <MobileMenuAccordion label="All Products" open={openSection === "all"} accent={openSection === "all"} onToggle={() => setOpenSection(openSection === "all" ? null : "all")}>
          <div className="mobile-all-products-list">{allProducts.map((group) => {
            const isActive = activeGroup?.name === group.name;
            return <div className={`mobile-all-category ${isActive ? "active" : ""}`} key={group.name}>
              <button type="button" onClick={() => chooseCategory(group)}>{group.name}{isActive ? <ChevronUp size={21} /> : <ChevronDown size={21} />}</button>
              {isActive && <div className="mobile-all-product-items">{group.products.map((product, index) => index === 0 && activeProduct === product.title ? <div className="mobile-all-product-expanded" key={product.title}>
                <button type="button" aria-label={`Collapse ${product.title}`} onClick={() => setActiveProduct("")}><span>{product.title}</span><ChevronUp size={20} /></button>
                <Link href={product.href} onClick={onClose}><img src={product.image || "/images/products/mini-5.jpg"} alt={product.title} /><strong>{product.title}</strong></Link>
              </div> : <Link className="mobile-all-product-row" href={product.href} onClick={onClose} key={product.title}><span>{product.title}</span><ChevronDown size={20} /></Link>)}</div>}
            </div>;
          })}</div>
        </MobileMenuAccordion>
        <Link href="/combos-accessories" className="mobile-store-collapsed-row" onClick={onClose}>Combo &amp; Accessories <ChevronDown size={21} /></Link>
        <Link href="/#featured-categories" className="mobile-store-collapsed-row" onClick={onClose}>Featured Categories <ChevronDown size={21} /></Link>
        <Link href="/articles" className="mobile-store-collapsed-row" onClick={onClose}>Articles <ChevronDown size={21} /></Link>
        <Link href="/about-us" className="mobile-store-collapsed-row" onClick={onClose}>About Us <ChevronDown size={21} /></Link>
        <Link href="/maintenance" className="mobile-store-collapsed-row" onClick={onClose}>Maintenance <ChevronDown size={21} /></Link>
        <Link href="/contact" className="mobile-store-collapsed-row" onClick={onClose}>Contact <ChevronDown size={21} /></Link>
      </nav>
    </aside>
  </div>;
}

function MegaCollectionGrid({ groups, simple = false }: { groups: MegaGroup[]; simple?: boolean }) {
  return <div className="mega-collection-grid">{groups.map((group) => <article className={`mega-collection-card ${simple ? "mega-simple-card" : ""}`} key={group.name}>
    {group.products[0] && <>{!simple && <p className="mega-collection-category">{group.name}</p>}<Link href={group.products[0].href} className="mega-collection-image"><img src={group.products[0].image || "/images/products/mini-5.jpg"} alt={simple ? group.name : group.name} /></Link><Link href={group.products[0].href} className="mega-collection-title">{group.name}</Link></>}
    {!simple && <><div className="mega-submenu-list">{group.products.slice(0, 6).map((product) => <Link href={product.href} key={`${group.name}-${product.title}`}><span>{product.title}</span>{product.badge && <em>{product.badge}</em>}</Link>)}</div>{group.products[0] && <Link href={group.products[0].href} className="mega-collection-cart-link"><ShoppingCart size={12} /> View &amp; add to cart</Link>}</>}
  </article>)}</div>;
}

function MegaCollectionMenu({ groups, label, compact = false, variant }: { groups: MegaGroup[]; label: string; compact?: boolean; variant?: "drones" | "handhelds" | "enterprise" }) {
  return <div className={`mega-menu all-products-mega ${compact ? "compact-collection-mega" : ""} ${variant ? `${variant}-collection-mega` : ""}`} onMouseEnter={(event) => event.stopPropagation()}>
    <div className="all-products-inner">
      <div className="mega-collection-label"><span>{label}</span><Link href="/products">View all <ChevronRight size={14} /></Link></div>
      {/* Drones and Handhelds keep the compact image scale, while retaining
          the linked product titles/submenus required by the desktop menu. */}
      <MegaCollectionGrid groups={groups} />
    </div>
  </div>;
}

function VisualMegaMenu({ groups, promos, variant, emptyLabel }: { groups: MegaGroup[]; promos: MegaPromo[]; variant: "drones" | "handhelds" | "enterprise"; emptyLabel: string }) {
  if (!groups.length && !promos.length) return <div className={`mega-menu enterprise-reference-mega visual-reference-mega ${variant}-visual-mega`}><div className="enterprise-empty">{emptyLabel} menu is ready for Admin products and menu content.</div></div>;
  return <div className={`mega-menu enterprise-reference-mega visual-reference-mega ${variant}-visual-mega`} onMouseEnter={(event) => event.stopPropagation()}>
    <div className="enterprise-reference-inner">
      <div className="enterprise-top-grid">{groups.slice(0,6).map((group) => { const visual=group.products[0]; return <section className="enterprise-group" key={group.name}>
        {visual && <Link href={visual.href} className="enterprise-group-image"><img src={visual.image || "/images/products/mavic-3.jpg"} alt={`${group.name} products`} loading="lazy"/></Link>}
        <h3>{group.name}</h3><i/>
        <div className="enterprise-link-list">{group.products.slice(0,7).map((item) => <Link href={item.href} key={`${group.name}-${item.title}`}>{item.title}</Link>)}</div>
      </section>; })}</div>
      {promos.length > 0 && <div className="enterprise-promo-grid">{promos.slice(0,3).map((promo) => <Link href={promo.href} className="enterprise-promo-card" key={promo.title}>
        <img src={promo.image || "/images/hero-drone.jpg"} alt={`${promo.title} featured solution`} loading="lazy"/><div><h3>{promo.title}</h3><p>{promo.description}</p></div><span><ChevronRight size={20}/></span>
      </Link>)}</div>}
    </div>
  </div>;
}

function AllProductsMegaMenu({ groups, activeName, onSelect }: { groups: MegaGroup[]; activeName: string; onSelect: (name: string) => void }) {
  const activeGroup = groups.find((group) => group.name === activeName) || groups[0];
  return <div className="mega-menu all-products-mega all-products-sidebar-mega" onMouseEnter={(event) => event.stopPropagation()}>
    <div className="all-products-sidebar-layout">
      <aside className="all-products-sidebar" aria-label="All product categories">
        <div className="all-products-sidebar-heading">Explore products</div>
        <div className="all-products-sidebar-list">{groups.map((group) => <button key={group.name} type="button" className={activeGroup?.name === group.name ? "active" : ""} onMouseEnter={() => onSelect(group.name)} onFocus={() => onSelect(group.name)} onClick={() => onSelect(group.name)}>{group.name}<ChevronRight size={15} /></button>)}</div>
      </aside>
      <section className="all-products-results" aria-live="polite">
        <div className="all-products-results-heading"><div><p>Explore products</p><h2>{activeGroup?.name || "All products"}</h2></div><Link href="/products">View all <ChevronRight size={14} /></Link></div>
        <div className="all-products-product-grid">{activeGroup?.products.map((product) => <article className="all-products-product-card" key={product.title}>
          <Link href={product.href} className="all-products-product-image" aria-label={`View ${product.title}`}><img src={product.image || "/images/products/mini-5.jpg"} alt={product.title} /></Link>
          <Link href={product.href} className="all-products-product-title">{product.title}</Link>
          <Link href={product.href} className="all-products-product-cart"><ShoppingCart size={12} /> View &amp; add to cart</Link>
        </article>)}</div>
      </section>
    </div>
  </div>;
}

export function SectionHeading({ title, eyebrow, href }: { title: string; eyebrow?: string; href?: string }) {
  return <div className="section-heading"><div>{eyebrow && <p>{eyebrow}</p>}<h2>{title}</h2></div>{href && <Link className="view-all" href={href}>View all <ChevronRight size={14} /></Link>}</div>;
}

export function StoreCard({ icon, title, address }: { icon: ReactNode; title: string; address: string }) {
  return <article className="store-card"><span className="store-icon">{icon}</span><div><strong>{title}</strong><p>{address}, Bangladesh</p></div></article>;
}

export function ProductCard({ product, compact = false }: { product: ProductData; compact?: boolean }) {
  const [added, setAdded] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hoverSlide, setHoverSlide] = useState(0);
  const [isHoveringImage, setIsHoveringImage] = useState(false);
  useEffect(() => {
    let active = true;
    void (async () => {
      if (getApiBase()) {
        try {
          const result = await apiRequest<{ data?: ProductData[] }>("/account/wishlist");
          if (active) setSaved((result.data || []).some((item) => item.slug === product.slug));
          return;
        } catch { /* guest visitors use local wishlist until they sign in */ }
      }
      try {
        const items = JSON.parse(window.localStorage.getItem("drone-bangladesh-wishlist") || "[]") as ProductData[];
        if (active) setSaved(items.some((item) => item.slug === product.slug));
      } catch { if (active) setSaved(false); }
    })();
    return () => { active = false; };
  }, [product.slug]);
  async function toggleWishlist() {
    const nextSaved = !saved;
    setSaved(nextSaved);
    if (getApiBase()) {
      try {
        await apiRequest(`/account/wishlist/${encodeURIComponent(product.slug)}`, { method: nextSaved ? "POST" : "DELETE" });
        window.dispatchEvent(new Event("drone-wishlist-updated"));
        return;
      } catch { /* not signed in: keep a local wishlist */ }
    }
    try {
      const key = "drone-bangladesh-wishlist";
      const items = JSON.parse(window.localStorage.getItem(key) || "[]") as ProductData[];
      const exists = items.some((item) => item.slug === product.slug);
      const next = nextSaved && !exists ? [product, ...items] : !nextSaved ? items.filter((item) => item.slug !== product.slug) : items;
      window.localStorage.setItem(key, JSON.stringify(next));
      window.dispatchEvent(new Event("drone-wishlist-updated"));
    } catch { setSaved(saved); }
  }
  const imageSlides = Array.from(new Set(
    [product.image, ...(product.images || []), product.hoverImage]
      .filter((image): image is string => typeof image === "string" && image.trim().length > 0),
  ));

  function startImagePreview() {
    setHoverSlide(imageSlides.length > 1 ? 1 : 0);
    setIsHoveringImage(true);
  }

  function stopImagePreview() {
    setIsHoveringImage(false);
    setHoverSlide(0);
  }

  useEffect(() => {
    if (!isHoveringImage || imageSlides.length < 2) {
      setHoverSlide(0);
      return;
    }
    const timer = window.setInterval(() => {
      setHoverSlide((current) => (current + 1) % imageSlides.length);
    }, 520);
    return () => window.clearInterval(timer);
  }, [isHoveringImage, imageSlides.length]);

  return <article className={`product-card ${compact ? "is-compact" : ""}`}
    onMouseEnter={startImagePreview}
    onMouseLeave={stopImagePreview}
    onFocus={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) startImagePreview(); }}
    onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) stopImagePreview(); }}
  >
    <button type="button" className={`product-wishlist ${saved ? "is-saved" : ""}`} onClick={() => void toggleWishlist()} aria-label={`${saved ? "Remove" : "Add"} ${product.name} ${saved ? "from" : "to"} wishlist`}><Heart size={16} fill={saved ? "currentColor" : "none"} /></button>
    {product.badge && <span className={`product-badge ${product.badge === "POPULAR" || product.badge === "BEST SELLER" ? "purple" : ""}`}>{product.badge}</span>}
    <Link
      href={`/products/${product.slug}`}
      className={`product-image ${imageSlides.length > 1 ? "has-hover-image" : ""}`}
    >
      <img
        src={imageSlides[hoverSlide] || product.image}
        alt={product.name}
        className={imageSlides.length > 1 ? "product-slide-image" : undefined}
      />
    </Link>
    <Link href={`/products/${product.slug}`}><h3>{product.name}</h3></Link>
    <p className="product-meta">{product.meta || (Number(product.stock || 0) > 0 ? "Official DJI product · In stock" : "Out of stock · Pre-order available")}</p>
    <div className="price-row"><span className="price">{price(product.price)}</span><span className="old-price">{price(product.oldPrice)}</span></div>
    {Number(product.stock || 0) > 0 ? <button className="add-cart" onClick={() => { void addToCart(product).then(() => { setAdded(true); setTimeout(() => setAdded(false), 1300); }).catch(() => setAdded(false)); }} aria-label={`Add ${product.name} to cart`}>{added ? "Added to Cart ✓" : "Add to Cart"}</button> : <Link className="add-cart preorder-card-action" href={`/products/${encodeURIComponent(product.slug)}#preorder`} aria-label={`Pre-order ${product.name}`}>Pre-Order</Link>}
  </article>;
}

export function SiteFooter() {
  const [siteSettings, setSiteSettings] = useState<Record<string, string>>({});
  useEffect(() => {
    if (!getApiBase()) return;
    void apiRequest<{ data?: Array<{ name?: string; title?: string; body?: string; status?: string }> }>("/content/settings")
      .then((result) => {
        const next: Record<string, string> = {};
        for (const entry of result.data || []) {
          if (entry.status === "draft" || entry.status === "archived") continue;
          const key = String(entry.name || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
          if (key) next[key] = String(entry.body || entry.title || "").trim();
        }
        setSiteSettings(next);
      })
      .catch(() => undefined);
  }, []);
  const phone = siteSettings["phone"] || "+880 1896-123434";
  const email = siteSettings["email"] || "dronebangladesh567@gmail.com";
  const facebook = siteSettings["facebook-url"] || process.env.NEXT_PUBLIC_FACEBOOK_URL || "https://web.facebook.com/dronebangladesh?";
  const youtube = siteSettings["youtube-url"] || process.env.NEXT_PUBLIC_YOUTUBE_URL || "https://www.youtube.com/@dronebangladesh9726";
  const instagram = siteSettings["instagram-url"] || process.env.NEXT_PUBLIC_INSTAGRAM_URL || "";
  return <>
    <footer className="site-footer">
      <div className="page-container footer-grid">
        <div className="footer-logo">
          <Link href="/" className="logo"><img className="brand-logo-image" src="/images/logo/drone-bangladesh.png" alt="Drone Bangladesh" /></Link>
          <p className="footer-description">Your trusted partner for premium drones, cameras and accessories in Bangladesh.</p>
          <div className="socials">{facebook&&<a href={facebook} target="_blank" rel="noreferrer" aria-label="Facebook">f</a>}{youtube&&<a href={youtube} target="_blank" rel="noreferrer" aria-label="YouTube">▶</a>}{instagram&&<a href={instagram} target="_blank" rel="noreferrer" aria-label="Instagram">◎</a>}<a href={whatsappHref} target="_blank" rel="noreferrer" aria-label="Chat on WhatsApp"><MessageCircle size={15} /></a></div>
        </div>
        <div className="footer-col"><h3>Quick links</h3><Link href="/about-us">About Us</Link><Link href="/articles">Blog</Link><Link href="/terms">Terms & Conditions</Link><Link href="/privacy">Privacy Policy</Link><Link href="/refund">Refund & Returns</Link></div>
        <div className="footer-col"><h3>Customer service</h3><Link href="/contact">Contact Us</Link><Link href="/shipping">Shipping Policy</Link><Link href="/returns">Return Policy</Link><Link href="/warranty">Warranty Policy</Link><Link href="/authenticity-checker">Authenticity &amp; Warranty Checker</Link><Link href="/faqs">FAQs</Link></div>
        <div className="footer-col"><h3>My account</h3><Link href="/account">My Account</Link><Link href="/account/orders">Order History</Link><Link href="/wishlist">Wishlist</Link><Link href="/track-order">Track Order</Link><Link href="/account">Login / Register</Link></div>
        <div className="footer-col footer-address"><h3>Store address</h3><p><MapPin size={15} />Level-1, Block-B, Shop-45, Bashundhara City Shopping Complex, Dhaka-1215, Bangladesh</p><p><MapPin size={15} />Shop-444, Block-C, Level-4, Jamuna Future Park, Kuril, Dhaka-1229</p><p><MessageCircle size={15}/>{phone}</p><p>{email}</p></div>
      </div>
      <div className="page-container footer-bottom"><span>© 2024 Drone Bangladesh. All Rights Reserved.</span><div className="payments" aria-label="Accepted payment methods"><span>We Accept:</span><span className="payment-chip visa">VISA</span><span className="payment-chip mastercard">MC</span><span className="payment-chip bkash">bKash</span><span className="payment-chip nagad">NAGAD</span><span className="payment-chip amex">AMEX</span></div><a className="developer" href={developerWhatsappHref} target="_blank" rel="noreferrer">Developed by Dream Space IT</a></div>
    </footer>
    <SupportAssistant />
    <WhatsAppFloat />
  </>;
}

function WhatsAppFloat() {
  const [show, setShow] = useState(true);
  useEffect(() => {
    const timer = window.setTimeout(() => setShow(false), 7000);
    return () => window.clearTimeout(timer);
  }, []);
  return <>
    {show && <div className="whatsapp-popup">
      <button onClick={() => setShow(false)} aria-label="Close">×</button>
      <strong>Need Assistance?</strong>
      <span>Our drone experts are here to help with product advice, delivery updates, and technical support.</span>
      <a href={whatsappHref} target="_blank" rel="noreferrer">Start Chat</a>
    </div>}
    <a className="whatsapp-float premium" href={whatsappHref} target="_blank" rel="noreferrer" aria-label="Chat with Drone Bangladesh on WhatsApp" title="Chat with Drone Bangladesh on WhatsApp"><MessageCircle size={30} /></a>
  </>;
}

export function SupportAssistant() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [customEntries, setCustomEntries] = useState<SupportKnowledge[]>([]);
  const [messages, setMessages] = useState<Array<{ role: "assistant" | "user"; text: string }>>([{ role: "assistant", text: `Hi! I can help with drone prices, camera specs, flight time, warranty and delivery. I have ${AI_KNOWLEDGE_COUNT} product answers ready.` }]);

  useEffect(() => {
    const loadKnowledge = async () => {
      let entries: SupportKnowledge[] = [];
      try {
        const saved = JSON.parse(window.localStorage.getItem("drone-admin-content") || "{}");
        const local = mapContentEntries(saved["ai-faqs"]).filter((entry) => entry.status !== "draft" && entry.status !== "archived");
        entries = local.map((entry) => ({ question: entry.name || "Product question", answer: entry.body || entry.title || "Please contact our support team.", keywords: `${entry.name || ""} ${entry.title || ""}`.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean) }));
      } catch { /* demo fallback */ }
      const base = getApiBase();
      if (base) {
        try {
          const response = await fetch(`${base}/content/ai-faqs`);
          if (response.ok) {
            const remote = mapContentEntries((await response.json() as { data?: unknown }).data).filter((entry) => entry.status !== "draft" && entry.status !== "archived");
            if (remote.length) entries = remote.map((entry) => ({ question: entry.name || "Product question", answer: entry.body || entry.title || "Please contact our support team.", keywords: `${entry.name || ""} ${entry.title || ""}`.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean) }));
          }
        } catch { /* fallback to built-in knowledge */ }
      }
      setCustomEntries(entries);
    };
    void loadKnowledge();
  }, []);

  function ask(question = query) {
    const clean = question.trim();
    if (!clean) return;
    setMessages((current) => [...current, { role: "user", text: clean }, { role: "assistant", text: findSupportAnswer(clean, customEntries) }]);
    setQuery("");
  }

  return <>
    <button type="button" className={`ai-float ${open ? "active" : ""}`} onClick={() => setOpen((value) => !value)} aria-label="Open AI product assistant"><Bot size={21} /></button>
    {open && <section className="ai-panel" aria-label="Drone Bangladesh AI product assistant">
      <header><span className="ai-panel-icon"><Bot size={19} /></span><div><strong>Drone Bangladesh AI</strong><small>Product support · {AI_KNOWLEDGE_COUNT} answers</small></div><button type="button" onClick={() => setOpen(false)} aria-label="Close assistant"><X size={16} /></button></header>
      <div className="ai-messages">{messages.map((message, index) => <p className={message.role} key={`${message.role}-${index}`}>{message.text}</p>)}</div>
      <div className="ai-suggestions"><button type="button" onClick={() => ask("What is the price of DJI Mini 5 Pro?")}>Mini 5 Pro price</button><button type="button" onClick={() => ask("Which drone is good for a beginner?")}>Beginner drone</button><button type="button" onClick={() => ask("Do you deliver anywhere in Bangladesh?")}>Delivery</button></div>
      <form className="ai-input" onSubmit={(event) => { event.preventDefault(); ask(); }}><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ask about a product..." aria-label="Ask AI assistant" /><button type="submit" aria-label="Send question"><ChevronRight size={17} /></button></form>
      <a className="ai-handoff" href={whatsappHref}>Need a human? Chat on WhatsApp <ChevronRight size={13} /></a>
    </section>}
  </>;
}

export function ProductTrustRow() {
  return <div className="product-trust-row"><span><PackageCheck size={17} />100% Original</span><span><Truck size={17} />Fast Delivery</span><span><CircleHelp size={17} />Expert Support</span></div>;
}
