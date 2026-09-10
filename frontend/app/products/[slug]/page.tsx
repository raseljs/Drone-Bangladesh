import type { Metadata } from "next";
import { Check, ChevronRight, CircleHelp, RotateCcw, ShieldCheck, ShoppingCart, Truck, X } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProductPurchaseActions from "@/components/product-purchase-actions";
import ProductAccessories, { ProductDetailsTabs } from "@/components/product-accessories";
import ProductGallery from "@/components/product-gallery";
import ProductContentTabs from "@/components/product-content-tabs";
import SeoJsonLd from "@/components/seo-jsonld";
import { fallbackAccessoriesFor } from "@/lib/accessories";
import { getProduct, getProducts } from "@/lib/catalog";
import { descriptionFallbackHtml, sanitizeDescriptionHtml } from "@/lib/rich-description";
import { absoluteUrl, breadcrumbJsonLd, buildMetadata, cleanText } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: "Product not found", robots: { index: false, follow: false } };
  const description = cleanText(product.shortDescription || product.description || `${product.name} from Drone Bangladesh.`).slice(0, 260);
  return buildMetadata({
    title: product.name,
    description,
    path: `/products/${product.slug}`,
    image: product.image,
    keywords: [product.name, product.brand || "DJI", product.category || "drone", "Drone Bangladesh", "drone price in Bangladesh"],
  });
}

function specs(value: unknown): Array<[string,string]> {
  if (!value) return [];
  if (value instanceof Map) return [...value.entries()].map(([k,v])=>[String(k),String(v)]);
  if (typeof value === "object" && !Array.isArray(value)) return Object.entries(value as Record<string,unknown>).map(([k,v])=>[k,String(v)]);
  return [];
}

