"use client";

import { useEffect, useState } from "react";

// Days · hours · minutes · seconds until the reveal. Renders blank on the server and fills in on the client so the
// numbers never disagree between the two; once the moment has passed it says so.
const units = ["days", "hours", "minutes", "seconds"] as const;

// At zero the page reloads itself after a beat — long enough to read that it's time — so whoever is waiting on it is let
// in without lifting a finger (src/proxy.ts stops showing this page at the same moment). Only once per tab, though: if
// this device's clock runs ahead of the server's, the reload brings the reveal page straight back, and it mustn't go
// round again; the message then asks for a refresh instead. Where sessionStorage can't be used (some private windows)
// there is no way to tell, so it never reloads by itself. Nothing moves in the handover — the message simply holds,
// then the page is replaced — so it is the same with reduced motion.
const RELOADED = "lusted-reveal-reloaded";
const BEAT = 1500;

function split(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { days: Math.floor(s / 86400), hours: Math.floor((s % 86400) / 3600), minutes: Math.floor((s % 3600) / 60), seconds: s % 60 };
}

export default function RevealCountdown({ at }: { at: string }) {
  const [left, setLeft] = useState<ReturnType<typeof split> | null>(null);

  useEffect(() => {
    const target = Date.parse(at);
    const tick = () => setLeft(split(target - Date.now()));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [at]);

  const done = !!left && left.days + left.hours + left.minutes + left.seconds === 0;

  useEffect(() => {
    if (!done) return;
    try {
      if (sessionStorage.getItem(RELOADED) === at) return; // already reloaded once for this moment
    } catch {
      return;
    }
    const t = setTimeout(() => {
      try {
        sessionStorage.setItem(RELOADED, at);
      } catch {
        return;
      }
      window.location.reload();
    }, BEAT);
    return () => clearTimeout(t);
  }, [done, at]);

  if (done) return <p className="reveal-live">The wait’s over. Refresh, and come and get it.</p>;

  return (
    <ol className="reveal-count" aria-label="Time until the reveal">
      {units.map((u) => (
        <li key={u}>
          <span className="reveal-num" suppressHydrationWarning>
            {left ? String(left[u]).padStart(2, "0") : " "}
          </span>
          <span className="reveal-unit">{u}</span>
        </li>
      ))}
    </ol>
  );
}
