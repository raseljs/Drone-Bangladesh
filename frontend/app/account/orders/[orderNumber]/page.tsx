import { InvoiceSurface } from "@/components/order-support-surfaces";
export default async function InvoicePage({params}:{params:Promise<{orderNumber:string}>}){const {orderNumber}=await params;return <InvoiceSurface orderNumber={orderNumber}/>;}
