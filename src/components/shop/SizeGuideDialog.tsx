"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { Category } from "@/lib/products";
import { SIZES, TABS, finderFor, guides, sizeIndexFor, tabForCategory, type GuideTab } from "@/lib/sizing";

// The size guide where the size is actually chosen. Fit is the thing shoppers hesitate over, and sending them to the
// home page to settle it loses the colour and size they'd already picked — so the chart opens over the product, on the
// chart their piece is likeliest to need, and a measurement can write the answer straight back into the picker.
export default function SizeGuideDialog({
  category,
  available,
  soldOut = [],
  onPick,
  onClose,
}: {
  category: Category;
  available: string[]; // the sizes this piece is actually made in
  soldOut?: string[]; // ...of those, the ones it's out of
  onPick: (size: string) => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<GuideTab>(tabForCategory(category));
  const [cm, setCm] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const finder = finderFor(tab);
  const match = cm.trim() ? sizeIndexFor(Number(cm), finder.ranges) : -1;
  const suggested = match >= 0 ? SIZES[match] : null;
  const suggestedMade = suggested !== null && available.includes(suggested) && !soldOut.includes(suggested);
  const suggestedGone = suggested !== null && available.includes(suggested) && soldOut.includes(suggested);

  // showModal gives the top layer, the backdrop, focus trapping and Esc for free; Esc and the backdrop both close.
  useEffect(() => {
    const el = dialog.current;
    el?.showModal();
    return () => el?.close();
  }, []);

  return (
    <dialog
      ref={dialog}
      className="sg-dialog"
      aria-labelledby={titleId}
      onCancel={onClose}
      onClick={(e) => e.target === dialog.current && onClose()} // the backdrop, not the card
    >
      <div className="sg-card">
        <div className="sg-head">
          <h2 id={titleId} className="h3">Find your size</h2>
          <button type="button" className="sg-close" onClick={onClose} aria-label="Close the size guide">
            ×
          </button>
        </div>

        <div className="sg-tabs" role="tablist" aria-label="Size charts">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              className={tab === t ? "is-active" : ""}
              onClick={() => {
                setTab(t);
                setCm("");
              }}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="sg-finder">
          <label htmlFor={`${titleId}-cm`}>
            {finder.label} <span>cm</span>
          </label>
          <input
            id={`${titleId}-cm`}
            type="number"
            inputMode="decimal"
            min={40}
            max={160}
            value={cm}
            placeholder="e.g. 74"
            onChange={(e) => setCm(e.target.value)}
          />
          <p className="sg-hint">{finder.hint}</p>
          <p className="sg-answer" role="status" aria-live="polite">
            {!cm.trim()
              ? ""
              : suggested === null
                ? "That doesn't look like a measurement in centimetres."
                : suggestedMade
                  ? `You're closest to ${suggested}.`
                  : suggestedGone
                    ? `You're closest to ${suggested} — that size is sold out just now.`
                    : `You're closest to ${suggested} — this piece isn't made in that size.`}
          </p>
          {suggested && suggestedMade && (
            <button type="button" className="btn btn-wine sg-pick" onClick={() => onPick(suggested)}>
              Choose {suggested}
            </button>
          )}
        </div>

        <table className="sg-table">
          <caption className="sr-only">{tab} measurements in centimetres</caption>
          <thead>
            <tr>
              <th scope="col">Size</th>
              {guides[tab][0].map(([label]) => (
                <th key={label} scope="col">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {guides[tab].map((lines, i) => {
              const made = available.includes(SIZES[i]) && !soldOut.includes(SIZES[i]);
              const out = soldOut.includes(SIZES[i]);
              return (
                <tr key={SIZES[i]} className={`${suggested === SIZES[i] ? "is-match" : ""} ${made ? "" : "is-unmade"}`}>
                  <th scope="row">
                    {SIZES[i]}
                    {!made && <span className="sg-unmade">{out ? " sold out" : " not in this piece"}</span>}
                  </th>
                  {lines.map(([label, value]) => (
                    <td key={label}>{value}</td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>

        <p className="sg-foot">
          Between two sizes? Follow the fit note on the piece. Still unsure? Message us — a real person answers, and rather enjoys this part.
        </p>
      </div>
    </dialog>
  );
}
