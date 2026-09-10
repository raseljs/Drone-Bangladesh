"use client";

import { ImagePlus, RefreshCw, Trash2, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { apiFormRequest, apiRequest } from "@/lib/api";

type MediaItem = { provider:string; url:string; filename?:string; folder?:string; publicId?:string };

export default function AdminMedia(){
  const [items,setItems]=useState<MediaItem[]>([]); const [folder,setFolder]=useState("general"); const [message,setMessage]=useState(""); const [busy,setBusy]=useState(false); const fileRef=useRef<HTMLInputElement|null>(null);
  async function load(){try{const r=await apiRequest<{data?:MediaItem[]}>("/admin/media");setItems(r.data||[])}catch(e){setMessage(e instanceof Error?e.message:"Unable to load media")}}
  useEffect(()=>{void load()},[]);
  async function upload(file?:File){if(!file)return;setBusy(true);setMessage("");try{const form=new FormData();form.append("image",file);await apiFormRequest(`/admin/media?folder=${encodeURIComponent(folder)}`,form);setMessage("Image uploaded.");await load()}catch(e){setMessage(e instanceof Error?e.message:"Upload failed")}finally{setBusy(false);if(fileRef.current)fileRef.current.value=""}}
  async function remove(item:MediaItem){if(!confirm("Delete this image from media storage?"))return;try{await apiRequest("/admin/media",{method:"DELETE",body:JSON.stringify(item)});setMessage("Image deleted.");await load()}catch(e){setMessage(e instanceof Error?e.message:"Delete failed")}}
  return <section className="admin-crud"><div className="admin-crud-heading"><div><p className="eyebrow">MEDIA</p><h1>Media Library</h1><span>Upload, reuse and remove website images from one place.</span></div><div className="admin-heading-actions"><button className="button button-outline" onClick={()=>void load()}><RefreshCw size={15}/>Refresh</button><button className="button button-primary" disabled={busy} onClick={()=>fileRef.current?.click()}><Upload size={15}/>{busy?"Uploading…":"Upload image"}</button><input ref={fileRef} hidden type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={e=>void upload(e.target.files?.[0])}/></div></div>{message&&<div className="crud-notice">{message}</div>}<label className="media-folder-select">Upload folder<select value={folder} onChange={e=>setFolder(e.target.value)}><option>general</option><option>products</option><option>banners</option><option>articles</option><option>categories</option><option>reviews</option><option>accessories</option><option>maintenance</option></select></label>{items.length?<div className="admin-media-grid">{items.map((item,i)=><article key={item.publicId||`${item.folder}-${item.filename}-${i}`}><img src={item.url} alt={item.filename||"Uploaded media"}/><div><strong>{item.filename||item.publicId?.split("/").pop()||"Image"}</strong><small>{item.folder||item.provider}</small></div><button className="icon-button danger" onClick={()=>void remove(item)} aria-label="Delete media"><Trash2 size={15}/></button></article>)}</div>:<div className="crud-empty"><ImagePlus size={24}/>No uploaded media yet.</div>}</section>;
}