export default async function ProductDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const selectedProduct = await getProduct(slug);
  if (!selectedProduct) notFound();
  const allProducts = await getProducts({ limit: 12 });
  const similar = allProducts.filter(item => item.slug !== selectedProduct.slug && (!selectedProduct.category || item.category === selectedProduct.category)).slice(0,8);
  const fallbackAccessoryMappings = fallbackAccessoriesFor(selectedProduct.slug);
  const gallery = selectedProduct.images?.length ? selectedProduct.images : [selectedProduct.image];
  const features = selectedProduct.keyFeatures?.length ? selectedProduct.keyFeatures : [selectedProduct.meta || "Official product", selectedProduct.stock && selectedProduct.stock > 0 ? "Available in stock" : "Contact us for availability"];
  const specificationRows = specs(selectedProduct.specifications);
  const descriptionHtml = sanitizeDescriptionHtml(selectedProduct.descriptionHtml || descriptionFallbackHtml(selectedProduct.description || selectedProduct.shortDescription || `${selectedProduct.name} is available from Drone Bangladesh.`));
  const description = cleanText(selectedProduct.shortDescription || selectedProduct.description || descriptionHtml || `${selectedProduct.name} from Drone Bangladesh.`).slice(0, 500);
  const oldPrice = Number(selectedProduct.oldPrice || selectedProduct.price);
  const discount = oldPrice > selectedProduct.price ? Math.round((1-selectedProduct.price/oldPrice)*100) : 0;
  const emi = Math.ceil(selectedProduct.price/12);

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${absoluteUrl(`/products/${selectedProduct.slug}`)}#product`,
    name: selectedProduct.name,
    url: absoluteUrl(`/products/${selectedProduct.slug}`),
    image: gallery.filter(Boolean).map((image) => absoluteUrl(image)),
    description,
    sku: selectedProduct.sku || undefined,
    brand: selectedProduct.brand ? { "@type": "Brand", name: selectedProduct.brand } : undefined,
    category: selectedProduct.category || undefined,
    itemCondition: "https://schema.org/NewCondition",
    offers: {
      "@type": "Offer",
      url: absoluteUrl(`/products/${selectedProduct.slug}`),
      priceCurrency: "BDT",
      price: selectedProduct.price,
      availability: Number(selectedProduct.stock || 0) > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: "Drone Bangladesh", url: absoluteUrl("/") },
    },
  };
  const breadcrumbs = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Products", path: "/products" },
    { name: selectedProduct.name, path: `/products/${selectedProduct.slug}` },
  ]);

  return <>
    <SeoJsonLd id="product-schema" data={[productSchema, breadcrumbs]} />
    <main>
      <div className="page-container breadcrumb"><Link href="/">Home</Link><ChevronRight size={13}/><Link href="/products">Products</Link><ChevronRight size={13}/><span>{selectedProduct.name}</span></div>
      <div className="page-container product-share-bar">
        <span>Share:</span>
        <button aria-label="Facebook">f</button>
        <button aria-label="X"><X size={15}/></button>
        <button aria-label="WhatsApp">◉</button>
        <button aria-label="Copy link">↗</button>
      </div>
      <div className="page-container product-detail-layout">
        <aside className="similar-panel"><div className="similar-heading"><h2>Similar product</h2><CircleHelp size={16}/></div>{similar.map(item=><Link href={`/products/${item.slug}`} className="similar-item" key={item.slug}><img src={item.image} alt={`${item.name} at Drone Bangladesh`} loading="lazy"/><div><strong>{item.name}</strong><span>৳{item.price.toLocaleString("en-BD")}</span><small><ShoppingCart size={12}/> View product</small></div></Link>)}<Link href="/products" className="similar-more">View more products</Link></aside>
        <ProductGallery images={gallery} name={selectedProduct.name}/>
        <section className="purchase-panel">
          <div className="product-tags"><span>Brand: {selectedProduct.brand || "Drone Bangladesh"}</span>{selectedProduct.sku && <span>Product Code: {selectedProduct.sku}</span>}<span className={Number(selectedProduct.stock||0)>0?"in-stock":""}>Status: {Number(selectedProduct.stock||0)>0?`In Stock (${selectedProduct.stock})`:selectedProduct.preorderEnabled !== false ? "Out of Stock · Pre-Order Open" : "Out of Stock"}</span></div>
          <h1>{selectedProduct.name}</h1><div className="detail-price"><strong>৳{selectedProduct.price.toLocaleString("en-BD")}</strong>{oldPrice>selectedProduct.price&&<del>৳{oldPrice.toLocaleString("en-BD")}</del>}{discount>0&&<em>-{discount}%</em>}</div>{oldPrice>selectedProduct.price&&<p className="save-copy">(You save ৳{(oldPrice-selectedProduct.price).toLocaleString("en-BD")})</p>}
          <div className="key-features"><h3>Key features</h3>{features.map(feature=><span key={feature}><Check size={15}/>{feature}</span>)}</div>
          <button className="view-more-info">View More Info →</button>
          <div className="payment-block"><h3>Payment options</h3><div className="payment-options"><label className="payment-option selected"><input type="radio" name="payment" defaultChecked/><strong>৳{selectedProduct.price.toLocaleString("en-BD")}</strong><small>Cash / online payment</small></label><label className="payment-option"><input type="radio" name="payment"/><strong>৳{emi.toLocaleString("en-BD")}/month</strong><small>Estimated 12-month EMI</small></label></div></div>
          <ProductPurchaseActions product={selectedProduct} comboAccessories={fallbackAccessoryMappings.filter(item=>item.kind==="combo")}/>
          <div className="micro-benefits"><span><ShieldCheck size={17}/>100% Original<br/>Products</span><span><ShieldCheck size={17}/>Official<br/>Warranty</span><span><RotateCcw size={17}/>Replacement<br/>Support</span><span><Truck size={17}/>Fast Delivery<br/>All Over BD</span></div>
        </section>
      </div>
      <ProductDetailsTabs productSlug={selectedProduct.slug} hasCombo={fallbackAccessoryMappings.some(item=>item.kind==="combo")}/>
      <ProductContentTabs slug={selectedProduct.slug} specs={specificationRows.length?specificationRows:[["Brand",selectedProduct.brand||"—"],["Category",selectedProduct.category||"—"],["SKU",selectedProduct.sku||"—"],["Stock",String(selectedProduct.stock??"—")]]} html={descriptionHtml} css={selectedProduct.descriptionCss} fallback={selectedProduct.description || selectedProduct.shortDescription || selectedProduct.name}/>
      <section className="mobile-similar-products">
        <div className="similar-heading"><h2>Similar product</h2><CircleHelp size={16}/></div>
        <div className="mobile-similar-track">
          {similar.map(item=><Link href={`/products/${item.slug}`} className="similar-item" key={`mobile-${item.slug}`}>
            <img src={item.image} alt={`${item.name} at Drone Bangladesh`} loading="lazy"/>
            <div><strong>{item.name}</strong><span>৳{item.price.toLocaleString("en-BD")}</span><small><ShoppingCart size={12}/> View product</small></div>
          </Link>)}
        </div>
      </section>
      <ProductAccessories product={selectedProduct} fallback={fallbackAccessoryMappings}/>
    </main>
  </>;
}
