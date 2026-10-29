"use client";

import { useEffect, useId, useRef, useState } from "react";
import { trackEvent } from "@/lib/analytics";
import { WhatsApp } from "../icons";

// "Drop a hint": lingerie is so often a gift that the shopper's way to say so is to send the piece to whoever might
// buy it. A phone opens its own share sheet; elsewhere a small popover offers WhatsApp and the clipboard. The
// WhatsApp link carries no number — the shopper picks the contact — so it's a share, not a message to the shop, and
// SiteAnalytics leaves it out of `whatsapp_click`; it's counted as `hint` here instead. The message is the copy and
// the shop's own links, never anything about the shopper.
export default function HintButton({
  title,
  text,
  url,
  copy,
  copyLabel = "Copy link",
  source,
}: {
  title: string;
  /** the line that goes with the link(s) */
  text: string;
  /** the one link, when there is one; a list sends its links in `text` */
  url?: string;
  /** what "Copy link" puts on the clipboard */
  copy: string;
  copyLabel?: string;
  source: "product" | "favourites";
}) {
  const [open, setOpen] = useState(false);
  // the popover opens towards the side with room for it, so it never pushes the page sideways on a phone
  const [align, setAlign] = useState<"start" | "end" | "centre">("start");
  const [copied, setCopied] = useState<"" | "yes" | "no">("");
  const wrap = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const first = useRef<HTMLAnchorElement>(null);
  const id = useId();
  const message = url ? `${text}\n${url}` : text;

  function close() {
    setOpen(false);
    setCopied("");
  }

  async function hint() {
    if (open) return close();
    const data = url ? { title, text, url } : { title, text };
    if (typeof navigator.share === "function" && navigator.canShare?.(data) !== false) {
      try {
        await navigator.share(data);
        trackEvent("hint", { source, via: "share" });
        return;
      } catch (e) {
        if ((e as Error).name === "AbortError") return; // the shopper closed the sheet — nothing more to offer
        // anything else (sharing refused here) falls through to the popover, so the hint can still be sent
      }
    }
    const r = trigger.current!.getBoundingClientRect();
    const room = document.documentElement.clientWidth - 16; // the popover is 232px wide, kept 16px off either edge
    setAlign(r.left + 232 <= room ? "start" : r.right - 232 >= 16 ? "end" : "centre");
    setOpen(true);
  }

  // the first choice takes focus when the popover opens; Esc, a tap elsewhere or tabbing away closes it
  useEffect(() => {
    if (!open) return;
    first.current?.focus();
    const shut = () => {
      setOpen(false);
      setCopied("");
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      shut();
      trigger.current?.focus();
    };
    const onDown = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) shut();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  async function copyIt() {
    try {
      await navigator.clipboard.writeText(copy);
      setCopied("yes");
      trackEvent("hint", { source, via: "copy" });
    } catch {
      setCopied("no");
    }
  }

  return (
    <div
      className="hint"
      ref={wrap}
      onBlur={(e) => {
        if (open && e.relatedTarget && !wrap.current?.contains(e.relatedTarget as Node)) close();
      }}
    >
      <button
        type="button"
        className="hint-btn"
        ref={trigger}
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onClick={hint}
      >
        Drop a naughty hint
      </button>
      {open && (
        <div className={`hint-pop is-${align}`} id={id} role="group" aria-label="Drop a hint">
          <a
            ref={first}
            href={`https://wa.me/?text=${encodeURIComponent(message)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              trackEvent("hint", { source, via: "whatsapp" });
              close();
            }}
          >
            <WhatsApp /> Send on WhatsApp
          </a>
          <button type="button" onClick={copyIt}>
            {copied === "yes" ? "Copied — now go tempt them" : copyLabel}
          </button>
          <p className="sr-only" role="status">
            {copied === "yes" ? "Copied to the clipboard" : copied === "no" ? "Couldn’t copy — try WhatsApp instead" : ""}
          </p>
          {copied === "no" && (
            <p className="hint-note" aria-hidden="true">
              Couldn’t copy — try WhatsApp instead.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
