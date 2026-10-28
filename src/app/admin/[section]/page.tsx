import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { ADMIN_COOKIE, configured, verifySessionToken } from "@/lib/admin/auth";
import catalog from "@/lib/catalog.json";
import { Console, type CatalogEntry } from "../console";
import { LoginForm } from "../login-form";
import { tonight } from "../photos";
import { SECTIONS, type Section } from "../sections";

// The four rooms of the back room, one page each: /admin/fitting (add a piece), /admin/offers, /admin/ledger (the
// catalogue) and /admin/daybook (what happened). Every page carries the same header — the doors out, the title, the
// day's figures and the way to the other three — and without a session each one is the sign-in page instead.

export const instant = false;

export async function generateMetadata({ params }: PageProps<"/admin/[section]">): Promise<Metadata> {
  const { section } = await params;
  const room = SECTIONS.find((s) => s.id === section);
  return { title: room ? `Lusted — the back room · ${room.name}` : "Lusted — the back room", robots: { index: false, follow: false } };
}

export default async function SectionPage({ params }: PageProps<"/admin/[section]">) {
  const { section } = await params;
  if (!SECTIONS.some((s) => s.id === section)) notFound();
  await connection(); // rendered per request: the sign-in photo is a fresh draw, the console reads live state
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!verifySessionToken(token)) return <LoginForm ready={configured()} photo={tonight()} />;
  return <Console section={section as Section} initial={catalog as CatalogEntry[]} />;
}
