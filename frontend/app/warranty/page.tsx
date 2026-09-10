import type { Metadata } from "next";
import CmsInfoPage from "@/components/cms-info-page";
import { cmsStaticMetadata } from "@/lib/cms-static-metadata";
export async function generateMetadata():Promise<Metadata>{return cmsStaticMetadata("warranty","Warranty Policy","Warranty and after-sales support for eligible Drone Bangladesh products.")}
export default function Page(){return <CmsInfoPage slug="warranty" title="Warranty Policy" description="Warranty support for eligible products." fallbackHtml="<h2>Warranty</h2><p>Coverage depends on the product and manufacturer terms.</p>"/>}
