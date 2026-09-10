const apiBase = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

export function getApiBase() { return apiBase; }

function authHeaders(path: string, headers?: HeadersInit) {
  const next = new Headers(headers);
  if (typeof window !== "undefined" && path.startsWith("/admin")) {
    const token = window.localStorage.getItem("drone-admin-token");
    if (token && !next.has("Authorization")) next.set("Authorization", `Bearer ${token}`);
  }
  return next;
}

async function parseApiError(response: Response) {
  let message = `API request failed: ${response.status}`;
  try {
    const payload = await response.json();
    message = payload?.message || payload?.error || message;
  } catch { /* non-json response */ }
  return message;
}

async function tryRefreshToken(path: string) {
  if (!apiBase) return false;
  try {
    const response = await fetch(`${apiBase}/auth/refresh`, { method: "POST", credentials: "include" });
    if (!response.ok) return false;
    const payload = await response.json().catch(() => ({}));
    if (typeof window !== "undefined" && path.startsWith("/admin") && payload?.data?.token) window.localStorage.setItem("drone-admin-token", payload.data.token);
    return true;
  } catch { return false; }
}

export async function apiRequest<T>(path: string, init: RequestInit = {}, allowRefresh = true): Promise<T> {
  if (!apiBase) throw new Error("NEXT_PUBLIC_API_URL is not configured.");
  const headers = authHeaders(path, init.headers);
  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  let response = await fetch(`${apiBase}${path}`, { ...init, headers, credentials: "include" });
  if (response.status === 401 && allowRefresh && !["/auth/refresh", "/auth/login", "/auth/register"].includes(path)) {
    if (await tryRefreshToken(path)) {
      const retryHeaders = authHeaders(path, init.headers);
      if (init.body && !(init.body instanceof FormData) && !retryHeaders.has("Content-Type")) retryHeaders.set("Content-Type", "application/json");
      response = await fetch(`${apiBase}${path}`, { ...init, headers: retryHeaders, credentials: "include" });
    }
  }
  if (!response.ok) throw new Error(await parseApiError(response));
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function apiFormRequest<T>(path: string, form: FormData): Promise<T> {
  return apiRequest<T>(path, { method: "POST", body: form });
}
