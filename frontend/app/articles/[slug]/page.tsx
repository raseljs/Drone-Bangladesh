import type { Metadata } from "next";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import SeoJsonLd from "@/components/seo-jsonld";
import { getContentEntry, type ContentEntry } from "@/lib/content";
import { sanitizeDescriptionHtml } from "@/lib/rich-description";
import { DEFAULT_OG_IMAGE, absoluteUrl, breadcrumbJsonLd, buildMetadata, cleanText } from "@/lib/seo";

const fallback: ContentEntry={slug:"how-to-choose-your-first-dji-drone",title:"How to choose your first DJI drone",body:"Choosing your first drone should feel exciting, not overwhelming. Start with the kind of footage you want to create, then compare camera size, flight time and controller comfort.",bodyHtml:"<h2>Start with your use case</h2><p>Mini drones are ideal for travel and everyday practice. Air and Mavic models add camera flexibility and stronger wind performance for more ambitious shoots.</p><h2>Buy the setup, not just the aircraft</h2><p>A Fly More Combo, extra batteries and filters make it easier to spend time in the air.</p>",image:DEFAULT_OG_IMAGE};

export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{
  const {slug}=await params;
  const remote=await getContentEntry("articles",slug);
  const article=remote||(!process.env.NEXT_PUBLIC_API_URL&&slug===fallback.slug?fallback:null);
  if(!article) return {title:"Article not found",robots:{index:false,follow:false}};
  return buildMetadata({
    title: article.title||article.name||"Drone Bangladesh Article",
    description: cleanText(article.body||article.bodyHtml||"Drone Bangladesh guide and product information."),
    path:`/articles/${slug}`,
    image:article.image||DEFAULT_OG_IMAGE,
    type:"article",
    keywords:[article.name||"Drone guide","Drone Bangladesh","DJI","drone guide Bangladesh"],
  });
}

export default async function ArticleDetailPage({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  const remote=await getContentEntry("articles",slug);
  const article=remote||(!process.env.NEXT_PUBLIC_API_URL&&slug===fallback.slug?fallback:null);
  if(!article) notFound();
  const html=sanitizeDescriptionHtml(article.bodyHtml||`<p>${article.body||""}</p>`);
  const title=article.title||article.name||"Drone Bangladesh Article";
  const description=cleanText(article.body||html||"Drone Bangladesh guide and product information.").slice(0,500);
  const canonical=absoluteUrl(`/articles/${slug}`);
  const articleSchema={
    "@context":"https://schema.org",
    "@type":"Article",
    "@id":`${canonical}#article`,
    headline:title,
    description,
    image:[absoluteUrl(article.image||DEFAULT_OG_IMAGE)],
    mainEntityOfPage:{"@type":"WebPage","@id":canonical},
    datePublished:article.createdAt||undefined,
    dateModified:article.updatedAt||article.createdAt||undefined,
    author:{"@type":"Organization",name:"Drone Bangladesh",url:absoluteUrl("/")},
    publisher:{"@type":"Organization",name:"Drone Bangladesh",url:absoluteUrl("/"),logo:{"@type":"ImageObject",url:absoluteUrl("/images/logo/drone-bangladesh.png")}},
  };
  const breadcrumbs=breadcrumbJsonLd([{name:"Home",path:"/"},{name:"Articles",path:"/articles"},{name:title,path:`/articles/${slug}`}]);
  return <>
    <SeoJsonLd id="article-schema" data={[articleSchema,breadcrumbs]}/>
    <main><section className="content-hero"><div className="page-container"><p>DRONE BANGLADESH JOURNAL</p><h1>{title}</h1><span>{article.body||"Drone Bangladesh article"}</span></div></section><article className="page-container article-detail"><Link href="/articles"><ArrowLeft size={14}/> Back to journal</Link>{article.image&&<img src={article.image} alt={`${title} - Drone Bangladesh`} loading="eager"/>}<div dangerouslySetInnerHTML={{__html:html}}/><Link href="/products" className="button button-primary">Explore products <ArrowRight size={14}/></Link></article></main>
  </>;
}
