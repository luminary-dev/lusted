import Link from "next/link";

// A small round arrowhead in the bottom-right corner of a full-bleed section that glides to the next one when tapped.
// It bobs gently so the eye finds it; holds still with reduced motion (globals.css, .scroll-cue).
export default function ScrollCue({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="scroll-cue" aria-label={label}>
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 9l6 6 6-6" />
      </svg>
    </Link>
  );
}
