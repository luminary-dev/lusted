"use client";

// The small round arrowhead in the bottom-right corner of a full-bleed slideshow: tapping it moves that slideshow on
// to its next photo (and restarts its timer). It talks to the slideshow through a DOM event so the section around it
// can stay a server component. Bobs gently so the eye finds it; holds still with reduced motion (globals.css, .slide-cue).
export const NEXT_SLIDE_EVENT = "lusted:next-slide";

export default function SlideCue({ band, label }: { band: string; label: string }) {
  return (
    <button
      type="button"
      className="slide-cue"
      aria-label={label}
      onClick={() => window.dispatchEvent(new CustomEvent(NEXT_SLIDE_EVENT, { detail: band }))}
    >
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 6l6 6-6 6" />
      </svg>
    </button>
  );
}

/** Listens for the cue's event for one band; returns a disposer. Used by the slideshows. */
export function onNextSlide(band: string, advance: () => void) {
  const handler = (e: Event) => {
    if ((e as CustomEvent<string>).detail === band) advance();
  };
  window.addEventListener(NEXT_SLIDE_EVENT, handler);
  return () => window.removeEventListener(NEXT_SLIDE_EVENT, handler);
}
