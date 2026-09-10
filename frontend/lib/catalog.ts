export type CatalogProduct = {
  _id?: string;
  slug: string;
  name: string;
  image: string;
  images?: string[];
  hoverImage?: string;
  price: number;
  oldPrice: number;
  badge?: string;
  meta?: string;
  brand?: string;
  category?: string;
  sku?: string;
  stock?: number;
  preorderEnabled?: boolean;
  preorderDepositPercent?: number;
  preorderNote?: string;
  discount?: number;
  shortDescription?: string;
  description?: string;
  descriptionHtml?: string;
  descriptionCss?: string;
  keyFeatures?: string[];
  specifications?: Record<string, string> | Map<string, string>;
  youtubeUrl?: string;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  isPopular?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type ProductQuery = {
  q?: string; category?: string; brand?: string; page?: number; limit?: number; sort?: string;
  minPrice?: number; maxPrice?: number; stock?: "in" | "out"; isFeatured?: boolean; isNewArrival?: boolean; isPopular?: boolean;
};

export type ProductQueryResult = { products: CatalogProduct[]; meta: { page: number; limit: number; total: number; pages: number } };

export const fallbackProducts: CatalogProduct[] = [
  { slug: "dji-mini-5-pro-fly-more-combo-plus-rc2", name: "DJI Mini 5 Pro Fly More Combo Plus with RC2", image: "/images/products/mini-5.jpg", images: ["/images/products/mini-5.jpg"], price: 117000, oldPrice: 140000, badge: "HOT", meta: "1-inch CMOS · Up to 52 minutes", brand: "DJI", category: "Personal Drone", stock: 10, keyFeatures: ["1-inch CMOS camera", "Up to 52 minutes flight", "Omnidirectional obstacle sensing", "Vertical shooting"], specifications: { Camera: "1-inch CMOS", "Flight Time": "Up to 52 minutes", Controller: "DJI RC 2" } },
  { slug: "dji-air-3s-fly-more-combo", name: "DJI Air 3S Fly More Combo with RC2", image: "/images/products/air-3.jpg", images: ["/images/products/air-3.jpg"], price: 154000, oldPrice: 185000, badge: "BEST SELLER", meta: "Dual-camera · 46 minutes flight", brand: "DJI", category: "Camera Drone", stock: 8 },
  { slug: "dji-mavic-3-classic-combo", name: "DJI Mavic 3 Classic Fly More Combo", image: "/images/products/mavic-3.jpg", images: ["/images/products/mavic-3.jpg"], price: 195000, oldPrice: 215000, badge: "POPULAR", meta: "4/3 CMOS Hasselblad camera", brand: "DJI", category: "Camera Drone", stock: 5 },
  { slug: "dji-avata-2-fly-more-combo", name: "DJI Avata 2 Fly More Combo", image: "/images/products/avata-2.jpg", images: ["/images/products/avata-2.jpg"], price: 74900, oldPrice: 89000, badge: "POPULAR", meta: "4K/60fps · immersive FPV", brand: "DJI", category: "FPV Drones", stock: 6 },
  { slug: "dji-mini-3-fly-more-combo", name: "DJI Mini 3 Fly More Combo", image: "/images/products/mini-3.jpg", images: ["/images/products/mini-3.jpg"], price: 36500, oldPrice: 45000, badge: "BEST SELLER", meta: "4K camera · GPS return home", brand: "DJI", category: "Beginner Drone", stock: 12 },
];

function apiBase() { return (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, ""); }
function normalize(item: CatalogProduct & { images?: string[]; shortDescription?: string }) : CatalogProduct {
  return { ...item, image: item.image || item.images?.[0] || "/images/products/mini-5.jpg", images: item.images?.length ? item.images : [item.image || "/images/products/mini-5.jpg"], oldPrice: Number(item.oldPrice || item.price || 0), price: Number(item.price || 0), description: item.description || item.shortDescription || "" };
}

export async function queryProducts(query: ProductQuery = {}): Promise<ProductQueryResult> {
  const base = apiBase();
  if (!base) {
    let products = fallbackProducts.slice();
    if (query.q) { const q = query.q.toLowerCase(); products = products.filter(p => [p.name,p.brand,p.category,p.meta].some(v => String(v||"").toLowerCase().includes(q))); }
    if (query.category) { const c=query.category.replace(/-/g," ").toLowerCase(); products=products.filter(p=>String(p.category||"").toLowerCase()===c); }
    if (query.brand) { const b=query.brand.replace(/-/g," ").toLowerCase(); products=products.filter(p=>String(p.brand||"").toLowerCase()===b); }
    if (query.stock === "in") products=products.filter(p=>(p.stock||0)>0);
    if (query.stock === "out") products=products.filter(p=>(p.stock||0)<=0);
    if (Number.isFinite(query.minPrice)) products=products.filter(p=>p.price>=Number(query.minPrice));
    if (Number.isFinite(query.maxPrice)) products=products.filter(p=>p.price<=Number(query.maxPrice));
    if (query.sort === "price-asc") products.sort((a,b)=>a.price-b.price);
    if (query.sort === "price-desc") products.sort((a,b)=>b.price-a.price);
    const page=Math.max(1,query.page||1), limit=Math.max(1,query.limit||24), total=products.length;
    return { products: products.slice((page-1)*limit,page*limit), meta: { page, limit, total, pages: total ? Math.ceil(total/limit) : 0 } };
  }
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key,value])=>{ if (value !== undefined && value !== "" && value !== false) params.set(key, String(value)); });
  try {
    const response = await fetch(`${base}/products?${params.toString()}`, { cache: "no-store" });
    if (!response.ok) return { products: [], meta: { page: query.page || 1, limit: query.limit || 24, total: 0, pages: 0 } };
    const payload = await response.json() as { data?: CatalogProduct[]; meta?: ProductQueryResult["meta"] };
    const products=(payload.data||[]).map(normalize);
    return { products, meta: payload.meta || { page: 1, limit: products.length || 24, total: products.length, pages: products.length ? 1 : 0 } };
  } catch { return { products: [], meta: { page: query.page || 1, limit: query.limit || 24, total: 0, pages: 0 } }; }
}

