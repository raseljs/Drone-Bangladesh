"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { BookOpen, Camera, ClipboardList, CreditCard, Heart, Home, KeyRound, MapPin, Package, Star, UserRound, WalletCards } from "lucide-react";
import { apiRequest, getApiBase } from "@/lib/api";
import type { CatalogProduct } from "@/lib/catalog";

type AccountUser = { id?:string; name?:string; email?:string; phone?:string; avatar?:string; role?:string; starPoints?:number; storeCredit?:number };
type OrderRow = { orderNumber:string; total:number; deliveryStatus:string; createdAt:string; paymentStatus?:string };
type Address = { _id?:string; label?:string; recipientName?:string; phone?:string; line1:string; line2?:string; area?:string; city:string; district?:string; postalCode?:string; isDefault?:boolean };
type Quote = { _id?:string; quoteNumber:string; subject:string; status:string; quotedAmount?:number; createdAt:string };
type Wallet = { starPoints:number; storeCredit:number; transactions:Array<{_id?:string;type:string;amount:number;reference?:string;note?:string;createdAt:string}> };

function money(value:number|undefined){return `৳${Number(value||0).toLocaleString("en-BD")}`}

export function AccountSurface(){
  const [user,setUser]=useState<AccountUser|null>(null);
  const [orders,setOrders]=useState<OrderRow[]>([]);
  const [addresses,setAddresses]=useState<Address[]>([]);
  const [quotes,setQuotes]=useState<Quote[]>([]);
  const [wallet,setWallet]=useState<Wallet>({starPoints:0,storeCredit:0,transactions:[]});
  const [wishlist,setWishlist]=useState<CatalogProduct[]>([]);
  const [mode,setMode]=useState<"login"|"register"|"forgot">("login");
  const [message,setMessage]=useState("");
  const [busy,setBusy]=useState(false);

  async function load(){
    if(!getApiBase()) return;
    try{
      const me=await apiRequest<{data?:AccountUser}>("/auth/me");
      const current=me.data||null;
      setUser(current);
      if(current?.role==="customer"){
        const [os,as,qs,ws,wl]=await Promise.all([
          apiRequest<{data?:OrderRow[]}>("/orders/mine"), apiRequest<{data?:Address[]}>("/account/addresses"), apiRequest<{data?:Quote[]}>("/account/quotes"), apiRequest<{data?:Wallet}>("/account/wallet"), apiRequest<{data?:CatalogProduct[]}>("/account/wishlist")
        ]);
        setOrders(os.data||[]); setAddresses(as.data||[]); setQuotes(qs.data||[]); setWallet(ws.data||{starPoints:0,storeCredit:0,transactions:[]}); setWishlist(wl.data||[]);
      }
    }catch{ setUser(null); setOrders([]); }
  }
  useEffect(()=>{void load()},[]);

  async function submit(e:React.FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setMessage("");const form=new FormData(e.currentTarget);try{const path=mode==="login"?"/auth/login":"/auth/register";await apiRequest(path,{method:"POST",body:JSON.stringify({name:form.get("name"),email:form.get("email"),phone:form.get("phone"),password:form.get("password")})});await load();setMessage("Signed in successfully.");}catch(err){setMessage(err instanceof Error?err.message:"Unable to sign in");}finally{setBusy(false)}}
  async function requestPasswordReset(e:React.FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setMessage("");const form=new FormData(e.currentTarget);try{const result=await apiRequest<{message?:string;data?:{resetToken?:string}}>("/auth/forgot-password",{method:"POST",body:JSON.stringify({email:form.get("email")})});setMessage(result.data?.resetToken?`${result.message||"Reset request created"} Development reset token: ${result.data.resetToken}`:(result.message||"Reset request created. Please follow the recovery instructions."));}catch(err){setMessage(err instanceof Error?err.message:"Unable to create reset request");}finally{setBusy(false)}}
  async function logout(){try{await apiRequest("/auth/logout",{method:"POST"})}catch{} if(typeof window!=="undefined")localStorage.removeItem("drone-admin-token");setUser(null);setOrders([])}
  async function updateProfile(e:React.FormEvent<HTMLFormElement>){e.preventDefault();const f=new FormData(e.currentTarget);try{await apiRequest("/account/profile",{method:"PATCH",body:JSON.stringify({name:f.get("name"),phone:f.get("phone")})});setMessage("Profile updated.");await load();}catch(err){setMessage(err instanceof Error?err.message:"Profile update failed")}}
  async function uploadAvatar(file?:File){if(!file)return;setBusy(true);try{const data=new FormData();data.append("avatar",file);await apiRequest("/account/avatar",{method:"POST",body:data});setMessage("Profile photo updated.");await load();}catch(err){setMessage(err instanceof Error?err.message:"Profile photo upload failed")}finally{setBusy(false)}}
  async function changePassword(e:React.FormEvent<HTMLFormElement>){e.preventDefault();const f=new FormData(e.currentTarget);try{await apiRequest("/account/change-password",{method:"POST",body:JSON.stringify({currentPassword:f.get("currentPassword"),newPassword:f.get("newPassword")})});setMessage("Password changed successfully.");e.currentTarget.reset();}catch(err){setMessage(err instanceof Error?err.message:"Password change failed")}}
  async function addAddress(e:React.FormEvent<HTMLFormElement>){e.preventDefault();const f=new FormData(e.currentTarget);try{await apiRequest("/account/addresses",{method:"POST",body:JSON.stringify(Object.fromEntries(f.entries()))});setMessage("Address saved.");e.currentTarget.reset();await load();}catch(err){setMessage(err instanceof Error?err.message:"Address save failed")}}
  async function removeAddress(id:string){try{await apiRequest(`/account/addresses/${id}`,{method:"DELETE"});await load();}catch(err){setMessage(err instanceof Error?err.message:"Unable to remove address")}}
  async function createQuote(e:React.FormEvent<HTMLFormElement>){e.preventDefault();const f=new FormData(e.currentTarget);try{await apiRequest("/account/quotes",{method:"POST",body:JSON.stringify({subject:f.get("subject"),message:f.get("message")})});setMessage("Quote request submitted.");e.currentTarget.reset();await load();}catch(err){setMessage(err instanceof Error?err.message:"Quote request failed")}}

  if(!user) return <main><section className="content-hero"><div className="page-container"><p>MY ACCOUNT</p><h1>Customer account</h1><span>Sign in to manage orders, addresses, wishlist and profile.</span></div></section><section className="page-container customer-account-grid">{mode==="forgot"?<form className="customer-card account-form" onSubmit={requestPasswordReset}><h2>Forgot password</h2><p>Enter the email used for your Drone Bangladesh account. A recovery request will be created.</p><label>Email<input name="email" type="email" required/></label>{message&&<p className="crud-notice">{message}</p>}<button className="button button-red" type="submit" disabled={busy}>{busy?"Please wait…":"Request password reset"}</button><button type="button" className="text-button" onClick={()=>{setMode("login");setMessage("")}}>Back to sign in</button></form>:<form className="customer-card account-form" onSubmit={submit}><h2>{mode==="login"?"Sign in":"Create account"}</h2>{mode==="register"&&<><label>Name<input name="name" required/></label><label>Phone<input name="phone" placeholder="01XXXXXXXXX"/></label></>}<label>Email<input name="email" type="email" required/></label><label>Password<input name="password" type="password" minLength={8} required/></label>{message&&<p className="crud-notice">{message}</p>}<button className="button button-red" type="submit" disabled={busy}>{busy?"Please wait…":mode==="login"?"Sign in":"Register"}</button>{mode==="login"&&<button type="button" className="text-button" onClick={()=>{setMode("forgot");setMessage("")}}>Forgot password?</button>}<button type="button" className="text-button" onClick={()=>{setMode(mode==="login"?"register":"login");setMessage("")}}>{mode==="login"?"Create a new account":"Already have an account? Sign in"}</button></form>}</section></main>;

  const cards=[
    {label:"Orders",icon:<Package/>,href:"#orders"},
    {label:"Quote",icon:<ClipboardList/>,href:"#quotes"},
    {label:"Edit Profile",icon:<UserRound/>,href:"#profile"},
    {label:"Change Password",icon:<KeyRound/>,href:"#password"},
    {label:"Addresses",icon:<BookOpen/>,href:"#addresses"},
    {label:"Wish List",icon:<Heart/>,href:"/wishlist"},
    {label:"Star Points",icon:<Star/>,href:"#wallet"},
    {label:"Your Transactions",icon:<WalletCards/>,href:"#transactions",className:"account-card-transactions"},
  ];

  return <main className="account-dashboard-page">
    <section className="page-container account-breadcrumb"><Home size={17}/><span>/</span><b>Account</b></section>
    <section className="page-container account-profile-head">
      <div className="account-person">
        <div className="account-avatar-wrap">{user.avatar?<img src={user.avatar} alt={`${user.name||"Customer"} profile`}/>:<span className="account-avatar-fallback"><UserRound/></span>}<label className="account-avatar-upload" title="Change profile photo"><Camera size={14}/><input type="file" accept="image/*" onChange={(e)=>void uploadAvatar(e.target.files?.[0])}/></label></div>
        <div><span>Hello,</span><h1>{user.name||"Customer"}</h1><small>{user.email}</small></div>
      </div>
      <div className="account-balance"><div><span>Star Points</span><strong>{wallet.starPoints||0}</strong></div><div><span>Store Credit</span><strong>{Number(wallet.storeCredit||0).toLocaleString("en-BD")}</strong></div><button className="account-signout" onClick={()=>void logout()}>Sign out</button></div>
    </section>
    {message&&<div className="page-container crud-notice">{message}</div>}
    <section className="page-container account-action-grid">{cards.map(card=><Link key={card.label} href={card.href} className={`account-action-card ${card.className||""}`}><span>{card.icon}</span><strong>{card.label}</strong></Link>)}</section>

    <section className="page-container account-detail-grid"><article className="customer-card" id="profile"><h2>Edit Profile</h2><form className="account-form" onSubmit={updateProfile}><label>Name<input name="name" defaultValue={user.name}/></label><label>Phone<input name="phone" defaultValue={user.phone}/></label><label>Profile photo<input type="file" accept="image/*" onChange={(e)=>void uploadAvatar(e.target.files?.[0])}/></label><button className="button button-primary">Save profile</button></form></article><article className="customer-card" id="password"><h2>Change Password</h2><form className="account-form" onSubmit={changePassword}><label>Current password<input name="currentPassword" type="password" required/></label><label>New password<input name="newPassword" type="password" minLength={8} required/></label><button className="button button-primary">Change password</button></form></article></section>
    <section className="page-container customer-card" id="addresses"><h2>Addresses</h2><div className="address-grid">{addresses.map(a=><article className="address-card" key={a._id}><strong>{a.label||"Address"}{a.isDefault&&" · Default"}</strong><p>{a.line1}{a.line2?`, ${a.line2}`:""}</p><p>{[a.area,a.city,a.district,a.postalCode].filter(Boolean).join(", ")}</p><small>{a.phone}</small>{a._id&&<button className="text-button" onClick={()=>void removeAddress(a._id!)}>Remove</button>}</article>)}</div><form className="address-form" onSubmit={addAddress}><input name="label" placeholder="Home / Office"/><input name="recipientName" placeholder="Recipient name"/><input name="phone" placeholder="01XXXXXXXXX"/><input name="line1" placeholder="House / Road / Flat / Building" required/><input name="area" placeholder="Upazila / Thana"/><input name="city" placeholder="District / City" required/><button className="button button-primary">Add address</button></form></section>
    <section className="page-container account-detail-grid"><article className="customer-card customer-orders" id="orders"><h2>Your Orders</h2>{orders.length?orders.map(o=><div className="customer-order-row" key={o.orderNumber}><div><Link href={`/track-order?order=${encodeURIComponent(o.orderNumber)}`}><strong>{o.orderNumber}</strong></Link><small>{new Date(o.createdAt).toLocaleDateString()}</small></div><span>{o.deliveryStatus.replaceAll("_"," ")}</span><strong>{money(o.total)}</strong><Link className="text-button" href={`/account/orders/${encodeURIComponent(o.orderNumber)}`}>Invoice</Link></div>):<p>No orders yet.</p>}</article><article className="customer-card" id="quotes"><h2>Quote Requests</h2><form className="account-form" onSubmit={createQuote}><label>Subject<input name="subject" required placeholder="Bulk order / enterprise / product quote"/></label><label>Message<textarea name="message" required rows={4}/></label><button className="button button-primary">Request quote</button></form>{quotes.slice(0,4).map(q=><p key={q.quoteNumber}><strong>{q.quoteNumber}</strong> · {q.status}{q.quotedAmount?` · ${money(q.quotedAmount)}`:""}</p>)}</article></section>
    <section className="page-container account-detail-grid"><article className="customer-card" id="wallet"><h2>Star Points & Store Credit</h2><div className="wallet-big"><div><Star/><strong>{wallet.starPoints||0}</strong><span>Star Points</span></div><div><CreditCard/><strong>{money(wallet.storeCredit)}</strong><span>Store Credit</span></div></div><Link className="text-button" href="/account/returns">Returns & Refunds</Link></article><article className="customer-card" id="transactions"><h2>Your Transactions</h2>{wallet.transactions.length?wallet.transactions.slice().reverse().slice(0,12).map(t=><div className="transaction-row" key={t._id||`${t.type}-${t.createdAt}`}><span>{t.type.replaceAll("_"," ")}</span><strong>{t.amount}</strong><small>{t.reference||t.note||new Date(t.createdAt).toLocaleDateString()}</small></div>):<p>No transactions yet.</p>}</article></section>
  </main>;
}

