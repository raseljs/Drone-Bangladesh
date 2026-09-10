import type { Metadata } from "next";
import { ContactSurface } from "@/components/content-pages";
import { buildMetadata } from "@/lib/seo";
export const metadata: Metadata = buildMetadata({title:"Contact Drone Bangladesh",description:"Contact Drone Bangladesh for product advice, order support, courier delivery, enterprise solutions and maintenance assistance.",path:"/contact"});
export default function ContactPage() { return <ContactSurface />; }
