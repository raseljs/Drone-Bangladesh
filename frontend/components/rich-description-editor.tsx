"use client";

import { Bold, Code2, Eye, Italic, List, ListOrdered, Pilcrow, RotateCcw } from "lucide-react";
import { useState } from "react";
import { sanitizeDescriptionHtml } from "@/lib/rich-description";

type DescriptionValue = { html: string; css: string };

const starterHtml = `<h2>Product overview</h2>\n<p>Write a clear, helpful description for this product.</p>\n<ul>\n  <li>Add the main benefit or use case.</li>\n  <li>Explain what is included in the box.</li>\n</ul>`;
const starterCss = `.product-description-rendered h2 {\n  color: #102952;\n  margin-bottom: 12px;\n}\n.product-description-rendered p {\n  line-height: 1.7;\n}`;

export default function RichDescriptionEditor({ value, onChange }: { value: DescriptionValue; onChange: (value: DescriptionValue) => void }) {
  const [tab, setTab] = useState<"html" | "css" | "preview">("html");

  function update(key: keyof DescriptionValue, next: string) {
    onChange({ ...value, [key]: next });
  }

  function insert(snippet: string) {
    const current = value.html;
    const next = current ? `${current}\n${snippet}` : snippet;
    update("html", next);
  }

  return <section className="rich-description-editor" aria-label="Product description editor">
    <div className="rich-editor-heading"><div><strong>Rich product description</strong><small>Use HTML for structure and CSS for premium styling. The preview is sanitized before display.</small></div><button type="button" className="rich-editor-reset" onClick={() => onChange({ html: starterHtml, css: starterCss })}><RotateCcw size={13} />Use starter</button></div>
    <div className="rich-editor-tabs" role="tablist" aria-label="Description editor views">
      <button type="button" className={tab === "html" ? "active" : ""} onClick={() => setTab("html")}><Code2 size={14} />HTML</button>
      <button type="button" className={tab === "css" ? "active" : ""} onClick={() => setTab("css")}><Pilcrow size={14} />CSS</button>
      <button type="button" className={tab === "preview" ? "active" : ""} onClick={() => setTab("preview")}><Eye size={14} />Preview</button>
    </div>
    {tab === "html" && <div className="rich-editor-source"><div className="rich-editor-toolbar"><button type="button" onClick={() => insert("<strong>Bold text</strong>")} title="Insert bold"><Bold size={14} /></button><button type="button" onClick={() => insert("<em>Italic text</em>")} title="Insert italic"><Italic size={14} /></button><button type="button" onClick={() => insert("<ul>\n  <li>List item</li>\n</ul>")} title="Insert list"><List size={14} /></button><button type="button" onClick={() => insert("<ol>\n  <li>Ordered item</li>\n</ol>")} title="Insert ordered list"><ListOrdered size={14} /></button></div><textarea value={value.html} onChange={(event) => update("html", event.target.value)} placeholder="<h2>DJI Mini 5 Pro</h2>\n<p>Write your product description...</p>" spellCheck={false} /></div>}
    {tab === "css" && <div className="rich-editor-source"><p className="rich-editor-help">Scope selectors under <code>.product-description-rendered</code> so your styling stays inside the description.</p><textarea value={value.css} onChange={(event) => update("css", event.target.value)} placeholder=".product-description-rendered h2 { color: #102952; }" spellCheck={false} /></div>}
    {tab === "preview" && <div className="rich-editor-preview"><style>{value.css}</style><div className="product-description-rendered" dangerouslySetInnerHTML={{ __html: sanitizeDescriptionHtml(value.html) }} /></div>}
  </section>;
}

export { starterCss, starterHtml };
