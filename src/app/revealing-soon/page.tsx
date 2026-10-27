import type { Metadata } from "next";
import Image, { getImageProps } from "next/image";
import wordmark from "@/assets/brand/wordmark-glossy-rosegold.png";
import Newsletter from "@/components/Newsletter";
import RevealCountdown from "@/components/RevealCountdown";
import { ArrowRight, Instagram, WhatsApp } from "@/components/icons";
import { instagramLink, site, whatsappLink } from "@/lib/site";
import { img } from "@/lib/cdn";

// The three of them — the swim, the dress, the lingerie — on the penthouse terrace at 3 am, one photo per screen shape
// (about-wall/reveal-three-prompt.txt): a tall cut for phones, a 4:3 cut for tablets, the wide one everywhere else.
// All three go through next/image's optimiser as one <picture>, like the "How it works" slides.
const wide = img("images/reveal/three-wide.webp");
const tablet = img("images/reveal/three-tablet.webp");
const phone = img("images/reveal/three-phone.webp");

function RevealPicture() {
  const common = { alt: "", fill: true as const, quality: 90, sizes: "100vw", className: "reveal-bg" };
  const { props: narrow } = getImageProps({ ...common, placeholder: "empty", src: phone });
  const { props: mid } = getImageProps({ ...common, placeholder: "empty", src: tablet });
  const { props: full } = getImageProps({ ...common, placeholder: "blur", preload: true, src: wide });
  return (
    <picture>
      <source media="(max-width: 600px)" srcSet={narrow.srcSet} sizes={narrow.sizes} />
      <source media="(max-width: 1100px)" srcSet={mid.srcSet} sizes={mid.sizes} />
      <img {...full} alt="" />
    </picture>
  );
}

export const metadata: Metadata = {
  title: "Lusted — Revealing soon",
  description: "Something is being unwrapped. Lingerie, swim and after dark — made to tempt, cut to come off, sent so no one knows. Revealing 1 November.",
  openGraph: { title: "Lusted — Revealing soon", description: "Something is being unwrapped. Revealing 1 November." },
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

// The page the whole site shows until reveal day (see src/proxy.ts): the glossy wordmark over the three of them on the
// terrace, the countdown, and three ways to be first — WhatsApp early access, Instagram and the newsletter.
export default function RevealingSoon() {
  return (
    <main className="reveal">
      <RevealPicture />
      <div className="reveal-inner">
        <Image src={wordmark} alt="Lusted Lingerie" className="reveal-logo" priority sizes="(max-width: 600px) 72vw, 420px" />
        <p className="eyebrow reveal-eyebrow">Something is being unwrapped</p>
        <h1 className="h1 reveal-title">
          Revealing <em>soon.</em>
        </h1>
        <p className="reveal-lede">Lingerie, swim and after dark — made to tempt, cut to come off, sent so no one knows. Plain box, private ordering, a real person on the other end who won’t blush.</p>

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
          <p className="reveal-news-title">Or leave your email — we’ll whisper when it’s time to come in.</p>
          <Newsletter />
        </div>
      </div>
    </main>
  );
}
