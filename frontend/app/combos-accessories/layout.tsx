import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
export const metadata: Metadata = buildMetadata({title:"Drone Combos & Accessories",description:"Browse compatible drone combo options, batteries, propellers, filters, controllers and accessories from Drone Bangladesh.",path:"/combos-accessories"});
export default function Layout({children}:{children:React.ReactNode}){return children}
