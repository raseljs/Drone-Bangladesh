import type { Metadata } from "next";
import { WishlistSurface } from "@/components/customer-surfaces";
import { noIndexMetadata } from "@/lib/seo";
export const metadata: Metadata = noIndexMetadata;
export default function WishlistPage(){return <WishlistSurface/>}
