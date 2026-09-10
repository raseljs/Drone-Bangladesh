"use client";

import {
  BadgeCheck,
  BookOpen,
  Boxes,
  CalendarDays,
  ChevronRight,
  CircleDollarSign,
  Eye,
  FileText,
  GripVertical,
  LayoutTemplate,
  MapPin,
  Package,
  Pencil,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
  Users,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiRequest, getApiBase } from "@/lib/api";

type SectionCard = { label: string; icon: typeof LayoutTemplate; active: boolean };
type ProductRow = { name: string; sku: string; category: string; price: string; stock: string; status: "Active" | "Low Stock"; image: string };

const sectionCards: SectionCard[] = [
  { label: "Hero Slider", icon: LayoutTemplate, active: true },
  { label: "Brand Logos", icon: BadgeCheck, active: true },
  { label: "Featured Categories", icon: Boxes, active: true },
  { label: "Visit Our Stores", icon: MapPin, active: true },
  { label: "New Arrival", icon: Sparkles, active: true },
  { label: "Our Honorable Customers", icon: Users, active: true },
  { label: "DJI Drone", icon: Truck, active: true },
  { label: "Personal Drone", icon: Package, active: true },
  { label: "Beginner Drone", icon: ShieldCheck, active: true },
  { label: "Drone News & Help Blog", icon: BookOpen, active: true },
];

const productRows: ProductRow[] = [
  { name: "DJI Mavic 3 Pro", sku: "SKU12345", category: "Drones", price: "৳ 2,40,000", stock: "12", status: "Active", image: "/images/products/mavic-3.jpg" },
  { name: "DJI Mini 4 Pro", sku: "SKU12346", category: "Drones", price: "৳ 1,05,000", stock: "25", status: "Active", image: "/images/products/mini-5.jpg" },
  { name: "DJI Air 3", sku: "SKU12347", category: "Drones", price: "৳ 1,65,000", stock: "8", status: "Low Stock", image: "/images/products/air-3.jpg" },
  { name: "DJI Osmo Pocket 3", sku: "SKU12348", category: "Handhelds", price: "৳ 68,000", stock: "15", status: "Active", image: "/images/products/mini-3.jpg" },
  { name: "DJI FPV Combo", sku: "SKU12349", category: "Drones", price: "৳ 1,20,000", stock: "5", status: "Low Stock", image: "/images/products/avata-2.jpg" },
];

const orderRows = [
  ["#ORD-15256", "Tanvir Hossain", "Paid", "Delivered", "May 20, 2025"],
  ["#ORD-15255", "Sadia Islam", "Paid", "Shipped", "May 20, 2025"],
  ["#ORD-15254", "Rafiq Ahmed", "Pending", "Processing", "May 19, 2025"],
  ["#ORD-15253", "Fahim Rahman", "Paid", "Delivered", "May 19, 2025"],
  ["#ORD-15252", "Nusrat Jahan", "Failed", "Canceled", "May 18, 2025"],
];

const maintenanceRows = [
  ["#MNT-0032", "Drone Repair", "Rahim Uddin", "Pending", "May 25, 2025"],
  ["#MNT-0031", "Battery Issue", "Sabbir Ahmed", "In Progress", "May 25, 2025"],
  ["#MNT-0030", "Calibration", "Nayeem Hasan", "Pending", "May 24, 2025"],
  ["#MNT-0029", "Firmware Update", "Ahsan Habib", "Completed", "May 24, 2025"],
  ["#MNT-0028", "Motor Replacement", "Hasan Mahmud", "Pending", "May 23, 2025"],
];

const articleCards = [
  ["How to Choose the Right Drone in 2025", "Buying Guide", "/images/articles/articles-reference.png", "Published"],
  ["DJI Mavic 3 Pro Review & Features", "Reviews", "/images/products/mavic-3.jpg", "Published"],
  ["Drone Flying Rules in Bangladesh", "Guides", "/images/hero-drone.jpg", "Published"],
  ["Top 10 Drones for Beginners", "Beginner Tips", "/images/products/mini-5.jpg", "Draft"],
];

const quickSettings = [
  ["Header Menu", "Manage top navigation", LayoutTemplate],
  ["Footer Links", "Manage footer links", Pencil],
  ["Store Address", "Manage store locations", MapPin],
  ["Social Media", "Manage social accounts", Sparkles],
  ["Homepage Visibility", "Show / Hide sections", Eye],
] as const;

function formatCount(value: number) { return value.toLocaleString("en-BD"); }

