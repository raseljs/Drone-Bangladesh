"use client";

import { ArrowRight, ChevronLeft, ChevronRight, Headphones, Pause, Play, ShieldCheck, Truck } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import styles from "./hero-banner-slider.module.css";

type Banner = { id?: string; _id?: string; name?: string; title?: string; body?: string; image?: string; sortOrder?: number; data?: Record<string, unknown> | Map<string, unknown> };
const fallback: Banner = {
  id: "enterprise-banner", name: "POWER. PRECISION. PERFORMANCE.",
  title: "Enterprise drone solutions built for serious missions.",
  body: "Discover advanced enterprise drones, professional controllers, and intelligent imaging solutions designed for inspection, mapping, surveying, agriculture, and demanding commercial operations across Bangladesh.",
  image: "/images/enterprise-banner.png",
};
function dataOf(banner: Banner) {
  const data = banner.data instanceof Map ? Object.fromEntries(banner.data) : banner.data || {};
  const read = (key: string, defaultValue: string) => typeof data[key] === "string" && data[key] ? String(data[key]) : defaultValue;
  return read;
}
export default function HeroBannerSlider({ banners }: { banners: Banner[] }) {
  const items = useMemo(() => banners.length ? [...banners].sort((a,b) => Number(a.sortOrder || 0)-Number(b.sortOrder || 0)).map(b => b.title === "Premium drones. Limitless possibilities." ? {...b, ...fallback, id:b.id, _id:b._id, data:b.data} : b) : [fallback], [banners]);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update(); query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    if (items.length < 2 || paused || hovered || focused || reducedMotion) return;
    const timer = window.setInterval(() => setIndex(v => (v+1)%items.length), 6500);
    return () => window.clearInterval(timer);
  }, [items.length, paused, hovered, focused, reducedMotion]);
  const active = index % items.length;
  const move = (step: number) => setIndex(v => (v+step+items.length)%items.length);
  return <section className={styles.banner} aria-label="Drone Bangladesh promotions" aria-roledescription="carousel" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onFocusCapture={() => setFocused(true)} onBlurCapture={e => { if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false); }}>
    <div className={styles.viewport}>
      {items.map((hero, position) => {
        const read = dataOf(hero);
        const title = hero.title || fallback.title!;
        const highlight = read("highlightText", title === fallback.title ? "serious missions." : "");
        const split = highlight && title.endsWith(highlight);
        return <article key={hero._id || hero.id || position} className={styles.slide} hidden={position !== active} aria-label={`${position+1} of ${items.length}`} aria-roledescription="slide">
          <Image className={styles.image} src={hero.image || fallback.image!} alt="" fill sizes="(max-width: 768px) 100vw, 84vw" priority={position === 0} onError={e => { if (e.currentTarget.dataset.fallback) return; e.currentTarget.dataset.fallback = "true"; e.currentTarget.srcset = ""; e.currentTarget.src = fallback.image!; }} />
          <div className={styles.shade} />
          <div className={styles.copy}>
            <p className={styles.eyebrow}>{hero.name || fallback.name}</p>
            <h1 className={styles.title}>{split ? <>{title.slice(0,-highlight.length)}<span>{highlight}</span></> : title}</h1>
            <p className={styles.description}>{hero.body || fallback.body}</p>
            <div className={styles.proof}>
              <span><ShieldCheck/>100% Original Products</span><span><Truck/>Nationwide Delivery</span><span><Headphones/>Expert Support</span>
            </div>
            <div className={styles.actions}>
              <Link className={styles.primary} href={read("primaryUrl", "/products")}>{read("primaryLabel", "Shop now")}<ArrowRight size={20}/></Link>
              <Link className={styles.secondary} href={read("secondaryUrl", "/categories/camera-drone")}>{read("secondaryLabel", "Explore drones")}<ArrowRight size={20}/></Link>
            </div>
          </div>
          <p className={styles.tagline}>INSPIRE A SMARTER TOMORROW</p>
        </article>;
      })}
      {items.length > 1 && <><button className={`${styles.arrow} ${styles.previous}`} onClick={() => move(-1)} aria-label="Previous banner"><ChevronLeft/></button><button className={`${styles.arrow} ${styles.next}`} onClick={() => move(1)} aria-label="Next banner"><ChevronRight/></button></>}
    </div>
    {items.length > 1 && <div className={styles.controls}>{items.map((hero,position) => <button key={hero._id || hero.id || position} className={styles.dot} aria-label={`Show banner ${position+1}`} aria-current={active === position ? "true" : undefined} onClick={() => setIndex(position)}/>)}<button className={styles.pause} onClick={() => setPaused(v => !v)} aria-label={paused ? "Play banners" : "Pause banners"}>{paused ? <Play size={14}/> : <Pause size={14}/>}</button></div>}
  </section>;
}
