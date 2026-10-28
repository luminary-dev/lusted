"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import wordmark from "@/assets/brand/wordmark-dark.png";
import type { DoorPhoto } from "./photos";

// The door to the back room: the photo on one side (a dressing room after closing, a different one each visit), and
// on the other only what's needed to come in — the wordmark, one line, two fields, the button. Until the photos are
// in the bucket the left side is a drawn curtain.

export function LoginForm({ ready, photo }: { ready: boolean; photo: DoorPhoto | null }) {
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
    <main className={`adm adm-login ${photo?.wide ? "has-wide" : ""}`}>
      {photo?.wide && (
        <>
          <Image src={photo.wide} alt="" fill priority sizes="100vw" placeholder="blur" className="adm-wide" aria-hidden="true" />
          <Image src={wordmark} alt="" className="adm-wide-mark" sizes="160px" aria-hidden="true" />
        </>
      )}
      <figure className={`adm-frame ${photo ? "has-photo" : ""}`}>
        {photo && <Image src={photo.src} alt="" fill priority sizes="(max-width: 860px) 100vw, 50vw" placeholder="blur" className="adm-frame-photo" />}
        <div className="adm-frame-veil" aria-hidden="true" />
        <figcaption className="adm-frame-caption">
          <span className="adm-script">{photo?.script ?? "after closing"}</span>
          <span>{photo?.line ?? "The shop is shut. The back room never is."}</span>
        </figcaption>
      </figure>

      <div className="adm-login-side">
        <form className="adm-login-card" method="post" action="/api/admin/login" onSubmit={onSubmit}>
          <Image src={wordmark} alt="Lusted" className="adm-wordmark" priority sizes="220px" />
          <p className="adm-eyebrow">Owner’s entrance · after hours</p>
          <h1 className="adm-login-title">
            Come in, <span className="adm-script">if you have the key.</span>
          </h1>
          <p className="adm-login-lede">
            She’s been waiting in the back since the last customer left: lights on, door unlocked, not much else on. Everything in here comes off —
            the prices, the pieces, and whatever she’s still wearing by the time you’ve typed the password.
          </p>
          <ul className="adm-rules" aria-label="House rules">
            <li>Say the password like you mean it. She can tell.</li>
            <li>Touch everything. Price it, put it on offer, take it off the shelf. Nothing in here says no.</li>
            <li>What happens in the back room stays in the back room, except the parts that reach the dev site.</li>
          </ul>
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
          <p className="adm-login-foot">
            <span className="adm-help">Seven days a key, then she asks again. Get it wrong eight times and she locks the door and makes you wait ten minutes.</span>
            <Link href="/" className="adm-quiet">
              The shop is out front
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
