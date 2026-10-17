// Cached at build/revalidation time — the copyright year doesn't need per-request rendering.
export default async function Year() {
  "use cache";
  return <>{new Date().getFullYear()}</>;
}
