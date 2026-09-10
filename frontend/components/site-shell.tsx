"use client";

import { usePathname } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/storefront";

export default function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  return <>{!isAdmin && <SiteHeader />}{children}{!isAdmin && <SiteFooter />}</>;
}
