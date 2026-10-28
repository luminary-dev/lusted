import type { Metadata } from "next";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, configured, verifySessionToken } from "@/lib/admin/auth";
import catalog from "@/lib/catalog.json";
import { img, type ImagePath } from "@/lib/cdn";
import manifest from "@/lib/image-manifest.json";
import { Console, type CatalogEntry } from "./console";
import { LoginForm } from "./login-form";

// The owner's console — "the back room". Unlinked from every page, kept out of search, never cached (next.config.ts),
// and gated by the session cookie: without one, only the sign-in page. Everything inside goes through GitHub
// (lib/admin/github.ts) and lands on the dev site as a pull request that merges itself when the checks pass.

export const metadata: Metadata = {
  title: "Lusted — the back room",
  robots: { index: false, follow: false },
};

// Every visit reads the session cookie, so there is nothing to prerender: the page blocks on the server (the Cache
// Components guide's choice for a signed-in page) rather than streaming a shell no one needs.
export const instant = false;

// the sign-in page's photos (about-wall/admin-login-prompt.txt, one per scene): every photo in the manifest under
// images/admin/back-room-*.webp, and the door shows a different one each time it's opened. Without any, a curtain.
const photos = (Object.keys(manifest.images) as ImagePath[]).filter((key) => /^images\/admin\/back-room-.*\.webp$/.test(key)).map((key) => img(key));
// which one tonight: the page is rendered per request (instant = false), so this is a fresh draw each visit; it lives
// outside the component because a render itself has to stay pure
const tonight = () => (photos.length ? photos[Math.floor(Math.random() * photos.length)] : null);

export default async function AdminPage() {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!verifySessionToken(token)) return <LoginForm ready={configured()} photo={tonight()} />;
  return <Console initial={catalog as CatalogEntry[]} />;
}
