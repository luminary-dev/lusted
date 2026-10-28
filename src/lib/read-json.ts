// Reads a request body with a hard size cap, for routes anyone on the internet can call. request.json() and
// request.formData() read the whole body into memory first, however large; this stops at `maxBytes` (whatever
// Content-Length claims) so an oversized body costs a few kilobytes, not megabytes.

export type BodyText = { tooLarge: true } | { tooLarge: false; text: string };
export type JsonBody = { tooLarge: true } | { tooLarge: false; value: unknown };

export async function readBody(request: Request, maxBytes: number): Promise<BodyText> {
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) return { tooLarge: true };
  if (!request.body) return { tooLarge: false, text: "" };

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel().catch(() => {});
      return { tooLarge: true };
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return { tooLarge: false, text: new TextDecoder().decode(bytes) };
}

// The parsed body, or null when it isn't JSON.
export async function readJson(request: Request, maxBytes: number): Promise<JsonBody> {
  const read = await readBody(request, maxBytes);
  if (read.tooLarge) return { tooLarge: true };
  try {
    return { tooLarge: false, value: JSON.parse(read.text) };
  } catch {
    return { tooLarge: false, value: null };
  }
}
