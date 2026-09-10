import type { Metadata } from "next";
import CmsInfoPage from "@/components/cms-info-page";
import { cmsStaticMetadata } from "@/lib/cms-static-metadata";
export async function generateMetadata():Promise<Metadata>{return cmsStaticMetadata("refund","Refund & Returns","Guidance for requesting a return or refund from Drone Bangladesh.")}
export default function Page(){return <CmsInfoPage slug="refund" title="Refund & Returns" description="Guidance for requesting a return or refund." fallbackHtml="<h2>Refund & Returns</h2><p>Approved refunds are processed after review.</p>"/>}
