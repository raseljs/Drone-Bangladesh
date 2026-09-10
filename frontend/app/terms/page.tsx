import type { Metadata } from "next";
import CmsInfoPage from "@/components/cms-info-page";
import { cmsStaticMetadata } from "@/lib/cms-static-metadata";
export async function generateMetadata():Promise<Metadata>{return cmsStaticMetadata("terms","Terms & Conditions","General terms for purchases and use of the Drone Bangladesh website.")}
export default function Page(){return <CmsInfoPage slug="terms" title="Terms & Conditions" description="General terms for purchases and use of the Drone Bangladesh website." fallbackHtml="<h2>Terms</h2><p>Orders are subject to availability and confirmation.</p>"/>}
