import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";

const staticPages = [
  ["/", "daily", 1],
  ["/products", "daily", 0.95],
  ["/articles", "weekly", 0.85],
  ["/maintenance", "monthly", 0.75],
  ["/contact", "monthly", 0.7],
  ["/about-us", "monthly", 0.65],
  ["/shipping", "monthly", 0.55],
  ["/returns", "monthly", 0.55],
  ["/warranty", "monthly", 0.55],
  ["/faqs", "monthly", 0.65],
  ["/privacy", "yearly", 0.35],
  ["/terms", "yearly", 0.35],
  ["/refund", "monthly", 0.5],
  ["/rental", "monthly", 0.55],
  ["/repairs", "monthly", 0.55],
  ["/b2b-b2c", "monthly", 0.55],
] as const;

type ProductRow = { slug?: string; category?: string; brand?: string; updatedAt?: string; createdAt?: string };
type ContentRow = { slug?: string; updatedAt?: string; createdAt?: string };

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url, { next: { revalidate: 3600 } });
    if (!response.ok) return null;
    return await response.json() as T;
  } catch {
    return null;
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const api = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
  const now = new Date();
  const entries: MetadataRoute.Sitemap = staticPages.map(([path, changeFrequency, priority]) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));

  if (!api) return entries;

  const first = await fetchJson<{ data?: ProductRow[]; meta?: { pages?: number } }>(`${api}/products?limit=100&page=1`);
  const products: ProductRow[] = [...(first?.data || [])];
  const pages = Math.min(25, Math.max(1, Number(first?.meta?.pages || 1)));
  for (let page = 2; page <= pages; page += 1) {
    const result = await fetchJson<{ data?: ProductRow[] }>(`${api}/products?limit=100&page=${page}`);
    products.push(...(result?.data || []));
  }

  const categories = new Set<string>();
  const brands = new Set<string>();
  for (const product of products) {
    if (product.slug) entries.push({ url: `${base}/products/${product.slug}`, lastModified: product.updatedAt || product.createdAt ? new Date(product.updatedAt || product.createdAt || now) : now, changeFrequency: "weekly", priority: 0.85 });
    if (product.category) categories.add(slugify(product.category));
    if (product.brand) brands.add(slugify(product.brand));
  }

  const [articlePayload, categoryPayload, brandPayload] = await Promise.all([
    fetchJson<{ data?: ContentRow[] }>(`${api}/content/articles`),
    fetchJson<{ data?: ContentRow[] }>(`${api}/content/categories`),
    fetchJson<{ data?: ContentRow[] }>(`${api}/content/brands`),
  ]);

  for (const entry of categoryPayload?.data || []) if (entry.slug) categories.add(entry.slug);
  for (const entry of brandPayload?.data || []) if (entry.slug) brands.add(entry.slug);
  for (const slug of categories) entries.push({ url: `${base}/categories/${slug}`, lastModified: now, changeFrequency: "weekly", priority: 0.75 });
  for (const slug of brands) entries.push({ url: `${base}/brands/${slug}`, lastModified: now, changeFrequency: "weekly", priority: 0.72 });
  for (const article of articlePayload?.data || []) if (article.slug) entries.push({ url: `${base}/articles/${article.slug}`, lastModified: article.updatedAt || article.createdAt ? new Date(article.updatedAt || article.createdAt || now) : now, changeFrequency: "monthly", priority: 0.7 });

  const deduped = new Map(entries.map((entry) => [entry.url, entry]));
  return [...deduped.values()];
}
