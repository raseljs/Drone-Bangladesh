import { Suspense } from "react";
import AdminAccessoryMappings from "@/components/admin-accessory-mappings";

export default function BuyComboAdminPage() {
  return <main className="admin-page page-container"><Suspense fallback={<div className="admin-auth-loading">Loading combo manager…</div>}><AdminAccessoryMappings kindOnly="combo" /></Suspense></main>;
}
