"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";
import { ProductCard, type ProductData } from "@/components/storefront";

export default function ProductRail({ products, compact = false }: { products: ProductData[]; compact?: boolean }) {
  const viewportRef = useRef<HTMLDivElement>(null);

  function scrollRail(direction: number) {
    viewportRef.current?.scrollBy({ left: direction * Math.max(260, viewportRef.current.clientWidth * 0.82), behavior: "smooth" });
  }

  return <div className={`product-rail ${compact ? "is-compact" : ""}`}>
    <button className="product-rail-arrow product-rail-arrow-left" type="button" onClick={() => scrollRail(-1)} aria-label="Previous products"><ChevronLeft size={16} /></button>
    <div className="product-rail-viewport" ref={viewportRef}>
      <div className="product-rail-track">{products.map((product) => <ProductCard product={product} compact={compact} key={product.slug} />)}</div>
    </div>
    <button className="product-rail-arrow product-rail-arrow-right" type="button" onClick={() => scrollRail(1)} aria-label="Next products"><ChevronRight size={16} /></button>
  </div>;
}
