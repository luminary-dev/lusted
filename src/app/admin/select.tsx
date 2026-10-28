"use client";

import { useEffect, useId, useRef, useState } from "react";

// The console's own dropdown: a button that shows the choice with a thin chevron, and a list of our own underneath
// it, instead of the browser's. Keyboard like a native select: arrows move, Enter and Space choose, Escape closes,
// typing a letter jumps. Closes on a click anywhere else.

export type Option = { value: string; label: string };

export function Select({
  value,
  options,
  onChange,
  label,
  size = "field",
  className = "",
}: {
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  label: string;
  size?: "field" | "row" | "dim" | "big";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(() => Math.max(0, options.findIndex((o) => o.value === value)));
  const root = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const id = useId();
  const current = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", away);
    return () => document.removeEventListener("mousedown", away);
  }, [open]);

  useEffect(() => {
    if (open) list.current?.querySelector<HTMLElement>(`[data-i="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  const choose = (i: number) => {
    const o = options[i];
    if (!o) return;
    onChange(o.value);
    setOpen(false);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      setActive((i) => Math.min(options.length - 1, Math.max(0, i + (e.key === "ArrowDown" ? 1 : -1))));
      return;
    }
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (open) choose(active);
      else setOpen(true);
      return;
    }
    if (e.key.length === 1 && /\S/.test(e.key)) {
      const k = e.key.toLowerCase();
      const from = open ? active + 1 : 0;
      const i = [...options.slice(from), ...options.slice(0, from)].findIndex((o) => o.label.toLowerCase().startsWith(k));
      if (i >= 0) {
        const j = (from + i) % options.length;
        if (open) setActive(j);
        else choose(j);
      }
    }
  };

  return (
    <div ref={root} className={`adm-select is-${size} ${open ? "is-open" : ""} ${className}`}>
      <button
        type="button"
        className="adm-select-btn"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-label={label}
        onClick={() => {
          setActive(Math.max(0, options.findIndex((o) => o.value === value)));
          setOpen((v) => !v);
        }}
        onKeyDown={onKey}
      >
        <span className="adm-select-value">{current?.label ?? ""}</span>
        <span className="adm-select-chev" aria-hidden="true" />
      </button>
      {open && (
        <ul ref={list} id={`${id}-list`} className="adm-select-list" role="listbox" aria-label={label} aria-activedescendant={`${id}-${active}`}>
          {options.map((o, i) => (
            <li
              key={o.value}
              id={`${id}-${i}`}
              data-i={i}
              role="option"
              aria-selected={o.value === value}
              className={`${o.value === value ? "is-chosen" : ""} ${i === active ? "is-active" : ""}`}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(i)}
            >
              {o.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
