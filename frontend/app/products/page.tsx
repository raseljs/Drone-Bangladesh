import type { Metadata } from "next";
import ProductListing from "@/components/product-listing";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "All Drones, Cameras & Accessories",
  description: "Browse drones, handheld cameras, accessories and enterprise equipment available from Drone Bangladesh with current prices and stock.",
  path: "/products",
  keywords: ["drones Bangladesh", "DJI price Bangladesh", "camera drone", "drone accessories", "Drone Bangladesh products"],
});

export default async function ProductsPage({ searchParams }: { searchParams: Promise<Record<string,string|string[]|undefined>> }) { return <ProductListing searchParams={await searchParams} title="All Products" description="Browse the latest drones, handhelds, accessories and enterprise equipment." />; }
