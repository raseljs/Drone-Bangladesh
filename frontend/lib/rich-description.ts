/**
 * Keep admin-authored product markup useful on the storefront without allowing
 * executable HTML.  Product managers can still use semantic HTML and inline
 * styles; scripts, embeds and event-handler attributes are removed.
 */
export function sanitizeDescriptionHtml(value: string) {
  return String(value || "")
    .replace(/<\/?(script|iframe|object|embed|form|base|meta|link)[^>]*>/gi, "")
    .replace(/\s(on[a-z]+)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/javascript\s*:/gi, "")
    .replace(/data\s*:/gi, "");
}

export function descriptionFallbackHtml(text: string) {
  const escaped = String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br />");
  return `<p>${escaped}</p>`;
}
