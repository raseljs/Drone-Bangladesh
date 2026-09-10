import type { Metadata } from "next";
import CmsInfoPage from "@/components/cms-info-page";
import { cmsStaticMetadata } from "@/lib/cms-static-metadata";
export async function generateMetadata():Promise<Metadata>{return cmsStaticMetadata("shipping","Shipping Policy","Courier delivery information for orders across Bangladesh.")}
export default function Page(){return <CmsInfoPage slug="shipping" title="Shipping Policy" description="Courier delivery information for orders across Bangladesh." fallbackHtml="<h2>Courier Delivery</h2><p>Standard website courier delivery is ৳150.</p>"/>}