export function WishlistSurface(){
  const [items,setItems]=useState<CatalogProduct[]>([]);const [online,setOnline]=useState(false);
  useEffect(()=>{(async()=>{if(getApiBase()){try{const r=await apiRequest<{data?:CatalogProduct[]}>("/account/wishlist");setItems(r.data||[]);setOnline(true);return;}catch{}}try{setItems(JSON.parse(localStorage.getItem("drone-bangladesh-wishlist")||"[]"))}catch{}})()},[]);
  async function remove(slug:string){if(online){try{await apiRequest(`/account/wishlist/${slug}`,{method:"DELETE"})}catch{}}const next=items.filter(x=>x.slug!==slug);setItems(next);if(!online)localStorage.setItem("drone-bangladesh-wishlist",JSON.stringify(next));window.dispatchEvent(new Event("drone-wishlist-updated"));}
  return <main><section className="content-hero"><div className="page-container"><p>WISHLIST</p><h1>Saved products</h1><span>Keep products you are considering in one place.</span></div></section><section className="page-container simple-surface">{items.length?<div className="wishlist-grid">{items.map(item=><article className="wishlist-row" key={item.slug}><img src={item.image} alt={item.name}/><div><Link href={`/products/${item.slug}`}><strong>{item.name}</strong></Link><p>{money(item.price)}</p></div><button className="button button-outline" onClick={()=>void remove(item.slug)}>Remove</button></article>)}</div>:<><h2>Your wishlist is empty.</h2><p>Use the heart button on a product card to save an item.</p><Link href="/products" className="button button-primary">Browse products</Link></>}</section></main>;
}

