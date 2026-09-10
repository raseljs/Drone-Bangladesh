"use client";

import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiRequest, getApiBase } from "@/lib/api";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setLoading(true);
    try {
      if (!getApiBase()) throw new Error("Backend API is not configured. Copy .env.example to .env.local first.");
      const result = await apiRequest<{ token?: string; data?: { token?: string; user?: { role?: string } }; user?: { role?: string } }>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
      const token = result.token || result.data?.token; const user = result.user || result.data?.user;
      if (!token || user?.role && user.role !== "admin") throw new Error("Admin access is required");
      window.localStorage.setItem("drone-admin-token", token); router.replace("/admin");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to sign in"); } finally { setLoading(false); }
  }
  return <main className="admin-login"><form className="admin-login-card" onSubmit={submit}><span className="admin-login-icon"><ShieldCheck size={25} /></span><p className="eyebrow">DRONE BANGLADESH / ADMIN</p><h1>Welcome back</h1><p>Sign in to manage products, content and orders.</p><label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="admin@dronebangladesh.com" required /></label><label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" required /></label>{error && <span className="crud-error">{error}</span>}<button className="button button-primary" type="submit" disabled={loading}>{loading ? "Signing in…" : "Sign in"}</button><Link href="/">Return to storefront</Link></form></main>;
}
