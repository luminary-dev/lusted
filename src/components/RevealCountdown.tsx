"use client";

import { useEffect, useState } from "react";

// Days · hours · minutes · seconds until the reveal. Renders blank on the server and fills in on the client so the
// numbers never disagree between the two; once the moment has passed it says so.
const units = ["days", "hours", "minutes", "seconds"] as const;

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

  const done = left && left.days + left.hours + left.minutes + left.seconds === 0;
  if (done) return <p className="reveal-live">It’s time. Refresh, and come in.</p>;

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
