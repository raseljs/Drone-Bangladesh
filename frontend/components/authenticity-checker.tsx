"use client";

import { CheckCircle2, Search, ShieldCheck, XCircle } from "lucide-react";
import { useState } from "react";
import { apiRequest, getApiBase } from "@/lib/api";

type Verification = { authentic?: boolean; serialNumber?: string; productName?: string; productSlug?: string; warrantyStatus?: string; warrantyStart?: string; warrantyEnd?: string; message?: string };

export default function AuthenticityChecker() {
  const [serialNumber, setSerialNumber] = useState("");
  const [result, setResult] = useState<Verification | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function verify(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setResult(null);
    try {
      if (!getApiBase()) throw new Error("Authenticity verification needs the backend API to be configured.");
      const response = await apiRequest<{ data?: Verification }>("/warranty/verify", { method: "POST", body: JSON.stringify({ serialNumber }) });
      setResult(response.data || null);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Serial number could not be verified"); }
    finally { setBusy(false); }
  }
  return <main className="page-container authenticity-page"><div className="authenticity-hero"><ShieldCheck size={42}/><div><p className="eyebrow">DRONE BANGLADESH TRUST</p><h1>Authenticity &amp; Warranty Checker</h1><span>Enter the serial number from your product or invoice to verify originality and warranty status.</span></div></div><section className="authenticity-card"><form onSubmit={verify}><label>Product serial number<input value={serialNumber} onChange={(event) => setSerialNumber(event.target.value.toUpperCase())} required placeholder="Example: DB-DJI-2026-0001" autoComplete="off"/><small>Serial numbers are case-insensitive.</small></label><button className="button button-red" disabled={busy}><Search size={15}/>{busy ? "Checking…" : "Verify serial number"}</button></form>{error && <div className="crud-error"><XCircle size={16}/>{error}</div>}{result && <div className={`verification-result ${result.authentic ? "is-valid" : "is-invalid"}`}>{result.authentic ? <CheckCircle2 size={25}/> : <XCircle size={25}/>}<div><h2>{result.authentic ? "Authentic product" : "Verification failed"}</h2><p>{result.message}</p>{result.productName && <dl><div><dt>Product</dt><dd>{result.productName}</dd></div><div><dt>Serial number</dt><dd>{result.serialNumber}</dd></div><div><dt>Warranty status</dt><dd>{result.warrantyStatus}</dd></div>{result.warrantyStart && <div><dt>Warranty period</dt><dd>{new Date(result.warrantyStart).toLocaleDateString()} — {result.warrantyEnd ? new Date(result.warrantyEnd).toLocaleDateString() : ""}</dd></div>}</dl>}</div></div>}<p className="authenticity-note">If the result looks incorrect, keep your invoice and contact <a href="mailto:dronebangladesh567@gmail.com">dronebangladesh567@gmail.com</a>.</p></section></main>;
}
