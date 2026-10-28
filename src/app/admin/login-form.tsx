"use client";

import Image, { type StaticImageData } from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import wordmark from "@/assets/brand/wordmark-light.png";

// The door to the back room: the photo on one side (a dressing room, lit by the mirror), the sign-in sheet on the
// other. Until the photo is in the bucket the left side is a curtain drawn in CSS.

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
      router.refresh();
      return;
    }
    const body = await response?.json().catch(() => null);
    setError(response?.status === 429 ? (body?.error ?? "Too many tries. Give it ten minutes.") : "That isn’t it. Try again.");
    setBusy(false);
  }

  return (
    <main className="adm adm-login">
      <div className={`adm-door ${photo ? "has-photo" : ""}`} aria-hidden="true">
        {photo && <Image src={photo} alt="" fill priority sizes="(max-width: 860px) 100vw, 56vw" placeholder="blur" className="adm-door-photo" />}
        <div className="adm-door-veil" />
        <p className="adm-door-script">the back room</p>
        <p className="adm-door-line">Where the pieces are chosen, priced and put out front.</p>
      </div>

      <div className="adm-sheet adm-login-sheet">
        <form className="adm-login-card" method="post" action="/api/admin/login" onSubmit={onSubmit}>
          <Image src={wordmark} alt="Lusted" className="adm-wordmark" priority sizes="150px" />
          <p className="adm-eyebrow adm-login-eyebrow">Owner’s entrance</p>
          <h1 className="adm-login-title">
            Come in, <em>if you have the key.</em>
          </h1>
          {!ready && (
            <p className="adm-alert" role="alert">
              The console isn’t set up on this deployment yet: ADMIN_EMAIL, ADMIN_PASSWORD_HASH and ADMIN_SESSION_SECRET are missing.
            </p>
          )}
          <label className="adm-field">
            <span className="adm-label">Email</span>
            <input type="email" name="email" required autoComplete="username" autoFocus className="adm-input" />
          </label>
          <label className="adm-field">
            <span className="adm-label">Password</span>
            <input type="password" name="password" required autoComplete="current-password" className="adm-input" />
          </label>
          {error && (
            <p className="adm-alert" role="alert">
              {error}
            </p>
          )}
          <button type="submit" disabled={busy || !ready} className="adm-btn adm-login-btn">
            {busy ? "Checking…" : "Let me in"}
          </button>
          <p className="adm-help adm-login-foot">Seven days a key, then it asks again. Eight wrong tries and the door stays shut for ten minutes.</p>
        </form>
      </div>
    </main>
  );
}
