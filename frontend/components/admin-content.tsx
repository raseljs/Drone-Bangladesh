"use client";

import { Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AdminAccessoryMappings from "@/components/admin-accessory-mappings";
import { apiFormRequest, apiRequest, getApiBase } from "@/lib/api";
import RichDescriptionEditor from "@/components/rich-description-editor";

type Resource = "home-sections" | "categories" | "brands" | "featured-categories" | "banners" | "articles" | "reviews" | "faqs" | "stores" | "accessories" | "accessory-mapping" | "announcements" | "mega-menu" | "handheld-menu" | "enterprise-menu" | "all-products-menu" | "maintenance" | "ai-faqs" | "coupons" | "pages" | "settings";
type EntryData = Record<string, string>;
type Entry = { id: string; name: string; slug?: string; title: string; body: string; bodyHtml: string; bodyCss: string; image: string; status: "published" | "draft"; sortOrder: number; data: EntryData };

const resources: Array<[Resource, string]> = [
  ["home-sections", "Home sections"], ["categories", "Categories"], ["brands", "Brands"], ["featured-categories", "Featured categories"], ["banners", "Banners"], ["mega-menu", "Drones mega menu"], ["handheld-menu", "Handhelds mega menu"], ["enterprise-menu", "Enterprise & Agriculture mega menu"], ["all-products-menu", "All Products mega menu"], ["accessory-mapping", "Accessory mappings"], ["announcements", "Announcement bar"], ["ai-faqs", "AI Q&A"], ["articles", "Articles"], ["maintenance", "Maintenance"], ["reviews", "Reviews"], ["faqs", "FAQs"], ["stores", "Stores"], ["accessories", "Accessories"], ["coupons", "Coupons"], ["pages", "Static pages"], ["settings", "Settings"],
];

const starter: Entry[] = [
  { id: "home-1", name: "New Arrival", title: "New arrival", body: "Latest DJI launches", bodyHtml: "", bodyCss: "", image: "/images/hero-drone.jpg", status: "published", sortOrder: 1, data: {} },
  { id: "home-2", name: "Customer Reviews", title: "Our honorable customers", body: "Verified customer stories", bodyHtml: "", bodyCss: "", image: "", status: "published", sortOrder: 2, data: {} },
];
const blank: Omit<Entry, "id"> = { name: "", slug: "", title: "", body: "", bodyHtml: "", bodyCss: "", image: "", status: "published", sortOrder: 0, data: {} };

function normalizeData(value: unknown): EntryData {
  if (!value || typeof value !== "object") return {};
  if (value instanceof Map) return Object.fromEntries([...value.entries()].map(([key, item]) => [String(key), String(item ?? "")]));
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, String(item ?? "")]));
}

