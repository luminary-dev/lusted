"use client";

import Link from "next/link";
import { useEffect } from "react";
import StatusPage from "@/components/StatusPage";
import { whatsappLink } from "@/lib/site";

// Anything that throws while a page renders lands here, inside the site's own nav and footer: say so softly, offer to
// try again (`retry` re-fetches and re-renders the page), and keep the way to an order open.
export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <StatusPage
      code="Oh…"
      eyebrow="Something went wrong"
      title={
        <>
          Something came undone, <em>just for a moment.</em>
        </>
      }
      lede="This page didn’t load as it should. Try again — and if it keeps happening, message us and we’ll take your order by hand."
      actions={
        <>
          <button type="button" className="btn btn-wine" onClick={() => retry()}>
            Try again
          </button>
          <a
            href={whatsappLink("Hi Lusted! A page on your site didn't load for me — can you help me order?")}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost"
          >
            Message us on WhatsApp
          </a>
        </>
      }
      links={
        <>
          <Link href="/">Home</Link>
          <Link href="/products">Shop</Link>
          <Link href="/help">Delivery, returns &amp; FAQ</Link>
        </>
      }
    />
  );
}
