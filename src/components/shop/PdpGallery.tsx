"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useLayoutEffect, useRef, useState, ViewTransition } from "react";
import { trackEvent } from "@/lib/analytics";
import { useColorChoice } from "@/lib/color-choice";
import { viewName, type ColorKey, type Product } from "@/lib/products";
import { ZoomIn } from "../icons";
import { photoName, photoShare, usePhotoMorph } from "./PhotoMorph";
import { Badges } from "./ProductCard";

// The full-screen viewer is its own chunk, fetched when a shopper reaches for the photo (hover, focus or the first
// touch) rather than with the page, so the page loads no more than it did — and its large photos only once it opens.
const loadViewer = () => import("./PdpViewer");
const PdpViewer = dynamic(loadViewer, { ssr: false });

// The product page gallery: the front view large, the other views (back, side, and up to three more photos) as small
// thumbnails underneath. Choosing a thumbnail cross-fades it into the main frame (and the main view drops down into the
// thumbnails). The main photo opens the views full screen, to zoom into (PdpViewer.tsx).
export default function PdpGallery({ product }: { product: Product }) {
  // the picked colour's photos when that colour has been photographed, otherwise the main colour's
  const color = useColorChoice(product.slug, product.colors[0]) as ColorKey;
  const views = product.colorViews[color] ?? product.views;
  const [active, setActive] = useState(0);
  const [shownColor, setShownColor] = useState(color);
  const [viewing, setViewing] = useState(false);
  const opener = useRef<HTMLButtonElement>(null);
  if (shownColor !== color) {
    setShownColor(color); // a new colour starts on its front view
    setActive(0);
  }
  // While this page is on screen it holds its piece's photo, so going Back carries the main photo to that piece's card
  // (PhotoMorph.tsx); it lets go once the shopper has left. Next keeps a visited page mounted but hidden, and hiding and
  // showing it again runs this cleanup and effect as well.
  const { inHand, hold, release } = usePhotoMorph();
  useEffect(() => {
    hold(product.slug);
    return () => release(product.slug);
  }, [hold, release, product.slug]);
  // React only lets the photo glide to a frame that is on screen when it measures it, and Next scrolls a new page to the
  // top a moment too late for that when the card was tapped far down a page (a best seller, a related piece). So a page
  // opened from a card scrolls itself up first — only when it first opens; Back and Forward keep their own scroll.
  const frame = useRef<HTMLDivElement>(null);
  const opened = useRef(false);
  useLayoutEffect(() => {
    if (opened.current) return;
    opened.current = true;
    const r = frame.current?.getBoundingClientRect();
    if (inHand === product.slug && r && (r.bottom < 0 || r.top > innerHeight)) scrollTo({ top: 0, behavior: "instant" });
  }, [inHand, product.slug]);

  return (
    <div className="pdp-gallery">
      {/* the main frame is the other end of the card photo's glide (ProductCard.tsx) */}
      <ViewTransition name={photoName(product.slug)} share={photoShare} default="none">
        <div className="pdp-main media" ref={frame}>
          {views.map((v, i) => (
            <Image
              key={v.label}
              quality={90}
              src={v.src}
              alt={`${product.name} — ${viewName(v.label)}`}
              fill
              preload={i === 0}
              placeholder="blur"
              sizes="(min-width: 901px) and (max-height: 834px) 300px, (min-width: 901px) calc(56.25vh - 169px), (min-width: 521px) 460px, 90vw"
              className={`pdp-main-img ${i === active ? "is-active" : ""}`}
              aria-hidden={i !== active}
            />
          ))}
          <Badges product={product} />
          {views.length > 1 && (
            <span className="pdp-view" key={active}>
              {views[active].label}
            </span>
          )}
          <button
            ref={opener}
            type="button"
            className="pdp-zoom"
            aria-label={`Open the ${viewName(views[active].label)} full screen`}
            onPointerEnter={loadViewer}
            onFocus={loadViewer}
            onClick={() => {
              setViewing(true);
              trackEvent("photo_zoom", { slug: product.slug });
            }}
          >
            <ZoomIn />
          </button>
        </div>
      </ViewTransition>

      {views.length > 1 && (
        <div className="pdp-thumbs" role="group" aria-label="More views">
          {views.map((v, i) =>
            i === active ? null : (
              <button key={v.label} type="button" className="pdp-thumb" onClick={() => setActive(i)} aria-label={`Show the ${viewName(v.label)}`}>
                <Image quality={75} src={v.src} alt="" fill placeholder="blur" sizes="80px" />
                <span>{v.label}</span>
              </button>
            ),
          )}
        </div>
      )}

      {viewing && (
        <PdpViewer
          name={product.name}
          views={views}
          start={active}
          onClose={(i) => {
            setViewing(false);
            setActive(i); // the page shows the photo the shopper ended on
            opener.current?.focus({ preventScroll: true });
          }}
        />
      )}
    </div>
  );
}
