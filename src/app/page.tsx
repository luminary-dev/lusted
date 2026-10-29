import type { Metadata } from "next";
import Hero from "@/components/Hero";
import SaleSection from "@/components/SaleSection";
import Collections from "@/components/Collections";
import BestSellers from "@/components/BestSellers";
import AfterDark from "@/components/AfterDark";
import About from "@/components/About";
import SizeGuide from "@/components/SizeGuide";
import HowItWorks from "@/components/HowItWorks";
import Contact from "@/components/Contact";
import JsonLd from "@/components/JsonLd";
import { instagramLink, site } from "@/lib/site";
import { siteUrl } from "@/lib/site-url";

// The description and the share card come from the layout; the home page adds where it is, for local search.
export const metadata: Metadata = {
  title: "Lusted Sri Lanka — Lingerie that doesn’t stay on",
  alternates: { canonical: "/" },
};

// Who the shop is, for search engines: the name, the logo, Instagram and how to reach a person. It sits on the home
// page only — that's where search engines look for it, and every other page would only repeat it. OnlineStore is
// schema.org's (and Google's) kind of Organization for a shop that sells online.
const store = {
  "@context": "https://schema.org",
  "@type": "OnlineStore",
  name: site.name,
  url: siteUrl.toString(),
  logo: new URL("/icon.png", siteUrl).toString(),
  sameAs: [instagramLink],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer service",
    telephone: `+${site.whatsappNumber}`, // the WhatsApp number every order goes to
    email: site.email,
    areaServed: "LK",
  },
};

export default function Home() {
  return (
    <main>
      <JsonLd data={store} />
      <Hero />
      <SaleSection />
      <Collections />
      <BestSellers />
      <AfterDark />
      <SizeGuide />
      <About />
      <HowItWorks />
      <Contact />
    </main>
  );
}
