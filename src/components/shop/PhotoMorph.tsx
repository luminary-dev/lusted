"use client";

import {
  addTransitionType,
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  ViewTransition,
} from "react";

// A tapped card's photo glides into the product page's main photo, and back on Back, while the rest of the page fades
// across (React's <ViewTransition>; the CSS is in 01-base.css). Browsers without view transitions simply navigate.
//
// Only two navigations animate, both marked with this transition type: a tap on a card (its links pass it to Next) and
// Back from that piece's page to where the card was tapped. Every other navigation — the nav, the search, the bag, any
// other Back or Forward — has no type, so every class below resolves to "none" and it stays as instant as it was.
export const TRIP = "photo-trip";
const onTrip = (className: string) => ({ [TRIP]: className, default: "none" });

// the view-transition-name and class both ends of the glide use; slugs are kebab-case, so they are valid custom
// identifiers as they are
export const photoName = (slug: string) => `photo-${slug}`;
export const photoShare = onTrip("photo-morph");

type PhotoMorph = {
  inHand: string | null;
  tap: (slug: string) => void;
  hold: (slug: string) => void;
  release: (slug: string) => void;
  land: () => void;
};

const Ctx = createContext<PhotoMorph>({ inHand: null, tap: () => {}, hold: () => {}, release: () => {}, land: () => {} });

export const usePhotoMorph = () => useContext(Ctx);

// Where the shopper was when they tapped a card: kept in that history entry's own state, so Back finds it (and so does a
// reload of the product page followed by Back).
type Mark = { y: number; slug: string };
const MARK = "lustedPhoto";
const markOf = (state: unknown) => (state as { [MARK]?: Mark } | null)?.[MARK];

export default function PhotoMorphProvider({ children }: { children: React.ReactNode }) {
  // A view transition pairs the old and new elements that share a name, so every card naming its photo would send every
  // piece on the page flying into the next page's related rows. Only one piece is "in hand": the card just tapped, then
  // the product page itself while it is on screen (so Back carries its photo home to that piece's card).
  const [inHand, setInHand] = useState<string | null>(null);
  const holding = useRef(inHand);
  useEffect(() => {
    holding.current = inHand;
  }, [inHand]);

  // The return trip. Next keeps the page Back returns to mounted but hidden, and shows it again without rendering it —
  // but React only pairs a card that renders in the navigation that shows it, and Back carries no transition type. So
  // Back to the page the card was tapped on, from that piece's page, first starts a transition of its own (capture runs
  // before the router's listener) that nudges this context and adds the type; while it waits a tick, the router's
  // navigation joins it, and the hidden cards render as their page is shown. That puts the page back a moment after the
  // browser would restore its scroll position, so for that one history entry the browser is told not to
  // (scrollRestoration, set as the card is tapped) and the page restores it itself, before the photo is measured (land,
  // from PageFade). Every other Back and Forward is left as it was: instant, with the browser's own scroll restoration.
  const [turn, setTurn] = useState(0);
  const pending = useRef<(Mark & { url: string }) | null>(null);
  const land = useCallback(() => {
    const mark = pending.current;
    pending.current = null;
    if (mark?.url !== location.href) return; // that page was never shown again (or nothing is waiting)
    scrollTo({ top: mark.y, behavior: "instant" });
    history.scrollRestoration = "auto";
    const state = { ...history.state };
    delete state[MARK];
    history.replaceState(state, "");
  }, []);
  useEffect(() => {
    const onPop = () => {
      const mark = markOf(history.state);
      if (!mark) return;
      pending.current = { ...mark, url: location.href };
      if (mark.slug !== holding.current) return void requestAnimationFrame(land); // nothing to carry home: just the scroll
      startTransition(async () => {
        addTransitionType(TRIP);
        setTurn((t) => t + 1);
        await new Promise((r) => setTimeout(r));
      });
    };
    addEventListener("popstate", onPop, { capture: true });
    // a marked entry arrived at by a full page load (Back after reloading the product page)
    const mark = markOf(history.state);
    if (mark) pending.current = { ...mark, url: location.href };
    land();
    return () => removeEventListener("popstate", onPop, { capture: true });
  }, [land]);

  const tap = useCallback((slug: string) => {
    history.replaceState({ ...history.state, [MARK]: { y: scrollY, slug } }, "");
    history.scrollRestoration = "manual";
    setInHand(slug);
  }, []);
  const hold = useCallback((slug: string) => {
    setInHand(slug);
    // the product page's own entry inherits the tapped page's setting when it is pushed; it keeps the browser's
    if (!markOf(history.state)) history.scrollRestoration = "auto";
  }, []);
  // only the page that still holds it lets go, so a page being left can't clear the next one's hold
  const release = useCallback((slug: string) => setInHand((s) => (s === slug ? null : s)), []);

  const value = useMemo(() => ({ inHand, turn, tap, hold, release, land }), [inHand, turn, tap, hold, release, land]);
  return <Ctx value={value}>{children}</Ctx>;
}

// Wraps the pages a card can be tapped on or lands on: on a trip, the page being left fades out as the next one fades
// in, around the gliding photo.
const pageFade = onTrip("page-fade");
export function PageFade({ children }: { children: React.ReactNode }) {
  const { land } = usePhotoMorph();
  // runs as the page is shown again, inside the navigation and before React measures where the photo lands
  useLayoutEffect(land, [land]);
  return (
    <ViewTransition enter={pageFade} exit={pageFade} default="none">
      {children}
    </ViewTransition>
  );
}
