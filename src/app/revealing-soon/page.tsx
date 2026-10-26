import type { Metadata } from "next";
import Image from "next/image";
const group = img("images/reveal/group.webp");
import wordmark from "@/assets/brand/wordmark-glossy-rosegold.png";
import Newsletter from "@/components/Newsletter";
import RevealCountdown from "@/components/RevealCountdown";
import { ArrowRight, Instagram, WhatsApp } from "@/components/icons";
import { instagramLink, site, whatsappLink } from "@/lib/site";
import { img } from "@/lib/cdn";

export const metadata: Metadata = {
  title: "Lusted — Revealing soon",
  description: "Something is being wrapped. Lingerie, swim and after dark — made to tempt, sent to be our secret. Revealing 1 November.",
  openGraph: { title: "Lusted — Revealing soon", description: "Something is being wrapped. Revealing 1 November." },
  // a teaser, not a page to be found by: until reveal day it stands in for every URL, and those shouldn't be indexed
  // as copies of it; afterwards /revealing-soon itself stays out of search results
  robots: { index: false, follow: true },
};

const revealDate = new Date(site.revealAt).toLocaleString("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: "Asia/Colombo",
});

// The page the whole site shows until reveal day (see src/proxy.ts): the glossy wordmark over the campaign group on the
// candlelit velvet chaise, the countdown, and three ways to be first — WhatsApp early access, Instagram and the newsletter.
export default function RevealingSoon() {
  return (
    <main className="reveal">
      <Image quality={90} src={group} alt="" fill preload placeholder="blur" sizes="100vw" className="reveal-bg" />
      <div className="reveal-inner">
        <Image src={wordmark} alt="Lusted Lingerie" className="reveal-logo" priority sizes="(max-width: 600px) 72vw, 420px" />
        <p className="eyebrow reveal-eyebrow">Something is being wrapped</p>
        <h1 className="h1 reveal-title">
          Revealing <em>soon.</em>
        </h1>
        <p className="reveal-lede">Lingerie, swim and after dark — made to tempt, sent to be our secret. Plain box, private ordering, a real person on the other end.</p>

        <RevealCountdown at={site.revealAt} />
        <p className="reveal-date">{revealDate}</p>

        <div className="reveal-actions">
          <a className="btn btn-light" href={whatsappLink("Hi Lusted! Put me on the early-access list.")} target="_blank" rel="noopener noreferrer">
            <WhatsApp /> Want it first? Message us <ArrowRight className="arrow" />
          </a>
          <a className="reveal-ig" href={instagramLink} target="_blank" rel="noopener noreferrer">
            <Instagram /> @{site.instagramHandle}
          </a>
        </div>

        <div className="reveal-news">
          <p className="reveal-news-title">Or leave your email — we’ll whisper when it’s time.</p>
          <Newsletter />
        </div>
      </div>
    </main>
  );
}
