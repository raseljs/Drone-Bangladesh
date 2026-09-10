import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { getContentEntries } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title:"Drone Guides, Reviews & Articles",
  description:"Read Drone Bangladesh buying guides, DJI comparisons, maintenance advice, aerial photography tips, enterprise drone articles and product support content.",
  path:"/articles",
  keywords:["drone articles Bangladesh","DJI buying guide","drone maintenance","aerial photography","Drone Bangladesh blog"],
});

const fallback=[
  {slug:"how-to-choose-your-first-dji-drone",title:"How to choose your first DJI drone",body:"A practical guide to camera, flight time and controller choices.",image:"/images/hero-drone.jpg",name:"Buyer guide"},
  {slug:"dji-air-3s-review",title:"DJI Air 3S Review: Aerial performance explained",body:"A practical look at dual cameras, flight time and intelligent safety features.",image:"/images/products/air-3.jpg",name:"Drone review"},
  {slug:"drone-battery-care",title:"How to extend drone battery life",body:"Charging habits and pre-flight checks that help every battery last longer.",image:"/images/categories/dji-remote-controller.png",name:"Battery care"},
];
export default async function ArticlesPage(){ const remote=await getContentEntries("articles"); const articles=remote.length?remote:fallback; return <main><section className="content-hero"><div className="page-container"><p>DRONE BANGLADESH JOURNAL</p><h1>Drone News & Help Blog</h1><span>Reviews, comparisons, how-to guides and practical stories for every pilot.</span></div></section><section className="page-container article-grid article-grid-rich">{articles.map((article,index)=>{const slug=article.slug||`article-${index+1}`;const title=article.title||article.name||"Drone Bangladesh Article";return <article className="article-card" key={slug}><div className="article-visual"><img src={article.image||"/images/hero-drone.jpg"} alt={`${title} featured image`} loading="lazy"/><span>{article.name||"Article"}</span></div><div><h2>{title}</h2><p>{article.body||"Read the latest update from Drone Bangladesh."}</p><Link href={`/articles/${slug}`}>Read More <ArrowRight size={14}/></Link></div></article>})}</section></main> }
