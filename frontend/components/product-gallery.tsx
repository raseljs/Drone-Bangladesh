"use client";
import { useState } from "react";
export default function ProductGallery({images,name}:{images:string[];name:string}){
  const safe=images.filter(Boolean);const [active,setActive]=useState(safe[0]||"/images/products/mini-5.jpg");
  return <section className="detail-gallery"><div className="gallery-main"><img src={active} alt={name}/></div><div className="gallery-thumbs">{safe.slice(0,6).map((image,index)=><button type="button" className={active===image?"selected":""} key={`${image}-${index}`} onClick={()=>setActive(image)}><img src={image} alt={`${name} ${index+1}`}/></button>)}</div></section>
}
