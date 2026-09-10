"use client";

import {
  BarChart3,
  Bell,
  Boxes,
  CircleDollarSign,
  ClipboardList,
  Building2,
  FileText,
  FolderKanban,
  Gauge,
  Headphones,
  ImagePlus,
  LayoutDashboard,
  LifeBuoy,
  Link2,
  Megaphone,
  Mail,
  Menu,
  Package,
  PanelLeft,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Store,
  Tags,
  Users,
  Warehouse,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { apiRequest, getApiBase } from "@/lib/api";

type MenuItem = { label: string; href: string; icon: typeof LayoutDashboard; group?: string };

const menuItems: MenuItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard, group: "Main menu" },
  { label: "Home Page", href: "/admin/content?resource=home-sections", icon: PanelLeft },
  { label: "Banners", href: "/admin/content?resource=banners", icon: Megaphone },
  { label: "Categories", href: "/admin/content?resource=categories", icon: FolderKanban },
  { label: "Products", href: "/admin/products", icon: Package },
  { label: "Handhelds", href: "/admin/content?resource=handheld-menu", icon: Gauge },
  { label: "Enterprise & Agriculture", href: "/admin/content?resource=enterprise-menu", icon: Building2 },
  { label: "All Products", href: "/admin/content?resource=all-products-menu", icon: Boxes },
  { label: "Combos & Accessories", href: "/admin/content?resource=accessory-mapping", icon: ShoppingBag },
  { label: "Buy Combo", href: "/admin/buy-combo", icon: Link2 },
  { label: "Featured Categories", href: "/admin/content?resource=featured-categories", icon: Tags },
  { label: "Articles", href: "/admin/content?resource=articles", icon: FileText },
  { label: "Reviews", href: "/admin/reviews", icon: Headphones },
  { label: "Orders", href: "/admin/orders", icon: ClipboardList },
  { label: "Customers", href: "/admin/customers", icon: Users },
  { label: "Maintenance Requests", href: "/admin/maintenance-requests", icon: LifeBuoy },
  { label: "Queries", href: "/admin/queries", icon: Mail },
  { label: "Quotes", href: "/admin/quotes", icon: ClipboardList },
  { label: "Returns & Refunds", href: "/admin/returns", icon: LifeBuoy },
  { label: "Store Locations", href: "/admin/content?resource=stores", icon: Store },
  { label: "Coupons", href: "/admin/coupons", icon: CircleDollarSign },
  { label: "Inventory", href: "/admin/inventory", icon: Warehouse },
  { label: "Pre-Orders", href: "/admin/preorders", icon: ClipboardList },
  { label: "Authenticity & Warranty", href: "/admin/warranty-records", icon: ShieldCheck },
  { label: "Media Library", href: "/admin/media", icon: ImagePlus },
  { label: "Reports", href: "/admin/reports", icon: BarChart3 },
  { label: "Settings", href: "/admin/content?resource=settings", icon: Settings },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [globalSearch, setGlobalSearch] = useState("");
  const isLogin = pathname === "/admin/login";

  useEffect(() => {
    if (isLogin) { queueMicrotask(() => setAuthChecking(false)); return; }
    if (!getApiBase()) { router.replace("/admin/login"); queueMicrotask(() => setAuthChecking(false)); return; }
    let active = true;
    void apiRequest<{ data?: { role?: string } }>("/auth/me").then((result) => { if (active && result.data?.role !== "admin") router.replace("/admin/login"); }).catch(() => { if (active) router.replace("/admin/login"); }).finally(() => { if (active) setAuthChecking(false); });
    return () => { active = false; };
  }, [isLogin, router]);

  if (isLogin) return <>{children}</>;
  if (authChecking) return <main className="admin-auth-loading">Checking admin access…</main>;

  return <div className="admin-app-shell">
    {sidebarOpen && <button type="button" className="admin-sidebar-backdrop" onClick={() => setSidebarOpen(false)} aria-label="Close admin navigation" />}
    <aside className={`admin-app-sidebar ${sidebarOpen ? "is-open" : ""}`}>
      <div className="admin-sidebar-brand">
        <Link href="/admin" aria-label="Drone Bangladesh admin dashboard"><img src="/images/logo/drone-bangladesh.png" alt="Drone Bangladesh" /></Link>
        <button type="button" className="admin-sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Close navigation"><X size={18} /></button>
      </div>
      <nav className="admin-app-nav" aria-label="Admin navigation">
        <p className="admin-nav-label">Main menu</p>
        {menuItems.map(({ label, href, icon: Icon }) => {
          const [baseHref, query] = href.split("?");
          const resource = query ? new URLSearchParams(query).get("resource") : null;
          const active = resource
            ? pathname === baseHref && searchParams.get("resource") === resource
            : label === "Dashboard" ? pathname === baseHref : baseHref !== "/admin" && (pathname === baseHref || pathname.startsWith(`${baseHref}/`));
          return <Link href={href} className={active ? "active" : ""} onClick={() => setSidebarOpen(false)} key={label}><Icon size={17} /><span>{label}</span>{label === "Products" && <span className="admin-nav-chevron">⌄</span>}</Link>;
        })}
      </nav>
      <div className="admin-sidebar-bottom">
        <Link href="/" className="admin-visit-link" onClick={() => setSidebarOpen(false)}>Visit Website <span>↗</span></Link>
        <p>© 2026 Drone Bangladesh<br />All Rights Reserved.</p>
      </div>
    </aside>
    <div className="admin-app-main">
      <header className="admin-app-topbar">
        <button type="button" className="admin-mobile-menu" onClick={() => setSidebarOpen(true)} aria-label="Open admin navigation"><Menu size={20} /></button>
        <Link href="/admin" className="admin-topbar-brand"><img src="/images/logo/drone-bangladesh.png" alt="Drone Bangladesh" /></Link>
        <form className="admin-global-search" onSubmit={(event) => { event.preventDefault(); const q = globalSearch.trim(); if (q) router.push(`/admin/products?q=${encodeURIComponent(q)}`); }}><Search size={16} /><input value={globalSearch} onChange={(e) => setGlobalSearch(e.target.value)} placeholder="Search products, SKUs, orders..." aria-label="Search admin" /></form>
        <div className="admin-topbar-actions">
          <button type="button" className="admin-icon-action" aria-label="Open inventory alerts" onClick={() => router.push("/admin/inventory")}><span className="admin-notification-dot">!</span><Bell size={18} /></button>
          <button type="button" className="admin-icon-action" aria-label="Open customer queries" onClick={() => router.push("/admin/queries")}><span className="admin-notification-dot secondary">•</span><Mail size={18} /></button>
          <button type="button" className="admin-quick-add" onClick={() => router.push("/admin/products?new=1")}><span>+</span> Quick Add</button>
          <button type="button" className="admin-profile" onClick={() => { window.localStorage.removeItem("drone-admin-token"); void apiRequest("/auth/logout", { method: "POST" }).catch(() => undefined); router.replace("/admin/login"); }}><span className="admin-avatar">A</span><span><strong>Admin</strong><small>Super Admin</small></span><span className="admin-profile-chevron">⌄</span></button>
        </div>
      </header>
      <div className="admin-route-content">{children}</div>
    </div>
  </div>;
}
