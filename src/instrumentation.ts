import type { Instrumentation } from "next";

// Any error the server catches — a page that fails to render, a route handler or server action that throws — as one
// JSON line in Vercel's runtime logs (the project's Logs tab), so it can be searched for by "request_error" and found
// by route. A failed page's digest is the same one its error page receives in the browser (production hides the
// message there and keeps the digest), which ties a visitor's report to its log line. Only the path is logged, never
// the query string or the headers, so nothing a visitor typed ends up in the logs.
export const onRequestError: Instrumentation.onRequestError = (err, request, context) => {
  const e = typeof err === "object" && err !== null ? (err as { message?: unknown; digest?: unknown }) : {};
  console.error(
    JSON.stringify({
      event: "request_error",
      route: context.routePath,
      type: context.routeType,
      method: request.method,
      path: request.path.split("?")[0],
      digest: typeof e.digest === "string" ? e.digest : undefined,
      message: (typeof e.message === "string" ? e.message : String(err)).slice(0, 500),
    }),
  );
};
