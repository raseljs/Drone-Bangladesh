import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
export const metadata: Metadata = buildMetadata({title:"Business & Enterprise Drone Solutions",description:"Drone Bangladesh solutions for business, enterprise, agriculture, inspection, mapping and professional operations.",path:"/b2b-b2c"});
export default function Layout({children}:{children:React.ReactNode}){return children}
