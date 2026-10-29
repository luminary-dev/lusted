"use client";

import Image from "next/image";
import { useId, useRef, useState, useSyncExternalStore } from "react";
import wordmark from "@/assets/brand/wordmark-dark.png";
import { trackEvent } from "@/lib/analytics";
import { orderRef } from "@/lib/order";
import { formatPrice } from "@/lib/products";
import { giftVoucher, whatsappLink } from "@/lib/site";
import { WhatsApp } from "./icons";

const { amounts, min, max, validMonths } = giftVoucher;
const TO_MAX = 40;
const NOTE_MAX = 120;

// The request's reference, made the way the bag's is (src/lib/order.ts) but its own, so a voucher and an order sent in
// the same visit never share one. Empty while the server prerenders (Next refuses random values there), so the
// server's HTML and the first client render agree; it is filled in straight after.
let current = "";
const noop = () => () => {};
const useVoucherRef = () =>
  useSyncExternalStore(
    noop,
    () => (current ||= orderRef()),
    () => "",
  );

// "Another amount" in whole rupees: spaces, thousands commas and a leading "LKR" are forgiven, anything else (cents, a
// minus, letters) is refused with a reason, as is an amount outside the shop's range.
function checkAmount(raw: string): { amount: number; error?: undefined } | { amount?: undefined; error: string } {
  const text = raw.replace(/[\s,]/g, "").replace(/^lkr/i, "");
  if (!text) return { error: "Enter an amount in rupees." };
  if (!/^\d+$/.test(text)) return { error: "Whole rupees only, in figures — for example 7500." };
  const amount = Number(text);
  if (amount < min) return { error: `The smallest voucher is ${formatPrice(min)}.` };
  if (amount > max) return { error: `Up to ${formatPrice(max)} here — for more, message us and we’ll arrange it.` };
  return { amount };
}

// what was typed, on one line: the card and the message both show it that way
const clean = (s: string) => s.replace(/\s+/g, " ").trim();

export default function GiftVoucher() {
  const id = useId();
  const ref = useVoucherRef();
  const [choice, setChoice] = useState<number | "other">(amounts[1] ?? amounts[0]);
  const [custom, setCustom] = useState("");
  // the custom amount's error waits until the field is left or the request is sent, not the first keystroke
  const [touched, setTouched] = useState(false);
  const [to, setTo] = useState("");
  const [note, setNote] = useState("");
  const customField = useRef<HTMLInputElement>(null);

  const check = choice === "other" ? checkAmount(custom) : { amount: choice };
  const amount = check.amount;
  const error = choice === "other" && touched ? check.error : undefined;
  const name = clean(to);
  const words = clean(note);

  const message = [
    `Gift voucher ${ref}`.trim(),
    "Hi Lusted! I'd like a gift voucher:",
    "",
    `Amount: ${amount ? formatPrice(amount) : ""}`,
    ...(name ? [`To: ${name}`] : []),
    ...(words ? [`Message: ${words}`] : []),
    "",
    "My name:",
  ].join("\n");

  return (
    <div className="gv">
      <figure className="gv-preview">
        <div className="gv-card">
          <div className="gv-card-top">
            <Image src={wordmark} alt="Lusted Lingerie" className="gv-card-mark" sizes="(min-width: 901px) 150px, 110px" />
            <span className="gv-card-kind">Gift voucher</span>
          </div>
          <p className="gv-card-to">{name ? `For ${name}` : "For you"}</p>
          <p className="gv-card-amount">{amount ? formatPrice(amount) : "LKR —"}</p>
          <p className={`gv-card-note ${words ? "" : "is-empty"}`}>{words || "Your wicked words go here."}</p>
          <p className="gv-card-foot">
            <span>Valid {validMonths} months</span>
            <span className="gv-card-ref">{ref}</span>
          </p>
        </div>
        <figcaption>A sneak peek — we send the real thing on WhatsApp.</figcaption>
      </figure>

      <div className="gv-form">
        <fieldset className="gv-group">
          <legend className="gv-label">Amount</legend>
          <div className="gv-amounts">
            {amounts.map((a) => (
              <label key={a} className="gv-amount">
                <input type="radio" name={`${id}-amount`} value={a} checked={choice === a} onChange={() => setChoice(a)} />
                <span>{formatPrice(a)}</span>
              </label>
            ))}
          </div>
          {/* "Another amount" and its field side by side: the radio names the choice, the field holds it */}
          <div className={`gv-other ${choice === "other" ? "is-chosen" : ""}`}>
            <label className="gv-amount">
              <input type="radio" name={`${id}-amount`} value="other" checked={choice === "other"} onChange={() => setChoice("other")} />
              <span>Another amount</span>
            </label>
            <div className="gv-field gv-field-lkr">
              <label htmlFor={`${id}-other`} className="sr-only">
                Another amount, in rupees
              </label>
              <span aria-hidden="true">LKR</span>
              <input
                ref={customField}
                id={`${id}-other`}
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={custom}
                aria-invalid={error ? true : undefined}
                aria-describedby={`${id}-other-hint ${id}-other-error`}
                // typing here is choosing it, so the radio follows the field (but only typing: tabbing through on the
                // way to the message mustn't drop the amount already picked)
                onChange={(e) => {
                  setCustom(e.currentTarget.value);
                  setChoice("other");
                }}
                onBlur={() => custom && setTouched(true)}
              />
            </div>
          </div>
          <p id={`${id}-other-hint`} className="gv-hint">
            Another amount: whole rupees, {formatPrice(min)} to {formatPrice(max)}.
          </p>
          {/* always in the page, so an error is announced as it appears and never pushes the form down */}
          <p id={`${id}-other-error`} className="gv-error" role="alert">
            {error}
          </p>
        </fieldset>

        <div className="gv-group">
          <label className="gv-label" htmlFor={`${id}-to`}>
            To <span>(optional)</span>
          </label>
          <div className="gv-field">
            <input id={`${id}-to`} type="text" autoComplete="off" maxLength={TO_MAX} value={to} onChange={(e) => setTo(e.currentTarget.value)} />
          </div>
        </div>

        <div className="gv-group">
          <label className="gv-label" htmlFor={`${id}-note`}>
            Message <span>(optional)</span>
          </label>
          <div className="gv-field">
            <textarea
              id={`${id}-note`}
              rows={3}
              maxLength={NOTE_MAX}
              value={note}
              aria-describedby={`${id}-note-count`}
              onChange={(e) => setNote(e.currentTarget.value)}
            />
          </div>
          <p id={`${id}-note-count`} className="gv-hint gv-count">
            {note.length} / {NOTE_MAX} characters
          </p>
        </div>

        <a
          className="btn btn-wine gv-send"
          data-wa-source="gift-voucher"
          // always a real link; while the custom amount won't do, it names no amount and the click explains instead
          href={whatsappLink(amount ? message : "Hi Lusted! I'd like to ask about a gift voucher.")}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => {
            if (!amount) {
              e.preventDefault();
              setTouched(true);
              customField.current?.focus();
              return;
            }
            trackEvent("gift_voucher", { amount: choice === "other" ? "other" : String(choice) });
          }}
        >
          <WhatsApp /> Send the request on WhatsApp
        </a>
        <p className="gv-hint gv-send-note">Nothing is paid here: we reply on WhatsApp to confirm and share secure ways to pay.</p>
      </div>
    </div>
  );
}
