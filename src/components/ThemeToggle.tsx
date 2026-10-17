"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "./icons";

type Theme = "light" | "dark";

// The initial theme is applied before paint by the inline script in layout.tsx;
// this switch reads it from <html data-theme>, flips it and remembers the choice.
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

const getTheme = (): Theme => (document.documentElement.dataset.theme === "dark" ? "dark" : "light");

export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getTheme, () => null);

  // The new mood blooms out from the switch: a soft-edged circle of it spreads across the screen while the old one
  // melts into a warm blur underneath (View Transitions; a plain colour fade where those aren't supported).
  function toggle(e: React.MouseEvent<HTMLButtonElement>) {
    const root = document.documentElement;
    const next: Theme = getTheme() === "dark" ? "light" : "dark";
    const apply = () => {
      root.dataset.theme = next;
      try {
        localStorage.setItem("lusted-theme", next);
      } catch {}
    };
    if (!document.startViewTransition || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return apply();
    const r = e.currentTarget.getBoundingClientRect();
    const x = r.left + r.width / 2,
      y = r.top + r.height / 2;
    root.style.setProperty("--vt-x", `${x}px`);
    root.style.setProperty("--vt-y", `${y}px`);
    // far enough to cover the furthest corner, plus the feathered edge
    root.style.setProperty("--vt-r", `${Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)) + 260}px`);
    root.classList.add("theme-shifting");
    document.startViewTransition(apply).finished.finally(() => root.classList.remove("theme-shifting"));
  }

  const dark = theme === "dark";
  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label="Dark mode"
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="theme-switch"
      onClick={toggle}
    >
      <span className="theme-switch-knob">
        <Sun className="theme-sun" />
        <Moon className="theme-moon" />
      </span>
    </button>
  );
}
