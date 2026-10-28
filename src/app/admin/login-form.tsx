"use client";

import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import wordmarkDark from "@/assets/brand/wordmark-dark.png";

// The door to the back room: a photo in a frame on one side (a dressing room after closing), the invitation and the
// form on the other. Until the photos are in the bucket the frame holds a drawn curtain.

const INSIDE = [
  ["The rail", "Pieces nobody has worn yet, waiting to be priced and put out front."],
  ["The ledger", "Every piece on the site — rename it, re-price it, put it on offer, or retire it."],
  ["The fitting", "Three photos, a few words from you, and Claude writes the rest in our voice."],
  ["The day book", "What landed overnight, and what is still on its way."],
];

export function LoginForm({ ready, photo }: { ready: boolean; photo: StaticImageData | null }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    const data = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: data.get("email"), password: data.get("password") }),
    }).catch(() => null);
    if (response?.ok) {
      router.push("/admin/ledger");
      router.refresh();
      return;
    }
    const body = await response?.json().catch(() => null);
    setError(response?.status === 429 ? (body?.error ?? "Too many tries. Give it ten minutes.") : "That isn’t it. Try again.");
    setBusy(false);
  }

  return (
    <main className="adm adm-login">
      <div className="adm-login-grid">
        <figure className={`adm-frame ${photo ? "has-photo" : ""}`}>
          {photo && <Image src={photo} alt="" fill priority sizes="(max-width: 860px) 100vw, 44vw" placeholder="blur" className="adm-frame-photo" />}
          <div className="adm-frame-veil" aria-hidden="true" />
          <Image src={wordmarkDark} alt="Lusted" className="adm-frame-mark" priority sizes="120px" />
          <figcaption className="adm-frame-caption">
            <span className="adm-script">after closing</span>
            <span>She has been waiting since the last customer left. The lights in the mirror are still on.</span>
          </figcaption>
        </figure>

        <div className="adm-login-side">
          <p className="adm-login-top">
            <span className="adm-eyebrow">Owner’s entrance</span>
            <Link href="/" className="adm-quiet">
              Not the owner? The shop is out front
            </Link>
          </p>
          <h1 className="adm-login-title">
            Come in, <span className="adm-script">if you have the key.</span>
          </h1>
          <p className="adm-login-lede">
            This is where the pieces are chosen, priced and sent out to be taken off someone. Nothing in here is for the customers’ eyes — only for the one
            who decides what they get to wear, and for how long.
          </p>

          <form className="adm-login-card" method="post" action="/api/admin/login" onSubmit={onSubmit}>
            {!ready && (
              <p className="adm-alert" role="alert">
                The console isn’t set up on this deployment yet: ADMIN_EMAIL, ADMIN_PASSWORD_HASH and ADMIN_SESSION_SECRET are missing.
              </p>
            )}
            <label className="adm-pill">
              <span className="sr-only">Email</span>
              <input type="email" name="email" required autoComplete="username" autoFocus placeholder="Email" />
            </label>
            <label className="adm-pill">
              <span className="sr-only">Password</span>
              <input type="password" name="password" required autoComplete="current-password" placeholder="Password" />
            </label>
            {error && (
              <p className="adm-alert" role="alert">
                {error}
              </p>
            )}
            <button type="submit" disabled={busy || !ready} className="adm-btn adm-btn-wide">
              <span>{busy ? "Checking…" : "Let me in"}</span>
              <span className="adm-btn-arrow" aria-hidden="true">
                →
              </span>
            </button>
            <p className="adm-help">Seven days a key, then it asks again. Eight wrong tries and the door stays shut for ten minutes.</p>
          </form>

          <div className="adm-inside">
            <p className="adm-eyebrow adm-inside-head">Waiting inside</p>
            <dl>
              {INSIDE.map(([name, line]) => (
                <div key={name}>
                  <dt>{name}</dt>
                  <dd>{line}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </main>
  );
}
