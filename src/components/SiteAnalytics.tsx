"use client";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";
import { whatsappLink } from "@/lib/site";

// Vercel Web Analytics (visits, cookieless) and Speed Insights (how fast pages load for real visitors), both served
// from the site's own origin (/_vercel/*), so the content security policy needs nothing new. Not while developing:
// there the packages load a debug script from Vercel's own host, which the policy would refuse.
//
// Orders happen on WhatsApp, so every tap on a wa.me link to the shop is counted as `whatsapp_click`, with the entry
// point it came from: the nearest `data-wa-source` on the link or around it (the hero, the bag, a product page…), otherwise the
// page's path. One listener here rather than a handler on every link, most of which are in server components. It
// only listens — it never stops or cancels the event — so the link opens the chat in its new tab as it always did.
// "Drop a hint" (HintButton.tsx) links to wa.me with no number, for a chat with someone else, so the shop's number is
// part of the match: that share is no lead for the shop, and is counted as `hint` instead.
export default function SiteAnalytics() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.type === "auxclick" && e.button !== 1) return; // a middle click opens the link too; a right click doesn't
      const link = (e.target as Element | null)?.closest?.(`a[href^="${whatsappLink()}"]`);
      if (!link) return;
      const source = link.closest<HTMLElement>("[data-wa-source]")?.dataset.waSource ?? location.pathname;
      // counted once the click has run its course: a link's own handler may still cancel it (the product page's asks
      // for a size first), and then no chat opened
      setTimeout(() => {
        if (!e.defaultPrevented) trackEvent("whatsapp_click", { source });
      });
    };
    document.addEventListener("click", onClick, true);
    document.addEventListener("auxclick", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("auxclick", onClick, true);
    };
  }, []);

  if (process.env.NODE_ENV === "development") return null;
  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
}
