import type { Metadata } from "next";

export const SITE_NAME = "Drone Bangladesh";
export const SITE_DESCRIPTION = "Shop genuine drones, cameras, accessories and enterprise solutions with courier delivery and expert support across Bangladesh.";
export const FACEBOOK_URL = "https://web.facebook.com/dronebangladesh?";
export const YOUTUBE_URL = "https://www.youtube.com/@dronebangladesh9726";
export const DEFAULT_OG_IMAGE = "/images/hero-drone.jpg";

export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}

export function absoluteUrl(path = "/") {
  if (/^https?:\/\//i.test(path)) return path;
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${siteUrl()}${clean}`;
}

export function cleanText(value: unknown, fallback = "") {
  return String(value || fallback)
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function slugTitle(value: string) {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.toLowerCase() === "dji" ? "DJI" : part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function buildMetadata({
  title,
  description = SITE_DESCRIPTION,
  path = "/",
  image = DEFAULT_OG_IMAGE,
  type = "website",
  noIndex = false,
  keywords = [],
}: {
  title: string;
  description?: string;
  path?: string;
  image?: string;
  type?: "website" | "article";
  noIndex?: boolean;
  keywords?: string[];
}): Metadata {
  const canonical = absoluteUrl(path);
  const imageUrl = absoluteUrl(image || DEFAULT_OG_IMAGE);
  const cleanDescription = cleanText(description, SITE_DESCRIPTION).slice(0, 320);
  return {
    title,
    description: cleanDescription,
    keywords: keywords.length ? keywords : undefined,
    alternates: { canonical },
    robots: noIndex ? { index: false, follow: false, nocache: true } : { index: true, follow: true },
    openGraph: {
      title,
      description: cleanDescription,
      url: canonical,
      siteName: SITE_NAME,
      type,
      locale: "en_BD",
      images: [{ url: imageUrl, alt: `${title} - ${SITE_NAME}` }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: cleanDescription,
      images: [imageUrl],
    },
  };
}

export const noIndexMetadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}
