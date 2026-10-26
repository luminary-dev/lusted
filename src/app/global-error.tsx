"use client";

import { useEffect } from "react";
import { whatsappLink } from "@/lib/site";

// The last resort: an error in the root layout itself. It replaces the whole document, so none of the site's styles,
// fonts or theme reach it — it carries its own few lines of CSS, in the brand's colours, following the system's
// light or dark setting.
const css = `
:root { color-scheme: light dark; --bg: #f8f1ec; --ink: #2e1418; --muted: #6f5559; --wine: #7a1b33; --on-wine: #fff6f2; }
@media (prefers-color-scheme: dark) { :root { --bg: #140a0c; --ink: #f6e9e4; --muted: #c4aaa6; --wine: #e8a7b2; --on-wine: #140a0c; } }
* { box-sizing: border-box; margin: 0; }
body { min-height: 100svh; display: grid; place-items: center; padding: 32px 20px; background: var(--bg); color: var(--ink);
  font: 16px/1.6 ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; text-align: center; }
main { display: grid; justify-items: center; gap: 16px; max-width: 560px; }
.brand { font: italic 600 40px/1 Georgia, "Times New Roman", serif; color: var(--wine); letter-spacing: 0.01em; }
h1 { font: 500 clamp(28px, 5vw, 40px)/1.15 Georgia, "Times New Roman", serif; }
p { color: var(--muted); }
.actions { display: flex; flex-wrap: wrap; justify-content: center; gap: 12px; margin-top: 8px; }
button, a.btn { display: inline-flex; align-items: center; min-height: 48px; padding: 0 26px; border-radius: 999px;
  font-family: inherit; font-size: 15px; font-weight: 500; line-height: 1; text-decoration: none; cursor: pointer; }
button { border: 0; background: var(--wine); color: var(--on-wine); }
a.btn { border: 1px solid currentColor; color: var(--ink); }
`;

export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <title>Something went wrong — Lusted</title>
        <style dangerouslySetInnerHTML={{ __html: css }} />
        <main>
          <p className="brand">Lusted</p>
          <h1>Something came undone, just for a moment.</h1>
          <p>The site didn’t load as it should. Try again — and if it keeps happening, message us and we’ll take your order by hand.</p>
          <div className="actions">
            <button type="button" onClick={() => retry()}>
              Try again
            </button>
            <a
              className="btn"
              href={whatsappLink("Hi Lusted! Your site didn't load for me — can you help me order?")}
              target="_blank"
              rel="noopener noreferrer"
            >
              Message us on WhatsApp
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
