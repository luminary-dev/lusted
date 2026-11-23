"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { trackEvent } from "@/lib/analytics";
import { formatPrice, getProduct, priceOf } from "@/lib/products";
import { whatsappLink } from "@/lib/site";
import { ArrowRight, ChatBubble, Close, WhatsApp } from "./icons";

// "Ask us": the shop's chat assistant, a small panel over every page. The conversation goes to /api/chat (Claude, with
// the catalogue and the shop's rules — src/lib/chat/prompt.ts) and the reply streams back in as it's written. The
// chat lives only in this tab (sessionStorage), like the bag lives only in this browser; nothing is kept on the server.
// When it can't answer — switched off, busy, or a question for a person — it hands over to WhatsApp.

type Turn = { role: "user" | "assistant"; content: string };

const KEY = "lusted-chat";
const MAX_TURNS = 24; // the route takes twelve exchanges (src/app/api/chat/route.ts)
const GREETING = "Hello, trouble. Tell me what you're aching to be seen in — or slowly taken out of — and I'll find the piece that ruins your plans for the night.";
const STARTERS = ["Dress me for a night I’ll regret", "What comes off fastest?", "Help me find my size", "How do I order?"];
const OFF_DUTY = "I’ve slipped away for a moment — but a real person is waiting on WhatsApp, and they never keep anyone hanging. Tell them what you’re craving.";

// [Name](/products/slug) becomes a link (only to a piece that exists); stray markdown emphasis is dropped
const LINK = /\[([^\]]+)\]\((\/products\/[a-z0-9-]+)\)/g;
function render(text: string, onNavigate: () => void): ReactNode[] {
  return text.split(/\n{2,}/).map((para, i) => {
    const parts: ReactNode[] = [];
    let last = 0;
    for (const m of para.matchAll(LINK)) {
      parts.push(para.slice(last, m.index));
      const p = getProduct(m[2].slice("/products/".length));
      parts.push(
        p ? (
          <Link key={m.index} href={m[2]} onClick={onNavigate}>
            {m[1]}
          </Link>
        ) : (
          m[1]
        ),
      );
      last = m.index + m[0].length;
    }
    parts.push(para.slice(last));
    return <p key={i}>{parts.map((x) => (typeof x === "string" ? x.replace(/\*\*|__/g, "") : x))}</p>;
  });
}

// the route wants a clean user, assistant, user … run ending on the newest message: a reply that never came is left
// out, along with the message it never answered
function alternate(turns: Turn[]): Turn[] {
  const out: Turn[] = [];
  for (const t of turns) {
    if (!t.content) continue;
    if (out.at(-1)?.role === t.role) out.pop();
    out.push(t);
  }
  return out;
}

// the pieces a reply links to, in order, once each
const linked = (text: string) => [...new Set([...text.matchAll(LINK)].map((m) => m[2].slice("/products/".length)))].map(getProduct).filter((p) => !!p);

