import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
export const metadata: Metadata = buildMetadata({title:"Drone Repair Support",description:"Drone repair and technical support information from Drone Bangladesh.",path:"/repairs"});
export default function Layout({children}:{children:React.ReactNode}){return children}
