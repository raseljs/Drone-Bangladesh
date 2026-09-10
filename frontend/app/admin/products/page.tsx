import { Suspense } from "react";
import AdminProducts from "@/components/admin-products";
export default function AdminProductsPage() { return <main className="admin-page page-container"><Suspense fallback={<div className="admin-auth-loading">Loading products…</div>}><AdminProducts /></Suspense></main>; }
