"use client";

import { ImagePlus, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { fallbackProducts } from "@/lib/catalog";
import { accessoryMappingsKey, starterAccessoryMappings, type AccessoryKind, type AccessoryMapping } from "@/lib/accessories";
import { apiFormRequest, apiRequest, getApiBase } from "@/lib/api";

const blank: Omit<AccessoryMapping, "id"> = {
  productSlug: fallbackProducts[0].slug,
  kind: "combo",
  title: "",
  price: 0,
  image: "",
  linkedSlug: "",
  status: "published",
  sortOrder: 0,
};

export default function AdminAccessoryMappings({ kindOnly }: { kindOnly?: AccessoryKind } = {}) {
  const [items, setItems] = useState<AccessoryMapping[]>(starterAccessoryMappings);
  const [catalogProducts, setCatalogProducts] = useState(fallbackProducts);
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const loadRemote = async () => {
      if (!getApiBase()) return false;
      try {
        const [mappingResponse, productResponse] = await Promise.all([apiRequest<{ data?: unknown }>(`/admin/${kindOnly ? "combo-mappings" : "accessory-mappings"}`), apiRequest<{ data?: unknown }>("/admin/products?limit=100")]);
        if (Array.isArray(mappingResponse.data)) setItems(mappingResponse.data.map((value, index) => { const item = value as AccessoryMapping & { _id?: string }; return { ...item, id: item.id || item._id || `remote-${index}`, kind: item.kind === "accessory" ? "accessory" : "combo", price: Number(item.price || 0), sortOrder: Number(item.sortOrder || 0), status: item.status === "draft" ? "draft" : "published" }; }));
        if (Array.isArray(productResponse.data)) setCatalogProducts(productResponse.data.map((value) => { const product = value as { slug?: string; name?: string; images?: string[]; price?: number; oldPrice?: number }; return { slug: product.slug || "", name: product.name || product.slug || "Product", image: product.images?.[0] || "/images/products/mini-5.jpg", price: Number(product.price || 0), oldPrice: Number(product.oldPrice || product.price || 0) }; }).filter((item) => item.slug));
        return true;
      } catch { return false; }
    };
    queueMicrotask(() => {
      try {
        const stored = window.localStorage.getItem(accessoryMappingsKey);
        if (stored) setItems(JSON.parse(stored));
        const managedProducts = JSON.parse(window.localStorage.getItem("drone-admin-products") || "[]") as Array<{ slug?: string; name?: string; image?: string; price?: number; oldPrice?: number }>;
        if (managedProducts.length) {
          const merged = [...fallbackProducts];
          managedProducts.forEach((product) => {
            if (!product.slug || !product.name || merged.some((item) => item.slug === product.slug)) return;
            merged.push({ slug: product.slug, name: product.name, image: product.image || "/images/products/mini-5.jpg", price: Number(product.price || 0), oldPrice: Number(product.oldPrice || product.price || 0) });
          });
          setCatalogProducts(merged);
        }
        const productParam = new URLSearchParams(window.location.search).get("product");
        if (productParam) {
          setFilter(productParam);
          setForm((current) => ({ ...current, productSlug: productParam, kind: kindOnly || current.kind }));
        }
      } catch { /* keep starter mappings */ }
    });
    void loadRemote();
  }, [kindOnly]);

  const visible = useMemo(() => [...items]
    .filter((item) => (!kindOnly || item.kind === kindOnly) && (filter === "all" || item.productSlug === filter))
    .sort((a, b) => a.sortOrder - b.sortOrder), [items, filter, kindOnly]);

  function persist(next: AccessoryMapping[]) {
    setItems(next);
    window.localStorage.setItem(accessoryMappingsKey, JSON.stringify(next));
    window.dispatchEvent(new Event("drone-accessory-mappings-updated"));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const entry: AccessoryMapping = { ...form, kind: kindOnly || form.kind, id: editing || crypto.randomUUID(), price: Number(form.price), sortOrder: Number(form.sortOrder) };
    const wasEditing = editing;
    try {
      if (getApiBase()) {
        const endpoint = entry.kind === "combo" ? "combo-mappings" : "accessory-mappings";
        const response = await apiRequest<{ data?: unknown }>(wasEditing ? `/admin/${endpoint}/${wasEditing}` : `/admin/${endpoint}`, { method: wasEditing ? "PATCH" : "POST", body: JSON.stringify({ productSlug: entry.productSlug, kind: entry.kind, title: entry.title, price: entry.price, image: entry.image, linkedSlug: entry.linkedSlug, status: entry.status, sortOrder: entry.sortOrder }) });
        const value = (response.data || entry) as AccessoryMapping & { _id?: string }; const saved = { ...entry, ...value, id: value.id || value._id || entry.id };
        setItems((current) => wasEditing ? current.map((item) => item.id === wasEditing ? saved : item) : [...current, saved]);
      } else persist(wasEditing ? items.map((item) => item.id === wasEditing ? entry : item) : [...items, entry]);
      setForm({ ...blank, productSlug: form.productSlug, kind: kindOnly || form.kind }); setEditing(null); setNotice(wasEditing ? "Accessory mapping updated" : "Accessory mapping created");
    } catch (cause) { setNotice(cause instanceof Error ? cause.message : "Unable to save mapping"); }
    window.setTimeout(() => setNotice(""), 1800);
  }

  function edit(item: AccessoryMapping) {
    setForm({ productSlug: item.productSlug, kind: item.kind, title: item.title, price: item.price, image: item.image, linkedSlug: item.linkedSlug || "", status: item.status, sortOrder: item.sortOrder });
    setEditing(item.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this accessory mapping?")) return;
    try { if (getApiBase()) await apiRequest(`/admin/${items.find((item) => item.id === id)?.kind === "combo" ? "combo-mappings" : "accessory-mappings"}/${id}`, { method: "DELETE" }); setItems((current) => current.filter((item) => item.id !== id)); if (!getApiBase()) window.localStorage.setItem(accessoryMappingsKey, JSON.stringify(items.filter((item) => item.id !== id))); setNotice("Accessory mapping deleted"); } catch (cause) { setNotice(cause instanceof Error ? cause.message : "Unable to delete mapping"); }
    window.setTimeout(() => setNotice(""), 1800);
  }

  async function readImage(file?: File) {
    if (!file) return;
    try { if (getApiBase()) { const formData = new FormData(); formData.append("image", file); const response = await apiFormRequest<{ data?: { url?: string } }>("/admin/media?folder=accessories", formData); setForm((current) => ({ ...current, image: response.data?.url || "" })); return; } const reader = new FileReader(); reader.onload = () => setForm((current) => ({ ...current, image: String(reader.result) })); reader.readAsDataURL(file); } catch (cause) { setNotice(cause instanceof Error ? cause.message : "Image upload failed"); }
  }

  function productName(slug: string) {
    return catalogProducts.find((product) => product.slug === slug)?.name || slug;
  }

  return <section className="admin-crud accessory-admin">
    <div className="admin-crud-heading"><div><p className="eyebrow">PRODUCT DETAIL MANAGEMENT</p><h1>{kindOnly ? "Buy Combo manager" : "Accessory mappings"}</h1><span>{kindOnly ? "Configure the combo accessories shown for each particular product." : "Configure combo inclusions and every accessory shown on each product page."}</span></div><div className="crud-summary"><strong>{visible.length}</strong><small>{kindOnly ? "Combo mappings" : "Total mappings"}</small></div></div>
    {notice && <div className="crud-notice">{notice}</div>}
    <div className="crud-grid">
      <form className="crud-form" onSubmit={submit}>
        <div className="admin-panel-heading"><h2>{editing ? "Edit mapping" : "Add mapping"}</h2>{editing && <button type="button" className="icon-button" onClick={() => { setEditing(null); setForm(blank); }} aria-label="Cancel edit"><X size={16} /></button>}</div>
        <label>Product<select value={form.productSlug} onChange={(event) => setForm({ ...form, productSlug: event.target.value })}>{catalogProducts.map((product) => <option value={product.slug} key={product.slug}>{product.name}</option>)}</select></label>
        {!kindOnly && <label>Display type<select value={form.kind} onChange={(event) => setForm({ ...form, kind: event.target.value as AccessoryKind })}><option value="combo">Combo accessory (Buy Combo)</option><option value="accessory">Product accessory (Accessories tab)</option></select></label>}
        <label>Accessory title<input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Intelligent Flight Battery Plus" /></label>
        <div className="form-grid"><label>Price (৳)<input type="number" min="0" required value={form.price} onChange={(event) => setForm({ ...form, price: Number(event.target.value) })} /></label><label>Order<input type="number" value={form.sortOrder} onChange={(event) => setForm({ ...form, sortOrder: Number(event.target.value) })} /></label></div>
        <label>Linked product slug (optional)<input value={form.linkedSlug || ""} onChange={(event) => setForm({ ...form, linkedSlug: event.target.value })} placeholder="dji-mini-5-pro-fly-more-combo-plus-rc2" /></label>
        <label>Accessory image<input type="file" accept="image/*" onChange={(event) => readImage(event.target.files?.[0])} /><small className="file-hint"><ImagePlus size={14} />Choose an accessory image</small></label>
        {form.image && <img className="form-preview" src={form.image} alt="Accessory preview" />}
        <label>Status<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as AccessoryMapping["status"] })}><option value="published">Published</option><option value="draft">Draft</option></select></label>
        <button className="button button-red" type="submit">{editing ? <><Save size={15} />Save changes</> : <><Plus size={15} />Create mapping</>}</button>
      </form>
      <section className="crud-list"><div className="crud-list-toolbar"><div><h2>{kindOnly ? "Product combo inclusions" : "Configured accessories"}</h2><span>{visible.length} mappings shown</span></div><select className="mapping-filter" value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">All products</option>{catalogProducts.map((product) => <option value={product.slug} key={product.slug}>{product.name}</option>)}</select></div><div className="crud-table">{visible.map((item) => <article className="crud-row content-row mapping-row" key={item.id}><div className="content-thumb">{item.image ? <img src={item.image} alt="" /> : "—"}</div><div className="crud-product-name"><strong>{item.title}</strong><small>{productName(item.productSlug)} · {item.kind === "combo" ? "Buy Combo" : "Accessories tab"}</small></div><span className="crud-price">৳{item.price.toLocaleString("en-BD")}</span><span className={`crud-status ${item.status}`}>{item.status}</span><span className="crud-stock">Order {item.sortOrder}</span><div className="crud-actions"><button className="icon-button" onClick={() => edit(item)} aria-label={`Edit ${item.title}`}><Pencil size={14} /></button><button className="icon-button danger" onClick={() => remove(item.id)} aria-label={`Delete ${item.title}`}><Trash2 size={14} /></button></div></article>)}{visible.length === 0 && <div className="crud-empty">No mappings yet. Add one from the form.</div>}</div></section>
    </div>
  </section>;
}
