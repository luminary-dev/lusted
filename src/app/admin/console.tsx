"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import wordmarkDark from "@/assets/brand/wordmark-dark.png";
import wordmarkLight from "@/assets/brand/wordmark-light.png";
import { categories, colors, fitLabels, sizes as SIZES, type Category, type ColorKey } from "@/lib/products";

// The back room — the owner console, four rooms on four pages: the fitting (add a piece), the offers, the ledger
// (the catalogue) and the day book (what happened). Every page carries the same header: the doors out, the title,
// the day's figures and the way to the other rooms.
//
// Everything here changes the DEV site: each change is queued as a GitHub workflow that opens a pull request into
// dev, which merges itself once the checks pass (ten minutes or so) — the same road as every other change, so nothing
// skips the tests. The console doesn't trust the catalogue baked into its own deploy: it polls /api/admin/state (the
// dev branch's catalogue and the console's pull requests in flight) and confirms every queued change the moment it
// lands, as a ticket in the corner and fresh figures in the header.

export type CatalogEntry = {
  slug: string;
  name: string;
  category: Category;
  price: number;
  salePrice?: number;
  colors: ColorKey[];
  sizes: string[];
  bestSeller?: number;
  added: string;
  description: string;
  blurb?: string;
  details: string[];
  fit: -1 | 0 | 1;
  fitNote: string;
  moments: string[];
};

import { SECTIONS, type Section } from "./sections";
import { Select } from "./select";

type Pull = { number: number; title: string; url: string; createdAt: string; branch: string; fromConsole: boolean; stage: "checks" | "failed" | "ready" };
type LiveState = { products: CatalogEntry[]; pulls: Pull[] };
type Pending = { key: string; doneText: string; startedAt: number; check: (state: LiveState) => boolean; slowMinutes: number };
type Toast = { key: string; text: string; phase: "applying" | "done" | "late" };
type ActivityItem = { text: string; at: string };

const SITE_DEV = "https://lusted-dev.vercel.app";
const SITE_LIVE = "https://lusted.vercel.app";
const REPO = "https://github.com/luminary-dev/lusted";
const VERCEL = "https://vercel.com/dhanikaas-projects/lusted";
const COLLECTIONS = categories.map((c) => ({ key: c.key, name: c.name }));
const COLOR_KEYS = Object.keys(colors) as ColorKey[];
const IMG = (slug: string) => `/img/v2/products/${slug}.webp`;
const COLLECTION_OPTIONS = COLLECTIONS.map((c) => ({ value: c.key, label: c.name }));
// the home page and the search show six best sellers, so six is the limit
const BEST_LIMIT = 6;
const bestCount = (products: CatalogEntry[]) => products.filter((p) => p.bestSeller).length;

/* ───────── live state, pending changes, tickets ───────── */

function useLiveState(initial: CatalogEntry[]) {
  const [live, setLive] = useState<LiveState>({ products: initial, pulls: [] });
  const [failed, setFailed] = useState(false);
  const [pending, setPending] = useState<Pending[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismissLater = useCallback((key: string, ms: number) => {
    setTimeout(() => setToasts((all) => all.filter((t) => t.key !== key)), ms);
  }, []);

  const refresh = useCallback(async () => {
    const response = await fetch("/api/admin/state").catch(() => null);
    const body = await response?.json().catch(() => null);
    if (!response?.ok || !body?.ok || !Array.isArray(body.products)) {
      setFailed(true);
      return;
    }
    const state: LiveState = { products: body.products, pulls: body.pulls ?? [] };
    setLive(state);
    setFailed(false);
    setPending((current) => {
      const still: Pending[] = [];
      for (const item of current) {
        if (item.check(state)) {
          setToasts((all) => all.map((t) => (t.key === item.key ? { ...t, text: item.doneText, phase: "done" as const } : t)));
          dismissLater(item.key, 9000);
        } else {
          if (Date.now() - item.startedAt > item.slowMinutes * 60000) {
            setToasts((all) =>
              all.map((t) =>
                t.key === item.key && t.phase === "applying"
                  ? { ...t, phase: "late" as const, text: `${t.text.replace(" — on its way…", "")} — taking longer than usual. See the pull requests in the day book.` }
                  : t,
              ),
            );
          }
          still.push(item);
        }
      }
      return still;
    });
  }, [dismissLater]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the first load
    void refresh();
  }, [refresh]);
  useEffect(() => {
    // while anything is on its way, keep looking; otherwise a slow heartbeat keeps the pull-request list honest
    const timer = setInterval(() => void refresh(), pending.length ? 8000 : 60000);
    return () => clearInterval(timer);
  }, [pending.length, refresh]);

  const track = useCallback((applyingText: string, doneText: string, check: (state: LiveState) => boolean, slowMinutes = 18) => {
    const key = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setPending((all) => [...all, { key, doneText, check, startedAt: Date.now(), slowMinutes }]);
    setToasts((all) => [...all, { key, text: `${applyingText} — on its way…`, phase: "applying" }]);
  }, []);

  return { live, failed, track, toasts };
}

