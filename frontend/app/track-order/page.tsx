import type { Metadata } from "next";
import { Suspense } from "react";
import { TrackOrderSurface } from "@/components/customer-surfaces";
import { noIndexMetadata } from "@/lib/seo";
export const metadata: Metadata = noIndexMetadata;
export default function TrackOrderPage(){return <Suspense fallback={<main className="page-container simple-surface">Loading order tracker…</main>}><TrackOrderSurface/></Suspense>}
