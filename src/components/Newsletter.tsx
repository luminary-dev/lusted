"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight } from "./icons";

type Status = "idle" | "loading" | "done" | "unavailable" | "error";

const messages: Record<Status, string> = {
  idle: "No spam. Just the pretty, filthy things — first.",
  loading: "Joining…",
  done: "You’re in. We’ll whisper to you before anyone else hears.",
  unavailable: "Sign-ups open soon — message us on WhatsApp in the meantime.",
  error: "Something went wrong — please try again.",
};

export default function Newsletter() {
  const [status, setStatus] = useState<Status>("idle");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setStatus("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: new FormData(form).get("email") }),
      });
      if (res.ok) {
        form.reset();
        setStatus("done");
      } else setStatus(res.status === 501 ? "unavailable" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <form className="news-form" onSubmit={onSubmit}>
      <div className="news-row">
        <input type="email" name="email" required autoComplete="email" placeholder="Your email address" aria-label="Email address" />
        <button type="submit" className="btn btn-light" disabled={status === "loading"}>
          Subscribe <ArrowRight className="arrow" />
        </button>
      </div>
      <p className="news-note" role="status">
        {messages[status]}
      </p>
    </form>
  );
}
