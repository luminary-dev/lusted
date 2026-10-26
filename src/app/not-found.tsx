import type { Metadata } from "next";
import { getImageProps } from "next/image";
import Link from "next/link";
import { ArrowRight } from "@/components/icons";
import { img } from "@/lib/cdn";

export const metadata: Metadata = {
  title: "Nothing on here — Lusted",
};

// Any address that isn't a page — and any piece no longer in the catalogue (src/proxy.ts sends those here with a
// 404). The one page where the site is allowed to be as forward as it likes: whoever lands here was looking for
// something, and the photo is the wrong hotel-room door, opened. The two models hold the right of the wide photo, so
// the words sit on the dark wall at the left; phones and portrait tablets (up to 900 px) get a 3:4 cut centred on the
// models with the words over the bottom. Both go through next/image's optimiser as a <picture>, like the "How it works" slides.
const wide = img("images/404/the-wrong-room.webp");
const phone = img("images/404/the-wrong-room-phone.webp");
const alt =
  "Two models caught in the doorway of a candlelit hotel suite at night, one in a wine lace set and stockings looking back over her shoulder, the other laughing on the bed in a black satin slip";

function LostPicture() {
  const { props: narrow } = getImageProps({ alt, fill: true, quality: 90, placeholder: "empty", src: phone, sizes: "100vw" });
  const { props: full } = getImageProps({ alt, fill: true, quality: 90, placeholder: "blur", preload: true, src: wide, sizes: "100vw" });
  return (
    <picture>
      <source media="(max-width: 900px)" srcSet={narrow.srcSet} sizes={narrow.sizes} />
      <img {...full} alt={alt} />
    </picture>
  );
}

export default function NotFound() {
  return (
    <main className="lost">
      <div className="lost-photo" aria-hidden="true">
        <LostPicture />
      </div>
      <div className="container lost-inner">
        <div className="lost-copy">
          <p className="lost-code" aria-hidden="true">
            404
          </p>
          <p className="eyebrow lost-eyebrow" data-reveal>
            Page not found<span className="lost-eyebrow-more"> · nothing on underneath</span>
          </p>
          <h1 className="h1 lost-title" data-reveal style={{ "--d": "0.1s" } as React.CSSProperties}>
            Caught you looking, <em>you naughty thing</em>
          </h1>
          <div className="lost-lede" data-reveal style={{ "--d": "0.2s" } as React.CSSProperties}>
            <p>There’s nothing under this one. We took it all off.</p>
            <p>Whatever you came for, we have something wickeder — lace that doesn’t stay on, strings that barely try.</p>
            <p className="lost-invite">Come and get undressed.</p>
          </div>
          <div className="lost-actions" data-reveal style={{ "--d": "0.3s" } as React.CSSProperties}>
            <Link href="/products" className="btn btn-light">
              Show me everything <ArrowRight className="arrow" />
            </Link>
            <Link href="/" className="lost-home">
              Take me back to bed
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
