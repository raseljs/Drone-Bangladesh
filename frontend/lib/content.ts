export type ContentEntry = {
  _id?: string; name?: string; slug?: string; title?: string; body?: string; bodyHtml?: string; bodyCss?: string;
  descriptionHtml?: string; descriptionCss?: string; image?: string; data?: Record<string, unknown>; status?: string; sortOrder?: number;
  createdAt?: string; updatedAt?: string;
};

function base() { return (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, ""); }
export async function getContentEntries(resource: string): Promise<ContentEntry[]> {
  const api=base(); if(!api) return [];
  try { const response=await fetch(`${api}/content/${encodeURIComponent(resource)}`,{cache:"no-store"}); if(!response.ok) return []; const payload=await response.json() as {data?:ContentEntry[]}; return Array.isArray(payload.data)?payload.data:[]; } catch { return []; }
}
export async function getContentEntry(resource:string,slug:string):Promise<ContentEntry|null>{
  const api=base(); if(!api) return null;
  try { const response=await fetch(`${api}/content/${encodeURIComponent(resource)}/${encodeURIComponent(slug)}`,{cache:"no-store"}); if(!response.ok) return null; const payload=await response.json() as {data?:ContentEntry}; return payload.data||null; } catch { return null; }
}
