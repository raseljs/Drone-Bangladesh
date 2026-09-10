import type { Metadata } from "next";
import { Suspense } from "react";
import AdminShell from "@/components/admin-shell";
import { noIndexMetadata } from "@/lib/seo";
export const metadata: Metadata = noIndexMetadata;
export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <Suspense fallback={<main className="admin-auth-loading">Loading admin…</main>}><AdminShell>{children}</AdminShell></Suspense>; }
