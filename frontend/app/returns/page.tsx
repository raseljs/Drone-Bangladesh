import type { Metadata } from "next";
import CmsInfoPage from "@/components/cms-info-page";
import { cmsStaticMetadata } from "@/lib/cms-static-metadata";
export async function generateMetadata():Promise<Metadata>{return cmsStaticMetadata("returns","Return Policy","Return request information for eligible Drone Bangladesh orders.")}
export default function Page(){return <CmsInfoPage slug="returns" title="Return Policy" description="Return request information." fallbackHtml="<h2>Return Policy</h2><p>Eligible orders can submit a return request for review.</p>"/>}
