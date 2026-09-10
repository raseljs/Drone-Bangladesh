import type { Metadata } from "next";
import CmsInfoPage from "@/components/cms-info-page";
import SeoJsonLd from "@/components/seo-jsonld";
import { getContentEntries, type ContentEntry } from "@/lib/content";
import { cmsStaticMetadata } from "@/lib/cms-static-metadata";
import { cleanText } from "@/lib/seo";

export async function generateMetadata():Promise<Metadata>{return cmsStaticMetadata("faqs","Frequently Asked Questions","Answers about Drone Bangladesh delivery, orders, tracking, warranty, returns and maintenance.")}

const fallbackFaqs: ContentEntry[]=[
  {name:"Do you deliver outside Dhaka?",body:"Yes. Courier delivery is available across Bangladesh for eligible products."},
  {name:"Can I track an order?",body:"Yes. Use Track Order with your order number and checkout phone number."},
  {name:"Can I request drone maintenance?",body:"Yes. Submit a service request from the Maintenance page."},
  {name:"How much is courier delivery?",body:"The standard website courier delivery charge is ৳150."},
  {name:"Do you support returns?",body:"Eligible orders can submit a return or refund request for review."},
];

export default async function Page(){
  const remote=await getContentEntries("faqs");
  const faqs=(remote.length?remote:fallbackFaqs).filter(item=>item.name&&(item.body||item.title));
  const schema={"@context":"https://schema.org","@type":"FAQPage",mainEntity:faqs.map(item=>({"@type":"Question",name:item.name,acceptedAnswer:{"@type":"Answer",text:cleanText(item.body||item.title)}}))};
  return <><SeoJsonLd id="faq-schema" data={schema}/><CmsInfoPage slug="faqs" title="Frequently Asked Questions" description="Quick answers for buying and using products from Drone Bangladesh." fallbackHtml="<h2>Do you deliver outside Dhaka?</h2><p>Yes. Courier delivery is available across Bangladesh.</p>"/></>;
}