type Track = ReturnType<typeof useLiveState>["track"];

function Tickets({ toasts }: { toasts: Toast[] }) {
  if (toasts.length === 0) return null;
  return (
    <div className="adm-tickets" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.key} className={`adm-ticket is-${t.phase}`}>
          <span className="adm-dot" aria-hidden="true" />
          <span>{t.text}</span>
        </div>
      ))}
    </div>
  );
}

/* ───────── activity ───────── */

function useActivity(enabled: boolean, signal: string) {
  const [items, setItems] = useState<ActivityItem[]>([]);
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const load = () =>
      fetch("/api/admin/activity")
        .then((r) => (r.ok ? r.json() : null))
        .then((body) => {
          if (!cancelled && body?.items) setItems(body.items);
        })
        .catch(() => null);
    void load();
    const timer = setInterval(load, 45000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [enabled, signal]);
  return items;
}

// Sri Lanka time, "10.42 am" — with the day only when it isn't today
function feedTime(iso: string): string {
  if (!iso) return "";
  const date = new Date(iso);
  const time = date.toLocaleTimeString("en-GB", { timeZone: "Asia/Colombo", hour: "numeric", minute: "2-digit", hour12: true }).replace(":", ".");
  const day = date.toLocaleDateString("en-GB", { timeZone: "Asia/Colombo", day: "numeric", month: "short" });
  const today = new Date().toLocaleDateString("en-GB", { timeZone: "Asia/Colombo", day: "numeric", month: "short" });
  return day === today ? time : `${day}, ${time}`;
}

/* ───────── helpers ───────── */

async function post(url: string, body: unknown) {
  const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).catch(() => null);
  const json = await response?.json().catch(() => null);
  return { ok: !!response?.ok && json?.ok !== false, status: response?.status ?? 0, body: json };
}

// a copy of the front photo small enough to send for the copy (the full one goes straight to the bucket)
async function shrink(file: File, max = 1600): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("could not shrink the photo"))), "image/jpeg", 0.86));
}

const slugify = (name: string) =>
  name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

const lkr = (n: number) => n.toLocaleString("en-LK");

/* ───────── i · the fitting (add a piece) ───────── */

type View = "front" | "back" | "side";
const VIEWS: View[] = ["front", "back", "side"];

