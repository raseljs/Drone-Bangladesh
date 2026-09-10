import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
export const metadata: Metadata = buildMetadata({title:"Drone Rental",description:"Explore Drone Bangladesh rental and project support information.",path:"/rental"});
export default function Layout({children}:{children:React.ReactNode}){return children}
