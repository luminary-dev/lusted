import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { ADMIN_COOKIE, configured, verifySessionToken } from "@/lib/admin/auth";
import { LoginForm } from "./login-form";
import { figures, tonight } from "./photos";

// The door to the back room. Unlinked from every page, kept out of search, never cached (next.config.ts). Without a
// session cookie this is the sign-in page; with one it goes straight through to the first room, the ledger.
// The rooms themselves are /admin/<section> ([section]/page.tsx).

export const metadata: Metadata = {
  title: "Lusted — the back room",
  robots: { index: false, follow: false },
};

// Every visit reads the session cookie, so there is nothing to prerender: the page blocks on the server (the Cache
// Components guide's choice for a signed-in page) rather than streaming a shell no one needs.
export const instant = false;

export default async function AdminPage() {
  await connection(); // rendered per request: the photo is a fresh draw each visit
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (verifySessionToken(token)) redirect("/admin/ledger");
  return <LoginForm ready={configured()} photo={tonight()} figures={figures} />;
}
