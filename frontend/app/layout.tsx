import type { Metadata } from "next";
import "./globals.css";
import SiteShell from "@/components/site-shell";
import SeoJsonLd from "@/components/seo-jsonld";
import { DEFAULT_OG_IMAGE, FACEBOOK_URL, SITE_DESCRIPTION, SITE_NAME, YOUTUBE_URL, absoluteUrl, siteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: "Drone Bangladesh | Drones, Cameras & Accessories", template: "%s | Drone Bangladesh" },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  category: "E-commerce",
  creator: SITE_NAME,
  publisher: SITE_NAME,
  icons: { icon: "/favicon.png", shortcut: "/favicon.png", apple: "/apple-touch-icon.png" },
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: siteUrl(),
    siteName: SITE_NAME,
    type: "website",
    locale: "en_BD",
    images: [{ url: DEFAULT_OG_IMAGE, alt: "Drone Bangladesh drones, cameras and accessories" }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
  robots: { index: true, follow: true },
};

const organization = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${siteUrl()}/#organization`,
  name: SITE_NAME,
  url: siteUrl(),
  logo: absoluteUrl("/images/logo/drone-bangladesh.png"),
  image: absoluteUrl(DEFAULT_OG_IMAGE),
  sameAs: [FACEBOOK_URL, YOUTUBE_URL],
  contactPoint: [{
    "@type": "ContactPoint",
    telephone: "+880-1896-123434",
    contactType: "customer support",
    areaServed: "BD",
    availableLanguage: ["English", "Bengali"],
  }],
};

const localBusiness = {
  "@context": "https://schema.org",
  "@type": "Store",
  "@id": `${siteUrl()}/#store`,
  name: SITE_NAME,
  url: siteUrl(),
  image: absoluteUrl(DEFAULT_OG_IMAGE),
  telephone: "+880-1896-123434",
  email: "dronebangladesh567@gmail.com",
  priceRange: "৳৳",
  currenciesAccepted: "BDT",
  paymentAccepted: "Cash on Delivery, Card, Mobile Financial Service",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Level-1, Block-B, Shop-45, Bashundhara City Shopping Complex",
    addressLocality: "Dhaka",
    postalCode: "1215",
    addressCountry: "BD",
  },
  areaServed: { "@type": "Country", name: "Bangladesh" },
  parentOrganization: { "@id": `${siteUrl()}/#organization` },
  sameAs: [FACEBOOK_URL, YOUTUBE_URL],
};

const webSite = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${siteUrl()}/#website`,
  url: siteUrl(),
  name: SITE_NAME,
  publisher: { "@id": `${siteUrl()}/#organization` },
  potentialAction: {
    "@type": "SearchAction",
    target: `${siteUrl()}/search?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-BD" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <SeoJsonLd id="drone-bangladesh-global-schema" data={[organization, localBusiness, webSite]} />
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
