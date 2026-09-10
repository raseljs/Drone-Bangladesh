"use client";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { apiRequest, getApiBase } from "@/lib/api";
import ProductDescriptionLive from "@/components/product-description-live";

export default function ProductContentTabs({slug,specs,html,css,fallback}:{slug:string;specs:Array<[string,string]>;html:string;css?:string;fallback:string}){
  const [tab,setTab]=useState<"spec"|"description"|"faq"|"review">("spec");const [openFaq,setOpenFaq]=useState<number|null>(null);const [reviews,setReviews]=useState<any[]>([]);const [message,setMessage]=useState("");
  useEffect(()=>{if(getApiBase())void apiRequest<{data?:any[]}>(`/reviews/${slug}`).then(r=>setReviews(r.data||[])).catch(()=>undefined)},[slug]);
  const faqs=[
    ["Is this product available now?","Live stock is shown on the product page. Contact support if you need confirmation before ordering."],
    ["What warranty is included?","Warranty depends on the specific product and manufacturer terms shown at purchase."],
    ["Can I order with cash on delivery?","Yes. Checkout uses Courier Delivery and Cash on Delivery as the standard website flow."],
    ["Do you provide product support?","Yes. Drone Bangladesh provides pre-sale guidance and after-sales support for eligible products."],
  ];
  async function submitReview(e:React.FormEvent<HTMLFormElement>){e.preventDefault();setMessage("");const f=new FormData(e.currentTarget);try{await apiRequest(`/reviews/${slug}`,{method:"POST",body:JSON.stringify({rating:Number(f.get("rating")),title:f.get("title"),body:f.get("body")})});setMessage("Review submitted for admin approval.");e.currentTarget.reset();}catch(err){setMessage(err instanceof Error?err.message:"Unable to submit review")}}
  return <section className="page-container detail-content-tabs">
    <div className="product-info-sections">

      <article className="product-info-box">
        <h3 className="product-info-title">Specification</h3>
        <table className="spec-table"><tbody>{specs.map(([key,value])=><tr key={key}><th>{key}</th><td>{value}</td></tr>)}</tbody></table>
      </article>

      <article className="product-info-box">
        <h3 className="product-info-title">Description</h3>
        <ProductDescriptionLive slug={slug} initialHtml={html} initialCss={css} fallback={fallback}/>
      </article>

      <article className="product-info-box">
        <h3 className="product-info-title">Question FAQ</h3>
        <div className="faq-expand-list">{faqs.map(([q,a],i)=><article key={q}>
          <button onClick={()=>setOpenFaq(openFaq===i?null:i)}>{q}<Plus size={14}/></button>
          {openFaq===i&&<p>{a}</p>}
        </article>)}</div>
      </article>

      <article className="product-info-box">
        <h3 className="product-info-title">Review</h3>
        <div className="review-tab-layout">
          <div>{reviews.length?reviews.map(r=><article className="review-list-item" key={r._id}><strong>{r.customerName}</strong><span>{"★".repeat(r.rating)}</span><p>{r.body}</p></article>):<p>No approved reviews yet.</p>}</div>
          <form className="customer-card account-form" onSubmit={submitReview}>
            <label>Rating<select name="rating" defaultValue="5"><option value="5">5 - Excellent</option><option value="4">4 - Very good</option><option value="3">3 - Good</option><option value="2">2 - Fair</option><option value="1">1 - Poor</option></select></label>
            <label>Review<textarea name="body" rows={3} required/></label>
            {message&&<p className="crud-notice">{message}</p>}
            <button className="button button-primary">Submit</button>
          </form>
        </div>
      </article>
    </div>
  </section>
}
