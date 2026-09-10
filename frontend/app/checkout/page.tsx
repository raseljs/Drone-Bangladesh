import type { Metadata } from "next";
import { CheckoutSurface } from "@/components/content-pages";
import { noIndexMetadata } from "@/lib/seo";
export const metadata: Metadata = noIndexMetadata;
export const dynamic = "force-dynamic";
export default function CheckoutPage() { return <CheckoutSurface />; }
