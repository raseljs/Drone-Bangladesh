import type { Metadata } from "next";
import CmsInfoPage from "@/components/cms-info-page";
import { cmsStaticMetadata } from "@/lib/cms-static-metadata";
export async function generateMetadata():Promise<Metadata>{return cmsStaticMetadata("privacy","Privacy Policy","How Drone Bangladesh handles customer information for orders, accounts and support.")}
export default function Page(){return <CmsInfoPage slug="privacy" title="Privacy Policy" description="How customer information is used for orders and support." fallbackHtml="<h2>Privacy</h2><p>We use customer information only for orders, support and operating the service.</p>"/>}