export async function getProducts(query: ProductQuery = {}) { return (await queryProducts(query)).products; }

export type FeaturedCategory = { title: string; image: string; tone: string; slug: string };
const fallbackFeaturedCategories: FeaturedCategory[] = [
  { title: "Camera Drone", image: "/images/categories/camera-drone.png", tone: "blue", slug: "camera-drone" },
  { title: "Personal Drones", image: "/images/categories/camera-drone.png", tone: "violet", slug: "personal-drones" },
  { title: "Others", image: "/images/categories/dji-osmo.png", tone: "mint", slug: "others" },
  { title: "DJI Remote Controller", image: "/images/categories/dji-remote-controller.png", tone: "violet", slug: "remote-controller" },
  { title: "DJI Mic", image: "/images/categories/dji-mic.png", tone: "gold", slug: "dji-mic" },
  { title: "DJI Osmo Series", image: "/images/categories/dji-osmo.png", tone: "mint", slug: "osmo-series" },
];
function slugify(value: string) { return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""); }
export async function getFeaturedCategories() {
  const base=apiBase(); if(!base) return fallbackFeaturedCategories;
  try { const response=await fetch(`${base}/content/featured-categories`,{cache:"no-store"}); if(!response.ok) return fallbackFeaturedCategories;
    const payload=await response.json() as {data?:Array<{name?:string;title?:string;image?:string;slug?:string;isActive?:boolean}>};
    const items=(payload.data||[])
      .filter(x=>x&&(x.title||x.name)&&x.isActive!==false)
      .map((x,i)=>({
        title:x.title||x.name||"Featured category",
        image:x.image||fallbackFeaturedCategories[i%fallbackFeaturedCategories.length].image,
        tone:fallbackFeaturedCategories[i%fallbackFeaturedCategories.length].tone,
        slug:x.slug||slugify(x.name||x.title||`category-${i+1}`)
      }));
    return items.length ? items : fallbackFeaturedCategories;
  } catch { return fallbackFeaturedCategories; }
}

export async function getProduct(slug: string): Promise<CatalogProduct | null> {
  const base=apiBase();
  if(!base) return fallbackProducts.find(item=>item.slug===slug) || null;
  try { const response=await fetch(`${base}/products/${encodeURIComponent(slug)}`,{cache:"no-store"}); if(!response.ok) return null; const payload=await response.json() as {data?:CatalogProduct}; return payload.data?normalize(payload.data):null; } catch { return null; }
}
