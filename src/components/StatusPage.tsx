import type { ReactNode } from "react";

// The page-not-found and something-went-wrong pages (app/not-found.tsx, app/error.tsx): a big script word, a few short
// lines (one <p> each, so the rhythm is the copy's own), the way back in, and — when there are any — a few links
// onward, inside the site's own nav and footer. No hooks, so the error page (a client component) can use it too; it
// takes its links as props so it never pulls the catalogue into the client.
export default function StatusPage({
  code,
  eyebrow,
  title,
  lede,
  actions,
  links,
}: {
  code: string;
  eyebrow: string;
  title: ReactNode;
  lede: ReactNode;
  actions: ReactNode;
  links?: ReactNode;
}) {
  return (
    <main className="status-page">
      <div className="container status-inner">
        <p className="status-code" aria-hidden="true">
          {code}
        </p>
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="h2">{title}</h1>
        <div className="lede status-lede">{lede}</div>
        <div className="status-actions">{actions}</div>
        {links && (
          <nav className="status-links" aria-label="Elsewhere on Lusted">
            {links}
          </nav>
        )}
      </div>
    </main>
  );
}
