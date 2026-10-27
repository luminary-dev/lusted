import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/guard";
import { getFile, listRecentCommits } from "@/lib/admin/github";

// The activity feed: the latest things that happened on the dev branch, as plain sentences, read off the commit
// history. The console's own workflows write exactly what changed as the commit message ("admin: …"), so those come
// through as they are; everything else is summarised from its first line.

export async function GET(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  let commits: Awaited<ReturnType<typeof listRecentCommits>>;
  let catalogFile: Buffer | null;
  try {
    [commits, catalogFile] = await Promise.all([listRecentCommits(25), getFile("src/lib/catalog.json")]);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: "GitHub could not be reached" }, { status: 502 });
  }
  const names = new Map<string, string>();
  try {
    if (catalogFile) for (const p of JSON.parse(catalogFile.toString("utf8")) as Array<{ slug: string; name: string }>) names.set(p.slug, p.name);
  } catch {
    /* slugs still read fine */
  }

  const items: Array<{ text: string; at: string }> = [];
  for (const commit of commits) {
    const m = commit.message;
    let text: string;
    if (m.startsWith("admin: ")) text = m.slice(7);
    else if (/^Merge pull request #\d+ from [^/]+\/console\//.test(m)) continue; // the merge of a console change; its own commit says what
    else if (/^Merge pull request #\d+/.test(m)) text = `Merged ${m.replace(/^Merge pull request /, "pull request ").replace(/ from .*$/, "")}.`;
    else if (/^Merge branch/.test(m)) continue;
    else text = `Site update — ${m.replace(/^[\w-]+: /, "")}.`;
    items.push({ text, at: commit.date });
    if (items.length === 8) break;
  }
  return NextResponse.json({ ok: true, items, names: Object.fromEntries(names) });
}
