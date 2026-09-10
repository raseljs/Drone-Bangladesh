import { Suspense } from "react";
import AdminContent from "@/components/admin-content";
export default function AdminContentPage() { return <main className="admin-page page-container"><Suspense fallback={<div className="admin-auth-loading">Loading content manager…</div>}><AdminContent /></Suspense></main>; }