export default function AdminContent() {
  const searchParams = useSearchParams();
  const requestedResource = searchParams.get("resource") as Resource | null;
  const [resource, setResource] = useState<Resource>(requestedResource && resources.some(([value]) => value === requestedResource) ? requestedResource : "home-sections");
  const [entries, setEntries] = useState<Record<Resource, Entry[]>>({ "home-sections": starter, categories: [], brands: [], "featured-categories": [], banners: [], "mega-menu": [], "handheld-menu": [], "enterprise-menu": [], "all-products-menu": [], "accessory-mapping": [], announcements: [], "ai-faqs": [], articles: [], maintenance: [], reviews: [], faqs: [], stores: [], accessories: [], coupons: [], pages: [], settings: [] });
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        if (getApiBase()) {
          const response = await apiRequest<{ data?: unknown }>(`/admin/${resource}`);
          if (Array.isArray(response.data)) {
            const remote = response.data as unknown[];
            setEntries((current) => ({ ...current, [resource]: remote.map((item, index) => {
              const value = item as Partial<Entry> & { _id?: string };
              return { ...blank, ...value, data: normalizeData(value.data), id: value.id || value._id || `remote-${index}`, sortOrder: Number(value.sortOrder || 0) };
            }) }));
            return;
          }
        }
        const saved = window.localStorage.getItem("drone-admin-content");
        if (saved) setEntries(JSON.parse(saved));
      } catch { /* keep local/demo content */ }
    };
    void load();
  }, [resource]);

  useEffect(() => {
    if (requestedResource && resources.some(([value]) => value === requestedResource) && requestedResource !== resource) {
      queueMicrotask(() => { setResource(requestedResource); setEditing(null); setForm(blank); });
    }
  }, [requestedResource, resource]);

  const current = useMemo(() => [...(entries[resource] || [])].sort((a, b) => a.sortOrder - b.sortOrder), [entries, resource]);
  function persist(next: Record<Resource, Entry[]>) { setEntries(next); window.localStorage.setItem("drone-admin-content", JSON.stringify(next)); }
  function updateData(key: string, value: string) { setForm((currentForm) => ({ ...currentForm, data: { ...currentForm.data, [key]: value } })); }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const wasEditing = editing;
    const entry: Entry = { ...form, id: wasEditing || crypto.randomUUID(), sortOrder: Number(form.sortOrder), data: { ...form.data } };
    try {
      if (getApiBase()) {
        const payload = { name: form.name, slug: form.slug || undefined, title: form.title, body: form.body, bodyHtml: form.bodyHtml, bodyCss: form.bodyCss, image: form.image, data: form.data, status: form.status, sortOrder: Number(form.sortOrder), isActive: form.status === "published" };
        const response = await apiRequest<{ data?: unknown }>(wasEditing ? `/admin/${resource}/${wasEditing}` : `/admin/${resource}`, { method: wasEditing ? "PATCH" : "POST", body: JSON.stringify(payload) });
        const value = (response.data || entry) as Partial<Entry> & { _id?: string };
        const saved: Entry = { ...blank, ...value, data: normalizeData(value.data), id: value.id || value._id || entry.id, sortOrder: Number(value.sortOrder || 0) } as Entry;
        setEntries((all) => ({ ...all, [resource]: wasEditing ? (all[resource] || []).map((item) => item.id === wasEditing ? saved : item) : [saved, ...(all[resource] || [])] }));
      } else {
        persist({ ...entries, [resource]: wasEditing ? current.map((item) => item.id === wasEditing ? entry : item) : [entry, ...current] });
      }
      setForm(blank); setEditing(null); setNotice(wasEditing ? "Content updated" : "Content created");
    } catch (cause) { setNotice(cause instanceof Error ? cause.message : "Unable to save content"); }
    window.setTimeout(() => setNotice(""), 2200);
  }

  function edit(item: Entry) { setForm({ name: item.name, slug: item.slug || "", title: item.title, body: item.body, bodyHtml: item.bodyHtml || "", bodyCss: item.bodyCss || "", image: item.image, data: normalizeData(item.data), status: item.status, sortOrder: item.sortOrder }); setEditing(item.id); }
  async function remove(id: string) {
    if (!window.confirm("Delete this content?")) return;
    try {
      if (getApiBase()) await apiRequest(`/admin/${resource}/${id}`, { method: "DELETE" });
      const next = { ...entries, [resource]: (entries[resource] || []).filter((item) => item.id !== id) };
      setEntries(next); if (!getApiBase()) window.localStorage.setItem("drone-admin-content", JSON.stringify(next));
      setNotice("Content deleted");
    } catch (cause) { setNotice(cause instanceof Error ? cause.message : "Unable to delete content"); }
    window.setTimeout(() => setNotice(""), 1800);
  }

  async function readImage(file?: File) {
    if (!file) return;
    try {
      if (getApiBase()) {
        const formData = new FormData(); formData.append("image", file);
        const folder = ["mega-menu", "handheld-menu", "enterprise-menu", "all-products-menu", "categories", "featured-categories"].includes(resource) ? "categories" : resource === "articles" ? "articles" : resource === "banners" ? "banners" : resource === "maintenance" ? "maintenance" : "general";
        const response = await apiFormRequest<{ data?: { url?: string } }>(`/admin/media?folder=${folder}`, formData);
        setForm((value) => ({ ...value, image: response.data?.url || "" }));
        return;
      }
      const reader = new FileReader(); reader.onload = () => setForm((value) => ({ ...value, image: String(reader.result) })); reader.readAsDataURL(file);
    } catch (cause) { setNotice(cause instanceof Error ? cause.message : "Image upload failed"); }
  }

  function startNew() { setEditing(null); setForm(blank); }
  function choose(next: Resource) { setResource(next); startNew(); }
  if (resource === "accessory-mapping") return <><div className="resource-tabs admin-resource-switcher">{resources.map(([value, label]) => <button className={resource === value ? "active" : ""} onClick={() => choose(value)} key={value}>{label}</button>)}</div><AdminAccessoryMappings /></>;

  const megaResource = ["mega-menu", "handheld-menu", "enterprise-menu", "all-products-menu"].includes(resource);
  const firstLabel = resource === "ai-faqs" ? "Question" : megaResource ? "Category / group" : resource === "announcements" ? "Announcement key" : resource === "maintenance" ? "Section key (hero / intro / basic / standard / premium)" : "Name / key";
  const secondLabel = resource === "ai-faqs" ? "Short title" : megaResource ? "Item title" : "Display title";
  const bodyLabel = resource === "ai-faqs" ? "Answer" : megaResource ? "Target URL / link" : "Body / description";

  return <section className="admin-crud">
    <div className="admin-crud-heading"><div><p className="eyebrow">CONTENT MANAGEMENT</p><h1>Storefront content</h1><span>Control sections, mega-menu cards, banners, announcements and long-form content.</span></div></div>
    {notice && <div className="crud-notice">{notice}</div>}
    <div className="resource-tabs">{resources.map(([value, label]) => <button className={resource === value ? "active" : ""} onClick={() => choose(value)} key={value}>{label}</button>)}</div>
    <div className="crud-grid">
      <form className="crud-form" onSubmit={submit}>
        <div className="admin-panel-heading"><h2>{editing ? "Edit entry" : `Add ${resources.find(([value]) => value === resource)?.[1]?.toLowerCase() || "content"}`}</h2><div className="admin-panel-actions">{resource === "banners" && <button type="button" className="button button-small" onClick={startNew}><Plus size={14}/>New banner</button>}{editing && <button type="button" className="icon-button" onClick={startNew}><X size={16}/></button>}</div></div>
        <label>{firstLabel}<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder={megaResource ? "DJI Enterprise Drones" : resource === "banners" ? "EXPLORE. CAPTURE. INSPIRE." : "New Arrival"}/></label>
        {["articles", "categories", "brands", "pages", "featured-categories"].includes(resource) && <label>Slug / link<input value={form.slug || ""} onChange={(event) => setForm({ ...form, slug: event.target.value })} placeholder="camera-drone"/></label>}
        <label>{secondLabel}<input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder={resource === "banners" ? "Premium drones. Limitless possibilities." : megaResource ? "DJI Matrice 400" : "Display title"}/></label>
        <label>{bodyLabel}<textarea value={form.body} onChange={(event) => setForm({ ...form, body: event.target.value })} rows={resource === "banners" ? 5 : 4} placeholder={megaResource ? "/products/dji-matrice-400" : "Description"}/></label>

        {resource === "banners" && <div className="admin-special-fields">
          <h3>Banner slider controls</h3>
          <div className="admin-special-grid"><label>Primary CTA label<input value={form.data.primaryLabel || ""} onChange={(e) => updateData("primaryLabel", e.target.value)} placeholder="Shop now"/></label><label>Primary CTA URL<input value={form.data.primaryUrl || ""} onChange={(e) => updateData("primaryUrl", e.target.value)} placeholder="/products"/></label><label>Secondary CTA label<input value={form.data.secondaryLabel || ""} onChange={(e) => updateData("secondaryLabel", e.target.value)} placeholder="Explore drones"/></label><label>Secondary CTA URL<input value={form.data.secondaryUrl || ""} onChange={(e) => updateData("secondaryUrl", e.target.value)} placeholder="/categories/camera-drone"/></label><label>Trust note 1<input value={form.data.trustOne || ""} onChange={(e) => updateData("trustOne", e.target.value)} placeholder="BN Authorized Dealer"/></label><label>Trust note 2<input value={form.data.trustTwo || ""} onChange={(e) => updateData("trustTwo", e.target.value)} placeholder="Nationwide delivery & support"/></label><label>Warranty badge<input value={form.data.warrantyText || ""} onChange={(e) => updateData("warrantyText", e.target.value)} placeholder="1 year official warranty"/></label></div>
        </div>}

        {["mega-menu", "handheld-menu", "enterprise-menu"].includes(resource) && <div className="admin-special-fields">
          <h3>{resource === "mega-menu" ? "Drones" : resource === "handheld-menu" ? "Handhelds" : "Enterprise & Agriculture"} mega-menu layout</h3>
          <div className="admin-special-grid"><label>Display type<select value={form.data.menuKind || "category"} onChange={(e) => updateData("menuKind", e.target.value)}><option value="category">Top category / child link</option><option value="promo">Bottom promotional card</option></select></label><label>Promo description<input value={form.data.description || ""} onChange={(e) => updateData("description", e.target.value)} placeholder="Short description shown on the promo card"/></label></div>
          <p className="admin-field-help">For top categories, use the same Category / group name for every child product link. The first image becomes that group&apos;s visual. Choose Promo for a large lower-row promotional card. Products can also be assigned to these menu groups directly from Products Management.</p>
          <Link className="admin-inline-link" href="/admin/products?new=1">+ Upload / assign products to this menu</Link>
        </div>}

        {!["ai-faqs", "mega-menu", "handheld-menu", "enterprise-menu", "all-products-menu", "announcements"].includes(resource) && <RichDescriptionEditor value={{ html: form.bodyHtml || "", css: form.bodyCss || "" }} onChange={({ html, css }) => setForm((currentForm) => ({ ...currentForm, bodyHtml: html, bodyCss: css }))}/>}        
        <label>Image<input type="file" accept="image/*" onChange={(event) => void readImage(event.target.files?.[0])}/></label>
        {form.image && <img className="crud-preview" src={form.image} alt="Preview"/>}
        <div className="crud-two"><label>Status<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as "published" | "draft" })}><option value="published">Published</option><option value="draft">Draft</option></select></label><label>Order<input type="number" value={form.sortOrder} onChange={(event) => setForm({ ...form, sortOrder: Number(event.target.value) })}/></label></div>
        <button className="button button-red" type="submit"><Save size={16}/>{editing ? "Update entry" : "Create entry"}</button>
      </form>

      <div className="crud-list"><div className="admin-panel-heading"><div><h2>{resources.find(([value]) => value === resource)?.[1]}</h2><span>{current.length} entries</span></div>{resource === "banners" && <button type="button" className="button button-small" onClick={startNew}><Plus size={14}/>New banner</button>}</div>{current.length ? current.map((item) => <article className="crud-row" key={item.id}>{item.image ? <img src={item.image} alt=""/> : <span className="crud-empty-image"/>}<div><strong>{item.title || item.name}</strong><small>{item.name}{item.data?.menuKind === "promo" ? " · Promo" : ""} · {item.body || item.bodyHtml?.replace(/<[^>]+>/g, " ").slice(0, 90)}</small></div><em className={item.status}>{item.status}</em><span>Order {item.sortOrder}</span><button className="icon-button" onClick={() => edit(item)} aria-label="Edit"><Pencil size={15}/></button><button className="icon-button" onClick={() => void remove(item.id)} aria-label="Delete"><Trash2 size={15}/></button></article>) : <div className="empty-panel">No entries yet. Add the first one from the form.</div>}</div>
    </div>
  </section>;
}
