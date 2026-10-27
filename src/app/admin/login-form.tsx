"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import wordmark from "@/assets/brand/wordmark-dark.png";

export function LoginForm({ ready }: { ready: boolean }) {
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
    setError(response?.status === 429 ? (body?.error ?? "Too many attempts — wait a few minutes.") : "That didn’t match. Try again.");
    setBusy(false);
  }

  return (
    <main className="adm adm-login">
      <form className="adm-login-card" onSubmit={onSubmit}>
        <Image src={wordmark} alt="Lusted" className="adm-wordmark" priority sizes="160px" />
        <p className="adm-label adm-login-eyebrow">Private area</p>
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
        <button type="submit" disabled={busy || !ready} className="btn btn-light adm-login-btn">
          {busy ? "Checking…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}