function Fitting({ track, existing }: { track: Track; existing: CatalogEntry[] }) {
  const bestFull = bestCount(existing) >= BEST_LIMIT;
  const [files, setFiles] = useState<Partial<Record<View, File>>>({});
  const [previews, setPreviews] = useState<Partial<Record<View, string>>>({});
  const [category, setCategory] = useState<Category>("lingerie");
  const [price, setPrice] = useState("");
  const [picked, setPicked] = useState<ColorKey[]>([]);
  const [sizes, setSizes] = useState<string[]>([...SIZES]);
  const [fit, setFit] = useState<-1 | 0 | 1>(0);
  const [bestSeller, setBestSeller] = useState("");
  const [notes, setNotes] = useState("");
  // the copy, written by Claude and then the owner's to change
  const [name, setName] = useState("");
  const [otherNames, setOtherNames] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [blurb, setBlurb] = useState("");
  const [details, setDetails] = useState("");
  const [fitNote, setFitNote] = useState("");
  const [moments, setMoments] = useState("");
  const [written, setWritten] = useState(false);
  const [writing, setWriting] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pick = (view: View, file: File | undefined) => {
    setFiles((all) => ({ ...all, [view]: file }));
    setPreviews((all) => {
      if (all[view]) URL.revokeObjectURL(all[view]!);
      return { ...all, [view]: file ? URL.createObjectURL(file) : undefined };
    });
  };
  const toggle = <T,>(list: T[], item: T) => (list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);
  const briefReady = !!files.front && !!files.back && Number(price) > 0 && picked.length > 0;
  const slug = slugify(name);
  const taken = !!slug && existing.some((p) => p.slug === slug);
  const canAdd = briefReady && name.trim() && description.trim() && moments.split("\n").filter(Boolean).length === 3 && details.split("\n").filter(Boolean).length > 0 && sizes.length > 0 && !taken;
  const step = !files.front || !files.back ? 1 : !written ? 2 : 3;

  async function write() {
    if (!briefReady || writing) return;
    setWriting(true);
    setError(null);
    try {
      const form = new FormData();
      form.set("image", await shrink(files.front!), "front.jpg");
      form.set("category", category);
      form.set("price", String(Math.round(Number(price))));
      form.set("fit", String(fit));
      form.set("colors", picked.join(","));
      form.set("notes", notes);
      const response = await fetch("/api/admin/copy", { method: "POST", body: form }).catch(() => null);
      const body = await response?.json().catch(() => null);
      if (!response?.ok || !body?.copy) throw new Error(body?.error ?? "Could not write it — try again");
      const c = body.copy;
      setName(c.name);
      setOtherNames(Array.isArray(c.names) ? c.names : []);
      setDescription(c.description);
      setBlurb(c.blurb ?? "");
      setDetails((c.details as string[]).join("\n"));
      setFitNote(c.fitNote ?? "");
      setMoments((c.moments as string[]).join("\n"));
      setWritten(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not write it — try again");
    }
    setWriting(false);
  }

  async function add() {
    if (!canAdd || adding) return;
    setError(null);
    try {
      // 1 · the photos go straight into the bucket on signed addresses
      let upload: string | undefined;
      const keys: Partial<Record<View, string>> = {};
      for (const view of VIEWS) {
        const file = files[view];
        if (!file) continue;
        setAdding(`Sending the ${view} photo…`);
        const signed = await post("/api/admin/upload-url", { upload, view, type: file.type });
        if (!signed.ok) throw new Error(signed.body?.error ?? "Could not sign the upload");
        upload = signed.body.upload;
        const put = await fetch(signed.body.url, { method: "PUT", headers: { "content-type": file.type }, body: file }).catch(() => null);
        if (!put?.ok) throw new Error(`The ${view} photo didn’t upload (${put?.status ?? "no answer"}) — is the bucket's CORS set for this site?`);
        keys[view] = signed.body.key;
      }
      // 2 · the piece itself
      setAdding("Queuing the piece…");
      const result = await post("/api/admin/products/add", {
        name: name.trim(),
        description: description.trim(),
        blurb: blurb.trim() || undefined,
        details: details.split("\n").map((s) => s.trim()).filter(Boolean),
        fitNote: fitNote.trim(),
        moments: moments.split("\n").map((s) => s.trim()).filter(Boolean),
        category,
        price: Math.round(Number(price)),
        fit,
        colors: picked,
        sizes,
        bestSeller: bestSeller ? Number(bestSeller) : null,
        views: keys,
      });
      if (!result.ok) throw new Error(result.body?.error ?? "Something went wrong — try again");
      const added = result.body.slug as string;
      track(`Adding “${name.trim()}” (the photos, then the pull request and its checks)`, `“${name.trim()}” is in the ledger. The dev site follows in a couple of minutes.`, (state) => state.products.some((p) => p.slug === added), 25);
      // clear the form
      VIEWS.forEach((v) => pick(v, undefined));
      setPrice("");
      setPicked([]);
      setSizes([...SIZES]);
      setFit(0);
      setBestSeller("");
      setNotes("");
      setName("");
      setOtherNames([]);
      setDescription("");
      setBlurb("");
      setDetails("");
      setFitNote("");
      setMoments("");
      setWritten(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong — try again");
    }
    setAdding(null);
  }

  return (
    <div className="adm-sheet adm-fitting">
      <ol className="adm-steps" aria-label="Steps">
        {["Tape the photos up", "Let Claude write it", "Read it, then add"].map((label, i) => (
          <li key={label} className={step > i + 1 ? "is-done" : step === i + 1 ? "is-now" : ""}>
            <span className="adm-step-n">{i + 1}</span>
            {label}
          </li>
        ))}
      </ol>

      <div className="adm-pins">
        {VIEWS.map((view, i) => (
          <label
            key={view}
            className={`adm-pin ${i % 2 ? "tape-corners" : "tape-top"} ${previews[view] ? "has-photo" : ""}`}
            style={{ "--tilt": `${[-1.6, 1.1, -0.8][i]}deg`, "--tape": `${[-3, 2, 4][i]}deg` } as React.CSSProperties}
          >
            {/* strips of paper tape, the same ones that hold the prints on the about wall */}
            <span className="print-tape" aria-hidden="true" />
            <span className="print-tape is-second" aria-hidden="true" />
            <span className="adm-pin-frame">
              {previews[view] ? (
                // eslint-disable-next-line @next/next/no-img-element -- a local preview of the file just chosen
                <img src={previews[view]} alt="" />
              ) : (
                <span className="adm-pin-empty">
                  <span className="adm-pin-plus" aria-hidden="true">
                    +
                  </span>
                  <span>{view === "side" ? "optional" : "needed"}</span>
                </span>
              )}
            </span>
            <span className="adm-pin-caption">{view}</span>
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => pick(view, e.currentTarget.files?.[0])} />
          </label>
        ))}
        <p className="adm-help adm-pins-note">
          Front is the photo on the cards and back is the one that shows on hover; both are needed. Side is an extra view on the piece’s page, if
          you have one. Any size, portrait is best: each is cropped to the catalogue’s 9:16 frame and signed with the wordmark. Nothing else is
          done to them.
        </p>
      </div>

      <div className="adm-grid-2">
        <label className="adm-field">
          <span className="adm-label">Collection</span>
          <Select label="Collection" value={category} options={COLLECTION_OPTIONS} onChange={(v) => setCategory(v as Category)} />
        </label>
        <label className="adm-field">
          <span className="adm-label">Price (LKR)</span>
          <input className="adm-input" type="number" min={1} value={price} onChange={(e) => setPrice(e.currentTarget.value)} />
        </label>
        <div className="adm-field">
          <span className="adm-label">Colours</span>
          <div className="adm-chips">
            {COLOR_KEYS.map((c) => (
              <button key={c} type="button" className={`adm-chip ${picked.includes(c) ? "is-on" : ""}`} onClick={() => setPicked((all) => toggle(all, c))}>
                <span className="adm-swatch" style={{ background: colors[c].hex }} aria-hidden="true" />
                {colors[c].label}
              </button>
            ))}
          </div>
        </div>
        <div className="adm-field">
          <span className="adm-label">Sizes</span>
          <div className="adm-chips">
            {SIZES.map((s) => (
              <button key={s} type="button" className={`adm-chip adm-chip-tag ${sizes.includes(s) ? "is-on" : ""}`} onClick={() => setSizes((all) => toggle(all, s))}>
                {s}
              </button>
            ))}
          </div>
        </div>
        <label className="adm-field">
          <span className="adm-label">Fit</span>
          <Select label="Fit" value={String(fit)} options={([-1, 0, 1] as const).map((f) => ({ value: String(f), label: fitLabels[f] }))} onChange={(v) => setFit(Number(v) as -1 | 0 | 1)} />
        </label>
        <label className="adm-field">
          <span className="adm-label">Best-seller rank (optional)</span>
          <input className="adm-input" type="number" min={1} max={BEST_LIMIT} placeholder={bestFull ? "the six are taken" : "1 shows first"} disabled={bestFull} value={bestSeller} onChange={(e) => setBestSeller(e.currentTarget.value)} />
          {bestFull && <span className="adm-help">Six best sellers already. Clear one in the ledger to make room.</span>}
        </label>
        <label className="adm-field adm-span">
          <span className="adm-label">A word for the writer (optional)</span>
          <input className="adm-input" type="text" maxLength={400} placeholder="The fabric, what it does, who it's for — anything the description should know" value={notes} onChange={(e) => setNotes(e.currentTarget.value)} />
        </label>
      </div>

      <div className="adm-row">
        <button type="button" className="adm-btn" disabled={!briefReady || writing || !!adding} onClick={write}>
          {writing ? "Writing…" : written ? "Write it again" : "Write it with AI"}
        </button>
        <span className="adm-help">Claude looks at the front photo and writes the name, the description and the rest in the catalogue’s voice. Change anything before adding.</span>
      </div>

      {written && (
        <div className="adm-grid-2 adm-copy">
          <label className="adm-field">
            <span className="adm-label">Name</span>
            <input className="adm-input" type="text" maxLength={60} value={name} onChange={(e) => setName(e.currentTarget.value)} />
            {slug && (
              <span className="adm-help">
                /products/{slug}
                {taken ? " — already in the ledger, change the name" : ""}
              </span>
            )}
            {otherNames.length > 0 && (
              <span className="adm-names">
                <span className="adm-help">or</span>
                {otherNames.map((n) => (
                  <button
                    key={n}
                    type="button"
                    className="adm-quiet"
                    onClick={() => {
                      setOtherNames((all) => [name, ...all.filter((x) => x !== n)]);
                      setName(n);
                    }}
                  >
                    {n}
                  </button>
                ))}
              </span>
            )}
          </label>
          <label className="adm-field">
            <span className="adm-label">One line for small cards (optional)</span>
            <input className="adm-input" type="text" maxLength={90} value={blurb} onChange={(e) => setBlurb(e.currentTarget.value)} />
          </label>
          <label className="adm-field adm-span">
            <span className="adm-label">Description</span>
            <textarea className="adm-input" rows={4} maxLength={600} value={description} onChange={(e) => setDescription(e.currentTarget.value)} />
          </label>
          <label className="adm-field">
            <span className="adm-label">Details (one per line)</span>
            <textarea className="adm-input" rows={5} value={details} onChange={(e) => setDetails(e.currentTarget.value)} />
          </label>
          <label className="adm-field">
            <span className="adm-label">Made for (three, one per line)</span>
            <textarea className="adm-input" rows={3} value={moments} onChange={(e) => setMoments(e.currentTarget.value)} />
            <span className="adm-label adm-label-top">Fit note</span>
            <input className="adm-input" type="text" maxLength={160} value={fitNote} onChange={(e) => setFitNote(e.currentTarget.value)} />
          </label>
        </div>
      )}

      <div className="adm-row">
        <button type="button" className="adm-btn adm-btn-ink" disabled={!canAdd || !!adding} onClick={add}>
          {adding ?? "Add it to the ledger"}
        </button>
        {!written && <span className="adm-help">Write the copy first.</span>}
      </div>
      {error && (
        <p className="adm-alert" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/* ───────── ii · offers ───────── */

function Offers({ products, track }: { products: CatalogEntry[]; track: Track }) {
  const [category, setCategory] = useState<string>("swim");
  const [percent, setPercent] = useState("20");
  const [busy, setBusy] = useState(false);
  const matching = products.filter((p) => category === "*" || p.category === category);
  const scope = category === "*" ? "the whole catalogue" : `every ${COLLECTIONS.find((c) => c.key === category)?.name ?? category} piece`;
  const on = matching.filter((p) => typeof p.salePrice === "number" && p.salePrice < p.price).length;
  const onOffer = products.filter((p) => typeof p.salePrice === "number" && p.salePrice < p.price);

  async function send(percentOff: number | null) {
    setBusy(true);
    const result = await post("/api/admin/dispatch", { action: "bulk-offer", category, percentOff });
    if (result.ok) {
      const slugs = matching.map((p) => p.slug);
      track(
        percentOff ? `Putting ${percentOff}% off ${scope} (${matching.length} pieces)` : `Clearing the offers on ${scope}`,
        percentOff ? `${percentOff}% off ${scope} — on ${matching.length} pieces. The dev site follows in a couple of minutes.` : `The offers on ${scope} are cleared.`,
        (state) =>
          slugs.every((slug) => {
            const now = state.products.find((p) => p.slug === slug);
            if (!now) return true;
            const isOn = typeof now.salePrice === "number" && now.salePrice < now.price;
            return percentOff ? isOn : !isOn;
          }),
      );
    }
    setBusy(false);
  }

  return (
    <>
      <div className="adm-sheet adm-offers">
        <div className="adm-offer-line">
          <span className="adm-offer-word">Take</span>
          <span className="adm-offer-pct">
            <input className="adm-input adm-input-big" type="number" min={1} max={90} value={percent} aria-label="Percent off" onChange={(e) => setPercent(e.currentTarget.value)} />
            <span aria-hidden="true">%</span>
          </span>
          <span className="adm-offer-word">off</span>
          <Select label="Collection" size="big" value={category} options={[...COLLECTION_OPTIONS, { value: "*", label: "everything" }]} onChange={setCategory} />
        </div>
        <div className="adm-row adm-row-tight">
          <button type="button" className="adm-btn" disabled={busy || !Number(percent)} onClick={() => send(Math.round(Number(percent)))}>
            Put it on {matching.length} pieces
          </button>
          <button type="button" className="adm-quiet" disabled={busy || on === 0} onClick={() => send(null)}>
            Clear the {on} on offer
          </button>
          <span className="adm-help">Offer prices land on a round ten rupees, always under the full price. For one piece, use its row in the ledger.</span>
        </div>
      </div>

      <h2 className="adm-h3">On offer now</h2>
      {onOffer.length === 0 ? (
        <p className="adm-help">Nothing is on offer. Everything is full price.</p>
      ) : (
        <ul className="adm-offer-list">
          {onOffer.map((p) => (
            <li key={p.slug}>
              {/* eslint-disable-next-line @next/next/no-img-element -- the site's own photo route, at thumbnail size */}
              <img src={IMG(p.slug)} alt="" className="adm-thumb" loading="lazy" />
              <span className="adm-offer-name">
                {p.name}
                <span className="adm-aside">{COLLECTIONS.find((c) => c.key === p.category)?.name}</span>
              </span>
              <span className="adm-offer-prices">
                <s>{lkr(p.price)}</s> {lkr(p.salePrice!)} <span className="adm-off">−{Math.round((1 - p.salePrice! / p.price) * 100)}%</span>
              </span>
              <Link href="/admin/ledger" className="adm-quiet">
                In the ledger
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

/* ───────── iii · the ledger ───────── */

function LedgerRow({ product, track, bestTaken }: { product: CatalogEntry; track: Track; bestTaken: number }) {
  const [name, setName] = useState(product.name);
  const [category, setCategory] = useState<string>(product.category);
  const [price, setPrice] = useState(String(product.price));
  const [sale, setSale] = useState(product.salePrice ? String(product.salePrice) : "");
  const [rank, setRank] = useState(product.bestSeller ? String(product.bestSeller) : "");
  const [waiting, setWaiting] = useState(false);

  // Only the fields changed in this row, against its values when editing began: the change lands minutes later, so
  // sending the rest would put back whatever this row last saw — undoing an offer still on its way, say. A cleared
  // offer price or rank is sent as null, which ends it; a field that isn't sent is left alone.
  const changes: Partial<{ name: string; category: string; price: number; salePrice: number | null; bestSeller: number | null }> = {};
  if (name.trim() !== product.name) changes.name = name.trim();
  if (category !== product.category) changes.category = category;
  if (Number(price) !== product.price) changes.price = Number(price);
  if ((sale === "" ? null : Number(sale)) !== (product.salePrice ?? null)) changes.salePrice = sale === "" ? null : Number(sale);
  if ((rank === "" ? null : Number(rank)) !== (product.bestSeller ?? null)) changes.bestSeller = rank === "" ? null : Number(rank);
  const dirty = Object.keys(changes).length > 0;
  const pct = sale && Number(sale) < Number(price) ? Math.round((1 - Number(sale) / Number(price)) * 100) : 0;
  // a seventh best seller: the six are already taken by other pieces
  const seventh = rank !== "" && !product.bestSeller && bestTaken >= BEST_LIMIT;

  async function save() {
    if (seventh) return;
    setWaiting(true);
    const data = changes;
    const result = await post("/api/admin/dispatch", { action: "update-product", slug: product.slug, data });
    if (result.ok) {
      track(`Saving “${product.name}”`, `“${product.name}” is updated. The dev site follows in a couple of minutes.`, (state) => {
        const now = state.products.find((p) => p.slug === product.slug);
        // done when what was sent has landed; the fields not sent may have moved on in the meantime
        return !!now && (Object.keys(data) as Array<keyof typeof data>).every((key) => (now[key] ?? null) === data[key]);
      });
    } else setWaiting(false);
  }

  async function remove() {
    if (!window.confirm(`Take “${product.name}” off the site, photos and all? It comes back only by adding it again.`)) return;
    setWaiting(true);
    const result = await post("/api/admin/dispatch", { action: "remove-product", slug: product.slug });
    if (result.ok) track(`Removing “${product.name}”`, `“${product.name}” is out of the ledger.`, (state) => !state.products.some((p) => p.slug === product.slug));
    else setWaiting(false);
  }

  return (
    <tr className={`adm-tr ${dirty ? "is-dirty" : ""} ${waiting ? "is-waiting" : ""}`}>
      <td className="adm-td-piece">
        <span className="adm-thumb-wrap">
          {/* eslint-disable-next-line @next/next/no-img-element -- the site's own photo route, at thumbnail size */}
          <img src={IMG(product.slug)} alt="" className="adm-thumb" loading="lazy" />
        </span>
        <span className="adm-piece">
          <input className="adm-input adm-input-row adm-input-name" type="text" maxLength={60} value={name} aria-label="Name" onChange={(e) => setName(e.currentTarget.value)} />
          <Select label="Collection" size="dim" value={category} options={COLLECTION_OPTIONS} onChange={setCategory} />
        </span>
      </td>
      <td className="adm-td-num">
        <input className="adm-input adm-input-row adm-num-in" type="number" min={1} value={price} aria-label="Price" onChange={(e) => setPrice(e.currentTarget.value)} />
      </td>
      <td className="adm-td-num">
        <span className="adm-offer-cell">
          <input className="adm-input adm-input-row adm-num-in" type="number" min={1} placeholder="—" value={sale} aria-label="Offer price" onChange={(e) => setSale(e.currentTarget.value)} />
          {pct > 0 && <span className="adm-off">−{pct}%</span>}
          <Select
            label="Set the offer by percent"
            size="dim"
            className="adm-pct-pick"
            value=""
            options={[{ value: "", label: "% off…" }, ...[10, 15, 20, 25, 30, 40, 50].map((p) => ({ value: String(p), label: `${p}% off` }))]}
            onChange={(v) => {
              const p = Number(v);
              if (!p) return;
              const full = Number(price) || product.price;
              setSale(String(Math.min(Math.max(10, Math.round((full * (1 - p / 100)) / 10) * 10), full - 10)));
            }}
          />
        </span>
      </td>
      <td className="adm-td-num">
        <input className={`adm-input adm-input-row adm-num-in adm-rank-in ${seventh ? "is-wrong" : ""}`} type="number" min={1} max={BEST_LIMIT} placeholder="—" title={seventh ? "Six best sellers already — clear one first." : "A number makes it a best seller: 1 shows first, six at most. Clear it to take it out."} value={rank} aria-label="Best-seller rank" onChange={(e) => setRank(e.currentTarget.value)} />
        {seventh && <span className="adm-off adm-wrong">six already</span>}
      </td>
      <td className="adm-td-actions">
        {waiting ? (
          <span className="adm-applying">
            <span className="adm-dot" aria-hidden="true" /> on its way
          </span>
        ) : (
          <>
            <button type="button" className="adm-quiet adm-save" disabled={!dirty || seventh} onClick={save}>
              Save
            </button>
            <button type="button" className="adm-quiet is-danger" onClick={remove}>
              Remove
            </button>
          </>
        )}
      </td>
    </tr>
  );
}

type Flag = "offer" | "best" | "new" | "full";
const FLAGS: Array<{ key: Flag; label: string }> = [
  { key: "offer", label: "On offer" },
  { key: "best", label: "Best sellers" },
  { key: "new", label: "New in" },
  { key: "full", label: "Full price" },
];

function Ledger({ products, track }: { products: CatalogEntry[]; track: Track }) {
  const [query, setQuery] = useState("");
  const [collection, setCollection] = useState("*");
  const [flags, setFlags] = useState<Flag[]>([]);
  const [sort, setSort] = useState<"new" | "name" | "price-asc" | "price-desc" | "best">("new");
  const q = query.trim().toLowerCase();
  const onOffer = (p: CatalogEntry) => typeof p.salePrice === "number" && p.salePrice < p.price;
  // "new in" is what the shop calls new: the six most recently added
  const newest = new Set([...products].sort((a, b) => b.added.localeCompare(a.added)).slice(0, 6).map((p) => p.slug));
  const passes = (p: CatalogEntry) =>
    flags.every((f) => (f === "offer" ? onOffer(p) : f === "best" ? !!p.bestSeller : f === "new" ? newest.has(p.slug) : !onOffer(p)));
  const rows = [...products]
    .filter((p) => (collection === "*" || p.category === collection) && passes(p) && (!q || p.name.toLowerCase().includes(q) || p.slug.includes(q)))
    .sort((a, b) =>
      sort === "name"
        ? a.name.localeCompare(b.name)
        : sort === "price-asc"
          ? (a.salePrice ?? a.price) - (b.salePrice ?? b.price)
          : sort === "price-desc"
            ? (b.salePrice ?? b.price) - (a.salePrice ?? a.price)
            : sort === "best"
              ? (a.bestSeller ?? 999) - (b.bestSeller ?? 999)
              : b.added.localeCompare(a.added),
    );
  const toggleFlag = (f: Flag) => setFlags((all) => (all.includes(f) ? all.filter((x) => x !== f) : [...all.filter((x) => !(f === "offer" && x === "full") && !(f === "full" && x === "offer")), f]));
  return (
    <>
      <div className="adm-ledger-tools">
        <input className="adm-input adm-input-search" type="search" placeholder="Find a piece…" aria-label="Find a piece" value={query} onChange={(e) => setQuery(e.currentTarget.value)} />
        <div className="adm-seg" role="group" aria-label="Collection">
          <button type="button" className={collection === "*" ? "is-on" : ""} onClick={() => setCollection("*")}>
            All <small>{products.length}</small>
          </button>
          {COLLECTIONS.map((c) => (
            <button key={c.key} type="button" className={collection === c.key ? "is-on" : ""} onClick={() => setCollection(c.key)}>
              {c.name} <small>{products.filter((p) => p.category === c.key).length}</small>
            </button>
          ))}
        </div>
        <div className="adm-flags" role="group" aria-label="Only">
          {FLAGS.map((f) => (
            <button key={f.key} type="button" className={flags.includes(f.key) ? "is-on" : ""} aria-pressed={flags.includes(f.key)} onClick={() => toggleFlag(f.key)}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="adm-ledger-right">
          <label className="adm-sort">
            <span className="adm-label">Sort</span>
            <Select
              label="Sort"
              size="row"
              value={sort}
              options={[
                { value: "new", label: "Newest first" },
                { value: "best", label: "Best sellers first" },
                { value: "name", label: "By name" },
                { value: "price-asc", label: "Price, low to high" },
                { value: "price-desc", label: "Price, high to low" },
              ]}
              onChange={(v) => setSort(v as typeof sort)}
            />
          </label>
          <span className="adm-aside">
            {rows.length} of {products.length}
          </span>
        </div>
      </div>
      <div className="adm-ledger-wrap">
        <table className="adm-ledger">
          <thead>
            <tr>
              <th scope="col">Piece</th>
              <th scope="col" className="adm-th-num">
                Price
              </th>
              <th scope="col" className="adm-th-num">
                Offer
              </th>
              <th scope="col" className="adm-th-num">
                Best seller
              </th>
              <th scope="col">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              // content-keyed: when the live state confirms a change the row remounts with the fresh values
              <LedgerRow key={`${p.slug}|${p.name}|${p.category}|${p.price}|${p.salePrice ?? ""}|${p.bestSeller ?? ""}`} product={p} track={track} bestTaken={bestCount(products)} />
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="adm-help">No piece answers to that.</p>}
      </div>
      <p className="adm-help">
        <strong>Best sellers:</strong> give a piece a number in the Best seller column — 1 shows first — and Save. Six at most, the six the home page
        and the search show; to make room, clear another piece’s number. <strong>Offers:</strong> clear the offer price to end one. Descriptions and photos change in the
        repo, or take the piece off and add it again.
      </p>
    </>
  );
}

/* ───────── iv · the day book ───────── */

function DayBook({ pulls, items }: { pulls: Pull[]; items: ActivityItem[] }) {
  const stage = { checks: "checks running", ready: "checks passed — merging", failed: "a check failed — needs a look" };
  return (
    <>
      <h2 className="adm-h3">On its way</h2>
      {pulls.length === 0 ? (
        <p className="adm-help">Nothing in flight. Every pull request into dev has landed.</p>
      ) : (
        <ul className="adm-pulls">
          {pulls.map((pull) => (
            <li key={pull.number} className={`adm-pull is-${pull.stage}`}>
              <span className="adm-dot" aria-hidden="true" />
              <a href={pull.url} target="_blank" rel="noopener noreferrer">
                {pull.title}
              </a>
              <span className="adm-aside">
                #{pull.number} · {pull.fromConsole ? "from the console" : `by hand, ${pull.branch}`} · {stage[pull.stage]} · {feedTime(pull.createdAt)}
              </span>
            </li>
          ))}
        </ul>
      )}
      <h2 className="adm-h3">What happened</h2>
      {items.length === 0 ? (
        <p className="adm-help">Nothing written yet.</p>
      ) : (
        <ul className="adm-feed">
          {items.map((item) => (
            <li key={item.at + item.text}>
              <span className="adm-feed-time">{feedTime(item.at)}</span>
              <span>{item.text}</span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

/* ───────── the lights: the site's own theme (data-theme on <html>, remembered as lusted-theme) ───────── */

function useLights() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading what the theme script set before paint
    setTheme(document.documentElement.dataset.theme === "light" ? "light" : "dark");
  }, []);
  const flip = () => {
    const next = theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("lusted-theme", next);
    } catch {}
    setTheme(next);
  };
  return { theme, flip };
}

/* ───────── the room ───────── */

export function Console({ section, initial }: { section: Section; initial: CatalogEntry[] }) {
  const router = useRouter();
  const { live, failed, track, toasts } = useLiveState(initial);
  const lights = useLights();
  const activity = useActivity(section === "daybook", `${live.products.length}|${live.pulls.map((p) => `${p.number}${p.stage}`).join(",")}`);

  const onOffer = live.products.filter((p) => typeof p.salePrice === "number" && p.salePrice < p.price).length;
  const count = (key: Category) => live.products.filter((p) => p.category === key).length;
  const figures = [
    { label: "pieces", value: live.products.length },
    ...COLLECTIONS.map((c) => ({ label: c.name, value: count(c.key) })),
    { label: "on offer", value: onOffer },
    { label: "best sellers", value: live.products.filter((p) => p.bestSeller).length },
  ];
  const doors = [
    { label: "Dev site", href: SITE_DEV },
    { label: "Live site", href: SITE_LIVE },
    { label: "GitHub", href: REPO },
    { label: "Vercel", href: VERCEL },
  ];
  const room = SECTIONS.find((s) => s.id === section)!;

  return (
    <main className="adm adm-room">
      <div className="adm-page">
        <header className="adm-top">
          <Link href="/admin/ledger" className="adm-top-mark">
            <Image src={wordmarkDark} alt="Lusted" className="adm-wordmark adm-mark-dark" priority sizes="140px" />
            <Image src={wordmarkLight} alt="" className="adm-wordmark adm-mark-light" priority sizes="140px" aria-hidden="true" />
          </Link>
          <nav className="adm-doors" aria-label="Elsewhere">
            {doors.map((d) => (
              <a key={d.label} href={d.href} target="_blank" rel="noopener noreferrer" className="adm-quiet">
                {d.label}
              </a>
            ))}
            <button type="button" className="adm-quiet" onClick={lights.flip} aria-pressed={lights.theme === "light"}>
              {lights.theme === "light" ? "Lights off" : "Lights on"}
            </button>
            <button
              type="button"
              className="adm-quiet"
              onClick={async () => {
                await fetch("/api/admin/logout", { method: "POST" }).catch(() => null);
                router.push("/admin");
                router.refresh();
              }}
            >
              Sign out
            </button>
          </nav>
        </header>

        <div className="adm-masthead">
          <div className="adm-hero">
            <h1 className="adm-title">The back room</h1>
            <p className="adm-lede">
              Everything here changes the <strong>dev site</strong>. Each change becomes a pull request that merges itself once the checks pass, ten
              minutes or so, and the dev site follows. Check it there, then ask for a release to put it out front.
              {failed ? " The repo can’t be reached right now (is GITHUB_ADMIN_TOKEN set?) — what you see is the deployed copy." : ""}
            </p>
          </div>
          {/* the figures as a ledger: a label, a dotted leader, the number */}
          <dl className="adm-figures" aria-label="The numbers">
            {figures.map((f) => (
              <div key={f.label} className="adm-figure">
                <dt>{f.label}</dt>
                <dd>{f.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <nav className="adm-rooms" aria-label="Rooms">
          {SECTIONS.map((s) => (
            <Link key={s.id} href={`/admin/${s.id}`} className={`adm-room-link ${s.id === section ? "is-here" : ""}`} aria-current={s.id === section ? "page" : undefined}>
              <span className="adm-room-name">{s.name}</span>
              <span className="adm-room-aside">{s.aside}</span>
            </Link>
          ))}
        </nav>

        <section className="adm-section" aria-labelledby="room-title">
          <h2 id="room-title" className="sr-only">
            {room.name}
          </h2>
          {section === "fitting" && <Fitting track={track} existing={live.products} />}
          {section === "offers" && <Offers products={live.products} track={track} />}
          {section === "ledger" && <Ledger products={live.products} track={track} />}
          {section === "daybook" && <DayBook pulls={live.pulls} items={activity} />}
        </section>
      </div>
      <Tickets toasts={toasts} />
    </main>
  );
}
