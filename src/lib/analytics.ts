import { track } from "@vercel/analytics";
import { useEffect, useRef } from "react";

// Custom events for Vercel Web Analytics (src/components/SiteAnalytics.tsx loads it; docs/HANDBOOK.md, "Analytics and
// errors", lists them). Analytics is cookieless, and the properties stay small and never say anything about the
// visitor. A call only queues the event for the analytics script, which sends it in the background, so it never holds
// up a tap — and where the script isn't loaded (developing, an ad blocker, a build run outside Vercel) nothing happens.
type Event = "whatsapp_click" | "add_to_bag" | "favourite" | "search_no_results" | "hint" | "photo_zoom" | "back_in_stock_ask";

export function trackEvent(name: Event, data: Record<string, string>) {
  try {
    track(name, data);
  } catch {}
}

// A search that finds nothing, counted once the visitor has stopped typing for a moment (so "l", "la", "lac" aren't
// each an event) and once per query; the text is cut to 40 characters.
export function useTrackNoResults(query: string, empty: boolean, source: "dialog" | "shop") {
  const last = useRef("");
  useEffect(() => {
    const q = query.trim().toLowerCase().slice(0, 40);
    if (!q || !empty || q === last.current) return;
    const t = setTimeout(() => {
      last.current = q;
      trackEvent("search_no_results", { query: q, source });
    }, 1200);
    return () => clearTimeout(t);
  }, [query, empty, source]);
}
