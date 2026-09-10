import type { Metadata } from "next";
import ProductListing from "@/components/product-listing";
import { noIndexMetadata } from "@/lib/seo";
export const metadata: Metadata = noIndexMetadata;
export default async function SearchPage({ searchParams }: { searchParams: Promise<Record<string,string|string[]|undefined>> }) { const params=await searchParams; const q=Array.isArray(params.q)?params.q[0]:params.q; return <ProductListing basePath="/search" searchParams={params} title={q?`Search: ${q}`:"Search products"} description="Search by product name, SKU, category or brand." />; }
