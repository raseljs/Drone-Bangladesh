import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeftRight,
  CircleHelp,
  Eye,
  Handshake,
  Headphones,
  MapPinned,
  PackageSearch,
  RotateCcw,
  Sprout,
  Target,
  Factory,
  Plane,
  ShieldCheck,
} from "lucide-react";
import { cmsStaticMetadata } from "@/lib/cms-static-metadata";
import { getContentEntry } from "@/lib/content";
import SeoJsonLd from "@/components/seo-jsonld";
import { breadcrumbJsonLd } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return cmsStaticMetadata(
    "about-us",
    "About Drone Bangladesh",
    "Learn about Drone Bangladesh, our mission, vision, services, drone portfolio and nationwide support for consumer, enterprise and agriculture customers."
  );
}

const quickActions = [
  { href: "/track-order", label: "ORDER OR RETURN\nSTATUS", Icon: ArrowLeftRight },
  { href: "/returns", label: "RETURN FOR\nREFUND REQUEST", Icon: RotateCcw },
  { href: "/contact?topic=map", label: "REPORT A MAP\nERROR", Icon: MapPinned },
  { href: "/contact?topic=missing-map", label: "REPORT A MISSING\nMAP ERROR", Icon: PackageSearch },
  { href: "/contact", label: "GET HELP WITH\nOTHER TOPICS", Icon: Headphones },
];

const values = [
  {
    title: "Mission",
    Icon: Target,
    text: "To become Bangladesh's leading drone solutions provider by delivering authentic products, advanced technology, and exceptional service.",
  },
  {
    title: "Vision",
    Icon: Eye,
    text: "We will be the trusted partner for every drone user in Bangladesh — from agriculture to enterprise, education to inspections.",
  },
  {
    title: "Values",
    Icon: Handshake,
    text: "Commitment, Quality, Innovation, and Customer Focus guide every product, service and support experience we deliver.",
  },
];

const portfolio = [
  {
    title: "Agriculture Drones",
    Icon: Sprout,
    models: ["DJI Agras T30", "DJI Agras T25"],
    usedFor: ["Crop spraying", "Seed scattering", "Large-scale agricultural operations"],
  },
  {
    title: "Enterprise & Industrial Drones",
    Icon: Factory,
    models: ["DJI Matrice 350 RTK", "DJI Matrice 400"],
    usedFor: ["Surveying & mapping", "Inspection", "Security & monitoring", "Government operations"],
  },
  {
    title: "Fixed-Wing Drone Solutions",
    Icon: Plane,
    models: ["JOUAV", "Tericahn"],
    usedFor: ["Long-range mapping", "Large-area surveying", "Industrial and research applications"],
  },
];

const stats = [
  ["50+", "Countries Served"],
  ["100+", "Non-Drone Projects"],
  ["10+", "Years of Industry Excellence"],
  ["150+", "Happy Clients & Partners"],
];

export default async function AboutUsPage() {
  const entry = await getContentEntry("pages", "about-us");
  const intro = entry?.body || "Founded with a commitment to authentic products, expert guidance and dependable after-sales service, Drone Bangladesh has grown into a trusted drone solutions partner for customers across the country.";
  const breadcrumbs = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "About Us", path: "/about-us" },
  ]);

  return (
    <main className="about-reference-page">
      <SeoJsonLd id="about-us-breadcrumb-schema" data={breadcrumbs} />

      <section className="about-ref-hero">
        <div className="page-container about-ref-hero-inner">
          <div className="about-ref-hero-copy">
            <span className="about-ref-kicker">◆ &nbsp; DRONE BANGLADESH</span>
            <h1>Your Trusted Drone<br />Solutions Partner in<br /><em>Bangladesh</em></h1>
            <p>Drone Bangladesh has a team of experts ready to help you choose, operate and support the right drone solution.</p>
          </div>
          <div className="about-ref-hero-visual">
            <img src="/images/about/about-hero.jpg" alt="Drone Bangladesh professional drone solution" />
          </div>
        </div>
      </section>

      <section className="page-container about-ref-actions" aria-label="Customer support shortcuts">
        {quickActions.map(({ href, label, Icon }) => (
          <Link href={href} key={label}>
            <Icon aria-hidden="true" />
            <span>{label.split("\n").map((line) => <span key={line}>{line}</span>)}</span>
          </Link>
        ))}
      </section>

      <section className="page-container about-ref-section about-ref-intro">
        <div className="about-ref-heading">
          <h2>About Us</h2>
          <i />
        </div>
        <p>{intro}</p>
        <p>We serve consumer, enterprise and agriculture customers with original drones, accessories, practical consultation and nationwide support. Our goal is to make advanced aerial technology easier to access, understand and use with confidence.</p>
      </section>

      <section className="page-container about-values-grid">
        {values.map(({ title, Icon, text }) => (
          <article key={title}>
            <span className="about-hex-icon"><Icon /></span>
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </section>

      <section className="page-container about-ref-section">
        <div className="about-ref-heading">
          <h2>Advanced Drone Portfolio</h2>
          <i />
        </div>
        <p className="about-ref-subtitle">We specialize in both consumer and high-performance industrial drone solutions.</p>
        <div className="about-portfolio-grid">
          {portfolio.map(({ title, Icon, models, usedFor }) => (
            <article key={title}>
              <span className="about-round-icon"><Icon /></span>
              <h3>{title}</h3>
              <strong>Models</strong>
              <ul>{models.map((item) => <li key={item}>{item}</li>)}</ul>
              <strong>Used for</strong>
              <ul>{usedFor.map((item) => <li key={item}>{item}</li>)}</ul>
            </article>
          ))}
        </div>
      </section>

      <section className="page-container about-track-record">
        <div className="about-ref-heading">
          <h2>Proven Track Record</h2>
          <i />
        </div>
        <div className="about-stats-grid">
          {stats.map(([value, label]) => <div key={label}><strong>{value}</strong><span>{label}</span></div>)}
        </div>
        <p>Industries we've successfully served:</p>
        <div className="about-industries">
          {[
            "Agriculture",
            "Surveying & Mapping",
            "Media & Production",
            "Infrastructure & Inspection",
          ].map((item) => <span key={item}><ShieldCheck /> {item}</span>)}
        </div>
      </section>

      <section className="page-container about-story-card">
        <div>
          <span>OUR STORY</span>
          <h2>Leading the drone<br />revolution since 2015.</h2>
          <p>Our approach to drone solutions is simple: we focus on authentic products and expert support. Through constant innovation, Drone Bangladesh offers a more reliable and long-lasting approach to aerial technology.</p>
          <strong>— Drone Bangladesh Team</strong>
        </div>
        <img src="/images/about/about-story.jpg" alt="Agriculture drone operation in Bangladesh" loading="lazy" />
      </section>

      <section className="page-container about-community">
        <div className="about-ref-heading">
          <h2>Our community</h2>
          <i />
        </div>
        <p>Loved & trusted by an ever-expanding community.</p>
        <div className="about-community-grid">
          {[1,2,3,4].map((item) => <img key={item} src={`/images/about/community-${item}.jpg`} alt={`Drone Bangladesh community member ${item}`} loading="lazy" />)}
        </div>
      </section>
    </main>
  );
}