export default function ChatWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [handOver, setHandOver] = useState(false);
  const input = useRef<HTMLTextAreaElement>(null);
  const log = useRef<HTMLDivElement>(null);
  const launcher = useRef<HTMLButtonElement>(null);
  const abort = useRef<AbortController | null>(null);
  const restored = useRef(false);

  // saved once a reply is complete, not on every streamed word; read back the first time the panel opens
  useEffect(() => {
    if (busy || !restored.current) return;
    try {
      sessionStorage.setItem(KEY, JSON.stringify(turns));
    } catch {}
  }, [turns, busy]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    const t = setTimeout(() => input.current?.focus(), 60);
    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // keep the newest words in view as they stream in
  useEffect(() => {
    log.current?.scrollTo({ top: log.current.scrollHeight });
  }, [turns, open]);

  // not in the owner console, and not over the reveal page (the shop isn't open to chat about yet)
  if (pathname.startsWith("/admin") || pathname === "/revealing-soon") return null;

  function close() {
    setOpen(false);
    launcher.current?.focus({ preventScroll: true });
  }

  async function send(text: string) {
    const content = text.trim();
    if (!content || busy || turns.length >= MAX_TURNS - 1) return;
    const history: Turn[] = [...turns, { role: "user", content: content.slice(0, 800) }];
    setTurns([...history, { role: "assistant", content: "" }]);
    setDraft("");
    setBusy(true);
    setHandOver(false);
    const controller = new AbortController();
    abort.current = controller;
    const say = (reply: string) => setTurns([...history, { role: "assistant", content: reply }]);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: alternate(history) }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        const { error } = (await res.json().catch(() => ({}))) as { error?: string };
        say(res.status === 501 || !error ? OFF_DUTY : error);
        setHandOver(true);
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let reply = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        reply += decoder.decode(value, { stream: true });
        say(reply);
      }
      if (/WhatsApp/.test(reply)) setHandOver(true);
    } catch {
      if (!controller.signal.aborted) {
        say(OFF_DUTY);
        setHandOver(true);
      }
    } finally {
      setBusy(false);
      abort.current = null;
    }
  }

  function startOver() {
    abort.current?.abort();
    setTurns([]);
    setHandOver(false);
    setBusy(false);
    input.current?.focus();
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    send(draft);
  }

  // the WhatsApp hand-over names the pieces talked about, and nothing else — the message stays plain (it's on the
  // shopper's phone, and in the shop's chat list)
  const talkedAbout = [...new Set(turns.filter((t) => t.role === "assistant").flatMap((t) => linked(t.content).map((p) => p.name)))];
  const waText = talkedAbout.length ? `Hi Lusted! I'd like some help with: ${talkedAbout.join(", ")}.` : "Hi Lusted! I'd like some help with an order.";
  const full = turns.length >= MAX_TURNS - 1;

  return (
    <>
      <button
        ref={launcher}
        type="button"
        className={`chat-launcher ${open ? "is-hidden" : ""}`}
        aria-label="Ask us anything"
        aria-expanded={open}
        aria-controls="chat-panel"
        onClick={() => {
          // the chat comes back if the shopper reloaded or moved to another page in this tab
          if (!restored.current) {
            restored.current = true;
            try {
              const saved = JSON.parse(sessionStorage.getItem(KEY) ?? "[]") as Turn[];
              if (Array.isArray(saved) && !turns.length) setTurns(saved.filter((t) => t && (t.role === "user" || t.role === "assistant") && typeof t.content === "string"));
            } catch {}
          }
          setOpen(true);
          trackEvent("chat_open", { page: pathname });
        }}
      >
        <ChatBubble />
        <span>Ask us</span>
      </button>

      <section id="chat-panel" className={`chat-panel ${open ? "is-open" : ""}`} role="dialog" aria-label="Ask Lusted" aria-hidden={!open} inert={!open}>
        <header className="chat-head">
          <div>
            <p className="chat-title">Ask us</p>
            <p className="chat-sub">
              <span className="chat-live" aria-hidden="true" />
              Shop assistant (AI) · real people on WhatsApp
            </p>
          </div>
          {turns.length > 0 && (
            <button type="button" className="chat-restart" onClick={startOver}>
              Start over
            </button>
          )}
          <button type="button" className="icon-btn" aria-label="Close chat" onClick={close}>
            <Close />
          </button>
        </header>

        <div className="chat-log" ref={log} aria-live="polite" aria-busy={busy}>
          <div className="chat-msg is-assistant">{render(GREETING, close)}</div>
          {turns.length === 0 && (
            <div className="chat-starters">
              {STARTERS.map((s) => (
                <button key={s} type="button" onClick={() => send(s)}>
                  {s}
                </button>
              ))}
            </div>
          )}
          {turns.map((t, i) =>
            t.role === "user" ? (
              <div key={i} className="chat-msg is-user">
                <p>{t.content}</p>
              </div>
            ) : (
              <div key={i} className="chat-msg is-assistant">
                {t.content ? render(t.content, close) : <p className="chat-typing" aria-label="Writing">
                  <span />
                  <span />
                  <span />
                </p>}
                {!(busy && i === turns.length - 1) && linked(t.content).length > 0 && (
                  <ul className="chat-pieces">
                    {linked(t.content).slice(0, 3).map((p) => (
                      <li key={p.slug}>
                        <Link href={`/products/${p.slug}`} onClick={close}>
                          <span className="chat-piece-media">
                            <Image src={p.image} alt="" fill sizes="64px" />
                          </span>
                          <span className="chat-piece-name">{p.name}</span>
                          <span className="chat-piece-price">{formatPrice(priceOf(p))}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ),
          )}
          {(handOver || full) && (
            <a className="btn btn-wine chat-wa" data-wa-source="chat" href={whatsappLink(waText)} target="_blank" rel="noopener noreferrer">
              <WhatsApp /> Continue on WhatsApp
            </a>
          )}
          {full && <p className="chat-note">That’s all I can take in one go — start over, or carry on with us on WhatsApp.</p>}
        </div>

        <form className="chat-form" onSubmit={onSubmit}>
          <label htmlFor="chat-input" className="sr-only">
            Your message
          </label>
          <textarea
            id="chat-input"
            ref={input}
            rows={1}
            maxLength={800}
            value={draft}
            placeholder="Tell me what you’re craving…"
            disabled={full}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                send(draft);
              }
            }}
          />
          <button type="submit" className="icon-btn chat-send" aria-label="Send" disabled={busy || !draft.trim() || full}>
            <ArrowRight />
          </button>
        </form>
      </section>
    </>
  );
}