type TrackResult={orderNumber:string;deliveryStatus:string;paymentStatus:string;paymentMethod?:string;total:number;subtotal?:number;discount?:number;deliveryCharge?:number;createdAt:string;customer?:{name?:string;phone?:string};shippingAddress?:Record<string,string>;items?:Array<{slug:string;name:string;image?:string;price:number;quantity:number}>;statusHistory?:Array<{status:string;note?:string;at:string}>;courierPartner?:string;trackingId?:string;estimatedDelivery?:string};
const steps=["confirmed","processing","packed","shipped","out_for_delivery","delivered"];
export function TrackOrderSurface(){
  const params=useSearchParams(); const initialOrder=params.get("order")||""; const initialPhone=params.get("phone")||"";
  const [result,setResult]=useState<TrackResult|null>(null);const [error,setError]=useState("");
  async function submit(e:React.FormEvent<HTMLFormElement>){e.preventDefault();setError("");setResult(null);const f=new FormData(e.currentTarget);const order=String(f.get("order")||"").trim();const phone=String(f.get("phone")||"").trim();if(!getApiBase()){setError("Order tracking needs the backend API.");return;}try{const res=await apiRequest<{data?:TrackResult}>(`/orders/track/${encodeURIComponent(order)}?phone=${encodeURIComponent(phone)}`);setResult(res.data||null)}catch(err){setError(err instanceof Error?err.message:"Order not found")}}
  const currentIndex=result?steps.indexOf(result.deliveryStatus):-1;
  return <main><section className="page-container tracking-page"><p className="breadcrumbs">Home / Track Order</p><h1>Track Your Order</h1><form className="tracking-search" onSubmit={submit}><label>Order ID<input name="order" defaultValue={initialOrder} placeholder="DB-25874" required/></label><label>Phone Number<input name="phone" defaultValue={initialPhone} placeholder="01712-345678" required/></label><button className="button button-red">Track Order</button></form>{error&&<div className="crud-error">{error}</div>}{result&&<div className="tracking-layout"><div className="tracking-main"><section className="tracking-card"><h2>Order Status</h2><div className="tracking-steps">{steps.map((step,i)=><div className={`tracking-step ${i<=currentIndex?"done":""} ${i===currentIndex?"current":""}`} key={step}><span>{i+1}</span><strong>{step.replaceAll("_"," ")}</strong><small>{result.statusHistory?.find(h=>h.status===step)?.at?new Date(result.statusHistory.find(h=>h.status===step)!.at).toLocaleString():"—"}</small></div>)}</div></section><section className="tracking-card order-info-grid"><div><strong>Order No.</strong><span>{result.orderNumber}</span></div><div><strong>Date</strong><span>{new Date(result.createdAt).toLocaleString()}</span></div><div><strong>Payment</strong><span>{result.paymentMethod?.replaceAll("_"," ")||result.paymentStatus}</span></div><div><strong>Courier</strong><span>{result.courierPartner||"Courier Delivery"}</span></div><div><strong>Tracking ID</strong><span>{result.trackingId||"Will be assigned"}</span></div><div><strong>Estimated Delivery</strong><span>{result.estimatedDelivery||"To be confirmed"}</span></div></section><div className="tracking-two"><section className="tracking-card"><h2><MapPin/> Shipping Address</h2><strong>{result.customer?.name}</strong><p>{[result.shippingAddress?.line1,result.shippingAddress?.area,result.shippingAddress?.city,result.shippingAddress?.district,result.shippingAddress?.postalCode].filter(Boolean).join(", ")}</p><small>{result.customer?.phone}</small></section><section className="tracking-card"><h2>Ordered Products</h2>{result.items?.map(item=><div className="tracking-product" key={item.slug}><img src={item.image||"/images/products/mini-5.jpg"} alt=""/><span>{item.name}</span><b>{item.quantity}</b><strong>{money(item.price*item.quantity)}</strong></div>)}</section></div></div><aside className="tracking-side"><section className="tracking-card"><h2>Current Status</h2><strong className="tracking-current">{result.deliveryStatus.replaceAll("_"," ")}</strong><p>Your order is being handled through Courier Delivery.</p></section><section className="tracking-card"><h2>Delivery Timeline</h2>{(result.statusHistory||[]).map((h,i)=><div className="timeline-row" key={`${h.status}-${i}`}><i/><span><strong>{h.status.replaceAll("_"," ")}</strong><small>{new Date(h.at).toLocaleString()}</small></span></div>)}</section><section className="tracking-card tracking-total"><h2>Order Total</h2><p><span>Subtotal</span><b>{money(result.subtotal)}</b></p>{result.discount? <p><span>Discount</span><b>-{money(result.discount)}</b></p>:null}<p><span>Delivery Charge</span><b>{money(result.deliveryCharge)}</b></p><p className="grand"><span>Total</span><b>{money(result.total)}</b></p></section></aside></div>}</section></main>;
}
