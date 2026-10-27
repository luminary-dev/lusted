import "server-only";

// The console's bridge to the repository. Every change the owner makes goes through here as a repository_dispatch;
// a workflow (.github/workflows/console-*.yml) applies it on a branch and opens a pull request into dev that merges
// itself once the checks pass — the same road every other change takes, so the rulesets stay intact. The console
// reads the catalogue straight off the dev branch (not the copy baked into its own deploy) and watches those pull
// requests, so it can say "done" the moment a change lands.
//
//   GITHUB_ADMIN_TOKEN   a fine-grained token with Contents read/write and Pull requests read on this repository
//   GITHUB_REPO          "owner/name", defaults to luminary-dev/lusted

const API = "https://api.github.com";
export const BRANCH = "dev";

export function repo(): string {
  return process.env.GITHUB_REPO ?? "luminary-dev/lusted";
}

function headers(accept = "application/vnd.github+json"): Record<string, string> {
  const token = process.env.GITHUB_ADMIN_TOKEN;
  if (!token) throw new Error("GITHUB_ADMIN_TOKEN is not set");
  return { Authorization: `Bearer ${token}`, Accept: accept, "X-GitHub-Api-Version": "2022-11-28", "User-Agent": "lusted-owner-console" };
}

export type DispatchAction = "add-product" | "update-product" | "remove-product" | "bulk-offer";

export async function dispatch(action: DispatchAction, payload: Record<string, unknown>): Promise<void> {
  const response = await fetch(`${API}/repos/${repo()}/dispatches`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ event_type: action, client_payload: payload }),
  });
  if (!response.ok) throw new Error(`GitHub dispatch failed: ${response.status} ${await response.text()}`);
}

// one file off the dev branch, raw (the JSON form only carries files under a megabyte)
export async function getFile(path: string): Promise<Buffer | null> {
  const response = await fetch(`${API}/repos/${repo()}/contents/${path}?ref=${BRANCH}`, {
    headers: headers("application/vnd.github.raw+json"),
    cache: "no-store",
  });
  if (!response.ok) return null;
  return Buffer.from(await response.arrayBuffer());
}

// the latest commits on dev — the activity feed is written from their messages
export async function listRecentCommits(limit: number): Promise<Array<{ message: string; date: string }>> {
  const response = await fetch(`${API}/repos/${repo()}/commits?sha=${BRANCH}&per_page=${limit}`, { headers: headers(), cache: "no-store" });
  if (!response.ok) return [];
  const body = (await response.json()) as Array<{ commit?: { message?: string; committer?: { date?: string } } }>;
  return body.map((entry) => ({ message: (entry.commit?.message ?? "").split("\n")[0], date: entry.commit?.committer?.date ?? "" }));
}

export type ConsolePull = {
  number: number;
  title: string;
  url: string;
  createdAt: string;
  // where it is on the road into dev
  stage: "checks" | "failed" | "ready";
};

// the console's own pull requests still on their way into dev (their branches are named console/…)
export async function listConsolePulls(): Promise<ConsolePull[]> {
  const response = await fetch(`${API}/repos/${repo()}/pulls?state=open&base=${BRANCH}&per_page=30`, { headers: headers(), cache: "no-store" });
  if (!response.ok) return [];
  const body = (await response.json()) as Array<{ number: number; title: string; html_url: string; created_at: string; head: { ref: string; sha: string } }>;
  const ours = body.filter((pull) => pull.head.ref.startsWith("console/"));
  return Promise.all(
    ours.map(async (pull) => {
      let stage: ConsolePull["stage"] = "checks";
      const runs = await fetch(`${API}/repos/${repo()}/commits/${pull.head.sha}/check-runs?per_page=50`, { headers: headers(), cache: "no-store" });
      if (runs.ok) {
        const { check_runs = [] } = (await runs.json()) as { check_runs?: Array<{ status: string; conclusion: string | null }> };
        if (check_runs.some((run) => run.conclusion === "failure" || run.conclusion === "timed_out" || run.conclusion === "cancelled")) stage = "failed";
        else if (check_runs.length > 0 && check_runs.every((run) => run.status === "completed")) stage = "ready";
      }
      return { number: pull.number, title: pull.title, url: pull.html_url, createdAt: pull.created_at, stage };
    }),
  );
}
