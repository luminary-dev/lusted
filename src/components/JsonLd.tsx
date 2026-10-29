// Structured data for search engines (schema.org JSON-LD), the way the Next.js docs recommend: a plain script tag in
// the page. Every "<" is escaped so no string in the data (a product description, an answer) can close the tag early.
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
