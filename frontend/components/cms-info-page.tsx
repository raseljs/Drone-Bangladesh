import Link from "next/link";
import { getContentEntry } from "@/lib/content";
import { sanitizeDescriptionHtml } from "@/lib/rich-description";

export default async function CmsInfoPage({slug,title,description,fallbackHtml}:{slug:string;title:string;description:string;fallbackHtml:string}){
  const entry=await getContentEntry("pages",slug);
  const html=sanitizeDescriptionHtml(entry?.bodyHtml||fallbackHtml);
  return <main><section className="content-hero"><div className="page-container"><p>DRONE BANGLADESH</p><h1>{entry?.title||title}</h1><span>{entry?.body||description}</span></div></section><article className="page-container article-detail static-info-page"><div dangerouslySetInnerHTML={{__html:html}}/><Link href="/contact" className="button button-primary">Contact support</Link></article></main>;
}
