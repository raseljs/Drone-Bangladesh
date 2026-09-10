import sanitizeHtml from "sanitize-html";

export function sanitizeRichHtml(value: unknown) {
  if (typeof value !== "string") return value;
  return sanitizeHtml(value, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img", "h1", "h2", "h3", "h4", "h5", "h6", "figure", "figcaption", "video", "source", "table", "thead", "tbody", "tfoot", "tr", "th", "td", "span", "div"]),
    allowedAttributes: {
      "*": ["class", "id", "title", "aria-label"],
      a: ["href", "name", "target", "rel", "class", "title"],
      img: ["src", "alt", "width", "height", "loading", "class", "title"],
      video: ["src", "controls", "poster", "class"],
      source: ["src", "type"],
      td: ["colspan", "rowspan", "class"],
      th: ["colspan", "rowspan", "scope", "class"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowProtocolRelative: false,
    transformTags: {
      a: (_tagName, attribs) => ({ tagName: "a", attribs: { ...attribs, rel: "noopener noreferrer" } }),
    },
  });
}

export function sanitizeRichCss(value: unknown) {
  if (typeof value !== "string") return value;
  return value
    .replace(/<\/?style[^>]*>/gi, "")
    .replace(/@import\b[^;]*;?/gi, "")
    .replace(/expression\s*\(/gi, "")
    .replace(/url\s*\(\s*['\"]?\s*(?:javascript|vbscript|data):/gi, "url(")
    .replace(/behavior\s*:/gi, "")
    .slice(0, 100_000);
}
