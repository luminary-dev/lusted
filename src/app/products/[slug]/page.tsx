import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import ProductBuy from "@/components/shop/ProductBuy";
import PdpGallery from "@/components/shop/PdpGallery";
import ProductCard, { Price } from "@/components/shop/ProductCard";
import { collectionName, getProduct, products } from "@/lib/products";

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/products/[slug]">): Promise<Metadata> {
  const p = getProduct((await params).slug);
  if (!p) return {};
  const title = `${p.name} — Lusted`;
  // a shared link previews the piece itself: its front photo through the image optimiser (a ~60 KB file, well inside
  // what WhatsApp and the other apps will fetch for a preview), at its own 9:16 shape
  const w = 828;
  const image = { url: `/_next/image?url=${encodeURIComponent(p.image.src)}&w=${w}&q=75`, width: w, height: Math.round((w * p.image.height) / p.image.width), alt: p.name };
  return {
    title,
    description: p.description,
    alternates: { canonical: `/products/${p.slug}` }, // the colour and other query strings are the same page
    openGraph: { title, description: p.description, type: "website", url: `/products/${p.slug}`, images: [image] },
    twitter: { card: "summary_large_image", images: [image] },
  };
}

// Every slug is prerendered by generateStaticParams. The slug is resolved here, before anything streams, so an
// unknown piece is a real 404 response rather than a 200 carrying a not-found body.
export default async function ProductPage({ params }: PageProps<"/products/[slug]">) {
  const product = getProduct((await params).slug);
  if (!product) notFound();
  return (
    <main className="pdp">
      <div className="container">
        <Suspense fallback={<div className="pdp-skeleton" />}>
          <ProductDetails product={product} />
        </Suspense>
      </div>
    </main>
  );
}

function ProductDetails({ product }: { product: NonNullable<ReturnType<typeof getProduct>> }) {

  // The pieces made to be worn with it. A slug the catalogue no longer has (or that isn't photographed yet) is skipped
  // rather than trusted, so a stale pairing never breaks the page.
  const pairs = [...new Set(product.pairsWith ?? [])]
    .filter((slug) => slug !== product.slug)
    .map(getProduct)
    .filter((p) => p !== undefined);
  // the set already has its own row, so its pieces are left out of the related one
  const related = products
    .filter((p) => p.category === product.category && p.slug !== product.slug && !pairs.includes(p))
    .slice(0, 4);

  return (
    <>
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href="/products">Shop</Link>
        <span>/</span>
        <Link href={`/products?cat=${product.category}`}>
          {collectionName(product.category)}
        </Link>
      </nav>

      <div className="pdp-grid">
        <PdpGallery product={product} />

        <div className="pdp-info">
          <p className="eyebrow">{collectionName(product.category)}</p>
          <h1 className="h2">{product.name}</h1>
          <div className="pdp-price">
            <Price product={product} />
          </div>
          <p className="lede">{product.description}</p>
          <p className="pdp-moments">
            Wear it for {product.moments.slice(0, -1).join(", ")} &amp; {product.moments.at(-1)}. Then don’t.
          </p>

          <ProductBuy slug={product.slug} />

          {/* the catalogue's fabric, construction and care lines, as written — rendered on the server, so they are
              in the page's HTML for search engines as well as shoppers */}
          {product.details.length > 0 && (
            <section className="pdp-details" aria-labelledby="pdp-details-title">
              <h2 id="pdp-details-title" className="pdp-details-title">
                Details &amp; care
              </h2>
              <ul>
                {product.details.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>

      {pairs.length > 0 && (
        <section className="pairs">
          <header className="head">
            <div>
              <p className="eyebrow">Complete the set</p>
              <h2 className="h2">
                Made to be worn with the <em>{product.name}</em>
              </h2>
            </div>
          </header>
          <div className="product-grid related-grid">
            {pairs.map((p) => (
              <ProductCard key={p.slug} product={p} sizes="(min-width: 1460px) 320px, (min-width: 1081px) 22vw, 44vw" />
            ))}
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section className="related">
          <header className="head">
            <div>
              <p className="eyebrow">More from {collectionName(product.category)}</p>
              <h2 className="h2">
                If the <em>{product.name}</em> got under your skin…
              </h2>
            </div>
          </header>
          <div className="product-grid related-grid">
            {related.map((p) => (
              <ProductCard key={p.slug} product={p} sizes="(min-width: 1460px) 320px, (min-width: 1081px) 22vw, 44vw" />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
