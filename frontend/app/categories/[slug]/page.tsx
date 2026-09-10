import type { Metadata } from "next";
import ProductListing from "@/components/product-listing";
import SeoJsonLd from "@/components/seo-jsonld";
import { breadcrumbJsonLd, buildMetadata, slugTitle } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const title = slugTitle(slug);
  return buildMetadata({
    title: `${title} in Bangladesh`,
    description: `Browse ${title} products, current prices and availability from Drone Bangladesh with courier delivery and expert support.`,
    path: `/categories/${slug}`,
    keywords: [title, `${title} price in Bangladesh`, "Drone Bangladesh", "DJI Bangladesh"],
  });
}

export default async function CategoryPage({ params, searchParams }: { params: Promise<{slug:string}>; searchParams: Promise<Record<string,string|string[]|undefined>> }) {
  const {slug}=await params;
  const title=slugTitle(slug);
  const breadcrumbs=breadcrumbJsonLd([{name:"Home",path:"/"},{name:"Categories",path:"/products"},{name:title,path:`/categories/${slug}`}]);
  return <><SeoJsonLd id="category-breadcrumb-schema" data={breadcrumbs}/><ProductListing fixedCategory={slug} basePath={`/categories/${slug}`} searchParams={await searchParams} title={title} description={`Products in ${title} from Drone Bangladesh.`} /></>;
}
