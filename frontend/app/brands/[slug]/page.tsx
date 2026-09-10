import type { Metadata } from "next";
import ProductListing from "@/components/product-listing";
import SeoJsonLd from "@/components/seo-jsonld";
import { breadcrumbJsonLd, buildMetadata, slugTitle } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const title = slugTitle(slug);
  return buildMetadata({
    title: `${title} Products in Bangladesh`,
    description: `Shop ${title} drones, cameras and accessories from Drone Bangladesh. Check prices, stock and product details with expert support.`,
    path: `/brands/${slug}`,
    keywords: [title, `${title} Bangladesh`, `${title} price in Bangladesh`, "Drone Bangladesh"],
  });
}

export default async function BrandPage({ params, searchParams }: { params: Promise<{slug:string}>; searchParams: Promise<Record<string,string|string[]|undefined>> }) {
  const {slug}=await params;
  const title=slugTitle(slug);
  const breadcrumbs=breadcrumbJsonLd([{name:"Home",path:"/"},{name:"Brands",path:"/products"},{name:title,path:`/brands/${slug}`}]);
  return <><SeoJsonLd id="brand-breadcrumb-schema" data={breadcrumbs}/><ProductListing fixedBrand={slug} basePath={`/brands/${slug}`} searchParams={await searchParams} title={`${title} Products`} description={`Browse ${title} products available from Drone Bangladesh.`} /></>;
}
