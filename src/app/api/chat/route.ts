// The shop's chat assistant (src/components/ChatWidget.tsx): the conversation so far in, Claude's reply streamed back
// as plain text. What it knows and how it talks is src/lib/chat/prompt.ts. Needs ANTHROPIC_API_KEY on the server
// (the same key the console's copywriter uses); without it the route answers 501 and the panel sends shoppers to
// WhatsApp instead. Anyone can reach this route and every reply costs money, so it only takes short conversations
// from the site's own pages, a few messages a minute from each address, and nothing before the reveal.
import Anthropic from "@anthropic-ai/sdk";
import { isSameOrigin } from "@/lib/admin/guard";
import { clientKey, overLimit } from "@/lib/admin/rate-limit";
import { SYSTEM } from "@/lib/chat/prompt";
import { readJson } from "@/lib/read-json";
import { site } from "@/lib/site";

const MODEL = "claude-opus-5-5";
const MAX_BODY_BYTES = 24 * 1024;
const MAX_MESSAGES = 24; // twelve exchanges; a longer chat starts again (the panel says so)
const MAX_USER_CHARS = 800;
const MAX_REPLY_CHARS = 4000;
const PER_MINUTE = 8;
const PER_HOUR = 60;

// The reveal gate (src/proxy.ts) covers pages, not the API, so it is repeated here: before reveal day only the people
// who can see the shop — the preview cookie, a dev. host, a deployment with REVEAL_GATE=off — can talk to it.
const REVEAL_AT = Date.parse(site.revealAt);
function gated(request: Request): boolean {
  if (!site.revealGate || Date.now() >= REVEAL_AT || process.env.REVEAL_GATE === "off") return false;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "";
  if (host.startsWith("dev.")) return false;
  return !/(?:^|;\s*)lusted-preview=1(?:;|$)/.test(request.headers.get("cookie") ?? "");
}

type Turn = { role: "user" | "assistant"; content: string };

// a conversation is user, assistant, user … ending with the shopper's newest message
function parseTurns(value: unknown): Turn[] | null {
  const list = value && typeof value === "object" ? (value as { messages?: unknown }).messages : undefined;
  if (!Array.isArray(list) || list.length === 0 || list.length > MAX_MESSAGES || list.length % 2 === 0) return null;
  const turns: Turn[] = [];
  for (const [i, m] of list.entries()) {
    const role = i % 2 === 0 ? "user" : "assistant";
    const content = m && typeof m === "object" ? (m as { content?: unknown }).content : undefined;
    if ((m as { role?: unknown }).role !== role || typeof content !== "string") return null;
    const text = content.trim();
    if (!text || text.length > (role === "user" ? MAX_USER_CHARS : MAX_REPLY_CHARS)) return null;
    turns.push({ role, content: text });
  }
  return turns;
}

// the site never shows an emoji (the same clean-up as the console's copywriter, src/lib/admin/copy.ts)
const stripEmoji = (s: string) => s.replace(/[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}‍️⃣]/gu, "");

export async function POST(request: Request) {
  // only the site's own panel: a page elsewhere can't run up the bill through a visitor's browser (see the newsletter
  // route for why a request with neither header is let through to the same limits)
  const fromBrowser = request.headers.has("origin") || request.headers.has("sec-fetch-site");
  if (fromBrowser && !isSameOrigin(request)) return Response.json({ error: "Chat with us on our website." }, { status: 403 });
  if (gated(request)) return Response.json({ error: "Not yet — the shop opens soon." }, { status: 403 });

  const read = await readJson(request, MAX_BODY_BYTES);
  if (read.tooLarge) return Response.json({ error: "That conversation is too long — start a new one." }, { status: 413 });
  const turns = parseTurns(read.value);
  if (!turns) return Response.json({ error: "That message didn't come through — try again." }, { status: 400 });

  const ip = clientKey(request);
  if (overLimit(`chat:${ip}`, PER_MINUTE, 60 * 1000) || overLimit(`chat-hour:${ip}`, PER_HOUR, 60 * 60 * 1000)) {
    return Response.json({ error: "Slow down, you greedy thing — try again in a minute." }, { status: 429, headers: { "Retry-After": "60" } });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return Response.json({ error: "Chat isn't switched on yet." }, { status: 501 });

  const client = new Anthropic({ apiKey, maxRetries: 1 });
  const stream = client.beta.messages.stream(
    {
      model: MODEL,
      max_tokens: 2048,
      // a chat reply is short and mostly recall: the lowest effort answers fastest and costs least
      output_config: { effort: "low" },
      // the catalogue and the rules are the same for everyone, so they're cached and only the conversation is new
      system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
      messages: turns,
      // if Claude's safeguards decline a turn, the API runs it again on the model they route to, in the same call
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
    },
    { signal: request.signal },
  );

  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      let said = false;
      try {
        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            const text = stripEmoji(event.delta.text);
            if (text) {
              said = true;
              controller.enqueue(encoder.encode(text));
            }
          }
        }
        const message = await stream.finalMessage();
        if (message.stop_reason === "refusal" || !said) {
          controller.enqueue(encoder.encode(`${said ? "\n\n" : ""}That one's better whispered on WhatsApp — message us and a real person will take care of you.`));
        }
      } catch (error) {
        if (!request.signal.aborted) {
          console.error("chat: Claude failed", error instanceof Anthropic.APIError ? `${error.status} ${error.message}` : error);
          controller.enqueue(encoder.encode(`${said ? "\n\n" : ""}I've lost my train of thought — message us on WhatsApp and we'll pick up where we left off.`));
        }
      } finally {
        controller.close();
      }
    },
    cancel() {
      stream.abort();
    },
  });

  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
}
