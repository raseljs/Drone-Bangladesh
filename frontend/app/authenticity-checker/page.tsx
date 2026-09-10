import type { Metadata } from "next";
import AuthenticityChecker from "@/components/authenticity-checker";
import { buildMetadata } from "@/lib/seo";
export const metadata: Metadata = buildMetadata({ title: "Authenticity & Warranty Checker", description: "Verify your Drone Bangladesh product serial number and official warranty status.", path: "/authenticity-checker" });
export default function Page() { return <AuthenticityChecker />; }
