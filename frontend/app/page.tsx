import type { Metadata } from "next";
import Link from "next/link";
import ProductRail from "@/components/product-rail";
import HeroBannerSlider from "@/components/hero-banner-slider";
import { SectionHeading, StoreCard } from "@/components/storefront";
import { getFeaturedCategories, getProducts } from "@/lib/catalog";
import { getContentEntries } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Drone Bangladesh | Drones, Cameras & Accessories",
  description: "Shop genuine DJI drones, cameras, accessories and enterprise solutions with courier delivery and expert support across Bangladesh.",
  path: "/",
  keywords: ["Drone Bangladesh", "DJI Bangladesh", "drone price in Bangladesh", "camera drone Bangladesh", "DJI accessories Bangladesh"],
});

function normalizeName(value:string|undefined){return (value||"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim()}

export default async function HomePage() {
  const [allProducts,newArrivals,popular,featured,djiProducts,djiEnterpriseProducts,personalProducts,beginnerProducts,enterpriseProducts,otherProducts,categories,banners,stores,reviews,homeSections]=await Promise.all([
    getProducts({limit:24}),
    getProducts({isNewArrival:true,limit:10}),
    getProducts({isPopular:true,limit:10}),
    getProducts({isFeatured:true,limit:10}),
    getProducts({brand:"DJI",limit:10}),
    getProducts({brand:"DJI Enterprise",limit:10}),
    getProducts({category:"Personal Drone",limit:10}),
    getProducts({category:"Beginner Drone",limit:10}),
    getProducts({category:"Enterprise & Agriculture",limit:10}),
    getProducts({category:"Others",limit:10}),
    getFeaturedCategories(),
    getContentEntries("banners"),
    getContentEntries("stores"),
    getContentEntries("reviews"),
    getContentEntries("home-sections"),
  ]);
  const products=allProducts;
  const newProducts=newArrivals.length?newArrivals:products.slice(0,8);
  const popularProducts=popular.length?popular:products.slice(0,8);
  const featuredProducts=featured.length?featured:products.slice(0,8);
  const activeSections=homeSections.length?new Set(homeSections.map(x=>normalizeName(x.name||x.title))):null;
  const show=(...names:string[])=>!activeSections||names.some(name=>activeSections.has(normalizeName(name)));
  const storeItems: Array<{title?:string;name?:string;body?:string}> = stores.length?stores:[{title:"Bashundhara City",body:"Level-1, Block-B, Shop-45, Bashundhara City Shopping Complex, Dhaka-1215"},{title:"Jamuna Future Park",body:"Shop-444, Block-C, Level-4, Jamuna Future Park, Kuril, Dhaka-1229"}];
  const reviewItems: Array<{title?:string;name?:string;body?:string;image?:string}> = reviews.length?reviews:[{title:"Rafiq Hasan",body:"Excellent service and genuine products. Delivery was fast and the team explained everything clearly."},{title:"Nusrat Jahan",body:"Helpful support and a smooth buying experience."},{title:"Tanvir Ahmed",body:"Good product guidance and fast delivery."}];
  return <main>
    <HeroBannerSlider banners={banners} />

    <section className="page-container brand-row" aria-label="Brands"><Link href="/brands/dji" className="brand-tile"><span className="dji-wordmark">dji</span><small>DJI</small></Link><Link href="/brands/dji-enterprise" className="brand-tile"><span className="dji-wordmark">dji <b>ENTERPRISE</b></span><small>DJI ENTERPRISE</small></Link></section>

    {show("Featured Categories")&&<section className="page-container section-block" id="featured-categories"><SectionHeading title="Featured categories" href="/products"/><div className="category-grid">{categories.map(({title,image,tone,slug})=><Link href={`/categories/${slug}`} className={`category-card ${tone}`} key={slug}><span className="category-image"><img src={image} alt={`${title} category`} loading="lazy"/></span><div className="category-card-copy"><strong>{title}</strong></div></Link>)}</div></section>}

    {show("Visit Our Store","Stores")&&<section className="page-container stores-section"><SectionHeading title="Visit our stores"/><div className="store-grid">{storeItems.map((store,index)=><StoreCard key={`${store.title||store.name}-${index}`} icon={<span className="store-pin">⌖</span>} title={store.title||store.name||"Drone Bangladesh Store"} address={store.body||"Dhaka"}/>)}</div></section>}

    {show("New Arrival")&&<section className="page-container section-block product-section"><SectionHeading title="New arrival" eyebrow="JUST LANDED" href="/products?sort=newest"/><ProductRail products={newProducts}/></section>}

    {show("Hot Products","Popular Products")&&popularProducts.length>0&&<section className="page-container section-block product-section compact"><SectionHeading title="Hot & popular products" href="/products"/><ProductRail products={popularProducts} compact/></section>}

    {show("Customer Reviews","Reviews")&&<section className="page-container section-block review-section"><SectionHeading title="Our honorable customers" href="/articles"/><div className="review-grid">{reviewItems.slice(0,5).map((review,index)=><article className="review-card" key={`${review.title||review.name}-${index}`}><div className="review-photo" style={review.image?{backgroundImage:`url(${review.image})`}:{backgroundPosition:`${index*24}% center`}}/><div className="review-body"><div className="stars">★★★★★</div><p>{review.body||"Thank you for choosing Drone Bangladesh."}</p><strong>{review.title||review.name||"Verified customer"}</strong><small>Verified customer</small></div></article>)}</div></section>}

    {show("DJI Drone")&&djiProducts.length>0&&<section className="page-container section-block product-section compact"><SectionHeading title="DJI drone" href="/brands/dji"/><ProductRail products={djiProducts} compact/></section>}
    {djiEnterpriseProducts.length>0&&<section className="page-container section-block product-section compact"><SectionHeading title="DJI Enterprise" href="/brands/dji-enterprise"/><ProductRail products={djiEnterpriseProducts} compact/></section>}
    {show("Personal Drone")&&personalProducts.length>0&&<section className="page-container section-block product-section compact"><SectionHeading title="Personal drone" href="/categories/personal-drone"/><ProductRail products={personalProducts} compact/></section>}
    {show("Beginner Drone")&&beginnerProducts.length>0&&<section className="page-container section-block product-section compact"><SectionHeading title="Beginner drone" href="/categories/beginner-drone"/><ProductRail products={beginnerProducts} compact/></section>}
    {show("Others")&&otherProducts.length>0&&<section className="page-container section-block product-section compact"><SectionHeading title="Others" href="/categories/others"/><ProductRail products={otherProducts} compact/></section>}
    {show("Enterprise & Agriculture","Enterprise")&&enterpriseProducts.length>0&&<section className="page-container section-block product-section compact"><SectionHeading title="Enterprise & Agriculture" href="/categories/enterprise-agriculture"/><ProductRail products={enterpriseProducts} compact/></section>}

    <section className="page-container reassurance-strip"><div><span className="reassure-icon">✓</span><span><strong>100% authentic</strong>Official products</span></div><div><span className="reassure-icon">✓</span><span><strong>Warranty support</strong>Eligible products</span></div><div><span className="reassure-icon">▣</span><span><strong>Courier delivery</strong>Fast & reliable</span></div><div><span className="reassure-icon">✦</span><span><strong>Expert support</strong>Before and after sale</span></div></section>
  </main>;
}
