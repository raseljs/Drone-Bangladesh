import type { Metadata } from "next";
import { getContentEntry } from "@/lib/content";
import { buildMetadata, cleanText } from "@/lib/seo";

export async function cmsStaticMetadata(slug:string,fallbackTitle:string,fallbackDescription:string):Promise<Metadata>{
  const entry=await getContentEntry("pages",slug);
  return buildMetadata({
    title:entry?.title||fallbackTitle,
    description:cleanText(entry?.body||entry?.bodyHtml||fallbackDescription),
    path:`/${slug}`,
    image:entry?.image||undefined,
  });
}
