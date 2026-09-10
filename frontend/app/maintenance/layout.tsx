import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
export const metadata: Metadata = buildMetadata({title:"Drone Maintenance & Repair",description:"Request professional drone maintenance, inspection, repair and fleet support from Drone Bangladesh.",path:"/maintenance"});
export default function Layout({children}:{children:React.ReactNode}){return children}
