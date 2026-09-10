import type { Metadata } from "next";
import { CartSurface } from "@/components/content-pages";
import { noIndexMetadata } from "@/lib/seo";
export const metadata: Metadata = noIndexMetadata;
export default function CartPage() { return <CartSurface />; }
