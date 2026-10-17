import Link from "next/link";
import type { ReactNode } from "react";

export type LegalSection = { id: string; title: string; body: ReactNode };

// Shared layout for the privacy policy and terms: sticky contents list + readable prose column.
export default function LegalPage({ eyebrow, title, updated, intro, sections }: { eyebrow: string; title: ReactNode; updated: string; intro: ReactNode; sections: LegalSection[] }) {
  return (
    <main className="legal">
      <div className="container">
        <header className="legal-head">
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span>/</span>
            <span>{eyebrow}</span>
          </nav>
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="h2">{title}</h1>
          <p className="legal-updated">Last updated {updated}</p>
          <div className="lede">{intro}</div>
        </header>

        <div className="legal-grid">
          <aside className="legal-toc" aria-label="On this page">
            <p>On this page</p>
            <ol>
              {sections.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`}>{s.title}</a>
                </li>
              ))}
            </ol>
          </aside>
          <article className="prose">
            {sections.map((s, i) => (
              <section key={s.id} id={s.id}>
                <h2>
                  <span>{String(i + 1).padStart(2, "0")}</span> {s.title}
                </h2>
                {s.body}
              </section>
            ))}
          </article>
        </div>
      </div>
    </main>
  );
}
