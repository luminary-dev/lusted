import { expect, test } from "@playwright/test";

// Regression tests for the security pass (SECURITY-FINDINGS.md). Each of the first three fails against the old code.
// Every test keys itself on its own made-up client address, so the per-address limits never collide with the rest
// of the suite or with a reused server.

const unique = () => `198.51.100.${Math.floor(Math.random() * 250) + 1}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

test.describe("security", () => {
  test("login throttle can't be dodged by rotating X-Forwarded-For", async ({ request, baseURL }) => {
    test.setTimeout(60_000);
    const proxyHop = unique(); // the hop the platform's proxy appends — the real caller
    const statuses: number[] = [];
    for (let i = 0; i < 9; i++) {
      const res = await request.post("/api/admin/login", {
        data: { email: "nobody@example.com", password: `wrong-${i}` },
        headers: { origin: baseURL!, "x-forwarded-for": `10.0.0.${i + 1}, ${proxyHop}` },
      });
      statuses.push(res.status());
    }
    expect(statuses.slice(0, 8).every((s) => s === 401)).toBe(true);
    expect(statuses[8]).toBe(429);
  });

  test("login refuses an oversized body", async ({ request, baseURL }) => {
    const res = await request.post("/api/admin/login", {
      data: { email: "nobody@example.com", password: "x".repeat(100_000) },
      headers: { origin: baseURL!, "x-real-ip": unique() },
    });
    expect(res.status()).toBe(413);
  });

  test("the no-JS form sign-in still works and is capped too", async ({ request, baseURL }) => {
    // before hydration the browser posts a form, not JSON: the answer is a 303 back to /admin either way, and the
    // same byte cap applies, so an oversized form can't slip past it
    const ok = await request.post("/api/admin/login", {
      form: { email: "nobody@example.com", password: "wrong" },
      headers: { origin: baseURL!, "x-real-ip": unique() },
      maxRedirects: 0,
    });
    expect(ok.status()).toBe(303);
    const big = await request.post("/api/admin/login", {
      form: { email: "nobody@example.com", password: "x".repeat(100_000) },
      headers: { origin: baseURL!, "x-real-ip": unique() },
      maxRedirects: 0,
    });
    expect(big.status()).toBe(303);
  });

  test("newsletter sign-up refuses an oversized body", async ({ request }) => {
    const res = await request.post("/api/subscribe", { data: { email: "someone@example.com", pad: "x".repeat(100_000) }, headers: { "x-real-ip": unique() } });
    expect(res.status()).toBe(413);
  });

  test("newsletter sign-up is rate limited per address", async ({ request }) => {
    const ip = unique();
    const statuses: number[] = [];
    for (let i = 0; i < 6; i++) {
      const res = await request.post("/api/subscribe", { data: { email: `flood${i}@example.com` }, headers: { "x-real-ip": ip } });
      statuses.push(res.status());
    }
    expect(statuses.slice(0, 5)).not.toContain(429);
    expect(statuses[5]).toBe(429);
    // another address is unaffected
    const other = await request.post("/api/subscribe", { data: { email: "fine@example.com" }, headers: { "x-real-ip": unique() } });
    expect(other.status()).not.toBe(429);
  });

  test("image route serves only manifest paths (no traversal, no other hosts)", async ({ request }) => {
    for (const path of ["/img/..%2F..%2Fetc%2Fpasswd", "/img/%2e%2e/%2e%2e/package.json", "/img/http:%2F%2F169.254.169.254%2Flatest", "/img/v1/images/not-in-manifest.webp"]) {
      const res = await request.get(path, { maxRedirects: 0 });
      expect(res.status(), path).toBe(404);
    }
  });

  test("admin API refuses requests without a session", async ({ request, baseURL }) => {
    for (const route of ["state", "activity"]) expect((await request.get(`/api/admin/${route}`)).status(), route).toBe(401);
    for (const route of ["dispatch", "upload-url", "copy", "products/add"]) {
      const res = await request.post(`/api/admin/${route}`, { data: {}, headers: { origin: baseURL! } });
      expect(res.status(), route).toBe(401);
    }
  });
});