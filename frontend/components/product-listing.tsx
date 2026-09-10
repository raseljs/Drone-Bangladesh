import { ProductCard } from "@/components/storefront";
import { queryProducts, type ProductQuery } from "@/lib/catalog";

function pageHref(basePath: string, params: Record<string, string | number | undefined>, page: number) {
  const qs = new URLSearchParams();
  Object.entries({ ...params, page }).forEach(([k,v])=>{ if(v !== undefined && String(v) !== "") qs.set(k,String(v)); });
  return `${basePath}?${qs.toString()}`;
}

export default async function ProductListing({ title="All Products", description="Official drones, handhelds and accessories.", basePath="/products", fixedCategory, fixedBrand, searchParams={} }: { title?: string; description?: string; basePath?: string; fixedCategory?: string; fixedBrand?: string; searchParams?: Record<string,string|string[]|undefined> }) {
  const one=(key:string)=>Array.isArray(searchParams[key])?searchParams[key]?.[0]:searchParams[key];
  const query: ProductQuery = {
    q: one("q"), category: fixedCategory || one("category"), brand: fixedBrand || one("brand"),
    sort: one("sort"), stock: one("stock") === "out" ? "out" : one("stock") === "in" ? "in" : undefined,
    minPrice: one("minPrice") ? Number(one("minPrice")) : undefined, maxPrice: one("maxPrice") ? Number(one("maxPrice")) : undefined,
    page: Math.max(1,Number(one("page"))||1), limit: 24,
  };
  const result=await queryProducts(query);
  const keep={ q:query.q, sort:query.sort, stock:query.stock, minPrice:query.minPrice, maxPrice:query.maxPrice };
  return <main>
    <section className="catalog-hero"><div className="page-container"><p>Home / Products</p><h1>{title}</h1><span>{description}</span></div></section>
    <div className="page-container listing-layout">
      <aside className="filter-panel"><form method="get" action={basePath}><div className="filter-title"><strong>Filter products</strong></div>
        <div className="filter-group"><strong>Search</strong><input name="q" defaultValue={query.q||""} placeholder="Product, SKU, category" /></div>
        <div className="filter-group"><strong>Price range (৳)</strong><input type="number" name="minPrice" defaultValue={query.minPrice} placeholder="Min" /><input type="number" name="maxPrice" defaultValue={query.maxPrice} placeholder="Max" /></div>
        <div className="filter-group"><strong>Availability</strong><select name="stock" defaultValue={query.stock||""}><option value="">All</option><option value="in">In stock</option><option value="out">Out of stock</option></select></div>
        <div className="filter-group"><strong>Sort</strong><select name="sort" defaultValue={query.sort||"newest"}><option value="newest">Newest</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option><option value="name">Name</option></select></div>
        <button className="button button-primary" type="submit">Apply filters</button><a className="clear-filter" href={basePath}>Clear filters</a>
      </form></aside>
      <section className="listing-results"><div className="listing-toolbar"><span>{result.meta.total} result{result.meta.total===1?"":"s"}</span></div>
        {result.products.length ? <div className="product-grid four">{result.products.map(product=><ProductCard product={product} key={product.slug}/>)}</div> : <div className="empty-state"><h2>No products found</h2><p>Try a different search or filter.</p></div>}
        {result.meta.pages>1 && <div className="pagination">{Array.from({length:result.meta.pages},(_,i)=>i+1).slice(0,8).map(p=><a key={p} className={p===result.meta.page?"active":""} href={pageHref(basePath,keep,p)}>{p}</a>)}</div>}
      </section>
    </div>
  </main>;
}
