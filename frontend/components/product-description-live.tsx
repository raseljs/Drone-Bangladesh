"use client";

import { useEffect, useState } from "react";
import { descriptionFallbackHtml, sanitizeDescriptionHtml } from "@/lib/rich-description";

type Props = { slug: string; initialHtml: string; initialCss?: string; fallback: string };

export default function ProductDescriptionLive({ slug, initialHtml, initialCss = "", fallback }: Props) {
  const [content, setContent] = useState({ html: initialHtml, css: initialCss });
  useEffect(() => {
    const read = () => {
      try {
        const products = JSON.parse(window.localStorage.getItem("drone-admin-products") || "[]") as Array<{ slug?: string; description?: string; descriptionHtml?: string; descriptionCss?: string }>;
        const product = products.find((item) => item.slug === slug);
        if (product) setContent({ html: product.descriptionHtml || descriptionFallbackHtml(product.description || fallback), css: product.descriptionCss || "" });
      } catch { /* server content remains visible */ }
    };
    read();
    window.addEventListener("drone-products-updated", read);
    return () => window.removeEventListener("drone-products-updated", read);
  }, [fallback, slug]);
  const html = sanitizeDescriptionHtml(content.html || descriptionFallbackHtml(fallback));
  return <><style>{content.css}</style><div className="product-description-rendered" dangerouslySetInnerHTML={{ __html: html }} /></>;
}