export default function AdminPage() {
  const [enabledSections, setEnabledSections] = useState(() => sectionCards.map((item) => item.active));
  const [productCount, setProductCount] = useState(1248);
  const [blogCount, setBlogCount] = useState(86);

  useEffect(() => {
    queueMicrotask(() => {
      try {
        const products = JSON.parse(window.localStorage.getItem("drone-admin-products") || "[]");
        const content = JSON.parse(window.localStorage.getItem("drone-admin-content") || "{}");
        if (Array.isArray(products) && products.length) setProductCount(products.length);
        if (Array.isArray(content.articles) && content.articles.length) setBlogCount(content.articles.length);
      } catch { /* retain dashboard defaults */ }
    });
    if (getApiBase()) void apiRequest<{ data?: { products?: number; orders?: number; publishedContent?: number; pendingMaintenance?: number } }>("/admin/dashboard").then((response) => {
      const data = response.data || {};
      if (typeof data.products === "number") setProductCount(data.products);
      if (typeof data.publishedContent === "number") setBlogCount(data.publishedContent);
    }).catch(() => undefined);
  }, []);

  const metrics = useMemo(() => [
    ["Total Products", formatCount(productCount), "12.5%", Boxes, "blue"],
    ["Total Orders", "2,536", "18.3%", ShoppingBag, "green"],
    ["Total Revenue", "৳ 18,75,600", "21.3%", CircleDollarSign, "orange"],
    ["Pending Maintenance", "32", "6.2%", Wrench, "red"],
    ["Blog Posts", formatCount(blogCount), "8.1%", FileText, "purple"],
    ["Total Customers", "1,986", "15.2%", Users, "cyan"],
  ] as const, [blogCount, productCount]);

  return <main className="admin-dashboard-view">
    <section className="admin-metric-grid" aria-label="Store metrics">
      {metrics.map(([label, value, change, Icon, tone]) => <article className="admin-metric-card" key={label}>
        <span className={`admin-metric-icon ${tone}`}><Icon size={22} /></span>
        <div><p>{label}</p><strong>{value}</strong><small><span>↑ {change}</span> <em>vs last week</em></small></div>
      </article>)}
    </section>

    <section className="admin-manager-card">
      <div className="admin-dashboard-section-heading"><div><h1>Homepage Section Manager</h1><p>Control the order and visibility of every approved storefront section.</p></div><span className="admin-date-pill"><CalendarDays size={14} /> May 16, 2025 - May 23, 2025</span></div>
      <div className="admin-section-manager-grid">
        {sectionCards.map(({ label, icon: Icon }, index) => <article className="admin-section-manager-item" key={label}>
          <div className="admin-section-manager-title"><span className="admin-section-icon"><Icon size={18} /></span><strong>{label}</strong><button type="button" className={`admin-toggle ${enabledSections[index] ? "is-on" : ""}`} aria-label={`${enabledSections[index] ? "Hide" : "Show"} ${label}`} onClick={() => setEnabledSections((current) => current.map((value, itemIndex) => itemIndex === index ? !value : value))}><span /></button></div>
          <div className="admin-section-manager-actions"><Link href="/admin/content" aria-label={`Edit ${label}`}><Pencil size={14} /></Link><button type="button" aria-label={`Reorder ${label}`}><GripVertical size={15} /></button><Link href="/admin/content" aria-label={`Preview ${label}`}><Eye size={14} /></Link></div>
        </article>)}
      </div>
    </section>

    <section className="admin-dashboard-triple-grid">
      <DashboardPanel title="Product Management" href="/admin/products" className="admin-product-management-panel">
        <div className="admin-table-scroll"><table className="admin-dashboard-table"><thead><tr><th>Product</th><th>SKU</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th>Action</th></tr></thead><tbody>{productRows.map((row) => <tr key={row.sku}><td><span className="admin-table-product"><img src={row.image} alt="" /><strong>{row.name}</strong></span></td><td>{row.sku}</td><td>{row.category}</td><td>{row.price}</td><td>{row.stock}</td><td><StatusBadge value={row.status} /></td><td><button className="admin-row-menu" type="button" aria-label={`More actions for ${row.name}`}>⋮</button></td></tr>)}</tbody></table></div>
      </DashboardPanel>
      <DashboardPanel title="Order Overview" href="/admin/content"><div className="admin-table-scroll"><table className="admin-dashboard-table"><thead><tr><th>Order ID</th><th>Customer</th><th>Payment Status</th><th>Delivery Status</th><th>Order Date</th></tr></thead><tbody>{orderRows.map((row) => <tr key={row[0]}>{row.map((cell, index) => <td key={`${row[0]}-${index}`}>{index === 2 || index === 3 ? <StatusBadge value={cell} /> : cell}</td>)}</tr>)}</tbody></table></div></DashboardPanel>
      <DashboardPanel title="Pending Maintenance Requests" href="/admin/content"><div className="admin-table-scroll"><table className="admin-dashboard-table"><thead><tr><th>Request ID</th><th>Service Type</th><th>Customer</th><th>Status</th><th>Date</th></tr></thead><tbody>{maintenanceRows.map((row) => <tr key={row[0]}>{row.map((cell, index) => <td key={`${row[0]}-${index}`}>{index === 3 ? <StatusBadge value={cell} /> : cell}</td>)}</tr>)}</tbody></table></div></DashboardPanel>
    </section>

    <section className="admin-dashboard-two-grid">
      <DashboardPanel title="Articles / Blog Management" href="/admin/content" className="admin-articles-panel">
        <div className="admin-article-grid">{articleCards.map(([title, category, image, status]) => <article className="admin-article-card" key={title}><img src={image} alt="" /><div><small>{category}</small><strong>{title}</strong><span className={status === "Draft" ? "draft" : "published"}>{status}</span></div></article>)}</div>
      </DashboardPanel>
      <DashboardPanel title="Quick Settings" className="admin-settings-panel">
        <div className="admin-quick-settings-grid">{quickSettings.map(([title, description, Icon]) => <Link href="/admin/content" key={title}><span className="admin-quick-settings-icon"><Icon size={19} /></span><strong>{title}</strong><small>{description}</small><ChevronRight size={15} /></Link>)}</div>
      </DashboardPanel>
    </section>

    <section className="admin-dashboard-two-grid">
      <DashboardPanel title="Maintenance Service Requests" href="/admin/content"><div className="admin-table-scroll"><table className="admin-dashboard-table admin-wide-table"><thead><tr><th>Service Type</th><th>Device Model</th><th>Customer</th><th>Request Date</th><th>Progress</th></tr></thead><tbody>{[["Repair", "DJI Mavic 3 Pro", "Shahab Al Hasan", "May 20, 2025", "In Progress"], ["Battery Replacement", "DJI Air 2S", "Nusrat Jahan", "May 19, 2025", "Pending"], ["Camera Repair", "DJI Mini 3 Pro", "Rafiq Ahmed", "May 19, 2025", "Completed"], ["Maintenance", "DJI FPV Combo", "Tanvir Hossain", "May 18, 2025", "In Progress"], ["Propeller Replacement", "DJI Mini 2", "Sadia Islam", "May 17, 2025", "Pending"]].map((row) => <tr key={row[0]}>{row.map((cell, index) => <td key={`${row[0]}-${index}`}>{index === 4 ? <StatusBadge value={cell} /> : cell}</td>)}</tr>)}</tbody></table></div></DashboardPanel>
      <DashboardPanel title="Recent Orders" href="/admin/content"><div className="admin-table-scroll"><table className="admin-dashboard-table"><thead><tr><th>Order ID</th><th>Customer</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead><tbody>{[["#ORD-15256", "Tanvir Hossain", "৳ 145,900", "Delivered", "May 25, 2025"], ["#ORD-15255", "Sadia Islam", "৳ 165,000", "Shipped", "May 25, 2025"], ["#ORD-15254", "Rafiq Ahmed", "৳ 68,000", "Processing", "May 24, 2025"], ["#ORD-15253", "Jannatul Mim", "৳ 120,000", "Delivered", "May 24, 2025"], ["#ORD-15252", "Murad Jahan", "৳ 145,900", "Pending", "May 24, 2025"]].map((row) => <tr key={row[0]}>{row.map((cell, index) => <td key={`${row[0]}-${index}`}>{index === 3 ? <StatusBadge value={cell} /> : cell}</td>)}</tr>)}</tbody></table></div></DashboardPanel>
    </section>
  </main>;
}

function DashboardPanel({ title, href, className = "", children }: { title: string; href?: string; className?: string; children: React.ReactNode }) {
  return <article className={`admin-dashboard-panel ${className}`}><div className="admin-dashboard-panel-heading"><h2>{title}</h2>{href && <Link href={href}>View All</Link>}</div>{children}</article>;
}

function StatusBadge({ value }: { value: string }) {
  const tone = value.toLowerCase().replace(/\s+/g, "-");
  return <span className={`admin-status-badge ${tone}`}>{value}</span>;
}
