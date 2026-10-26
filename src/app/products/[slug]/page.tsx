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
  return p ? { title: `${p.name} — Lusted`, description: p.description } : {};
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

  const related = products
    .filter((p) => p.category === product.category && p.slug !== product.slug)
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
            Made for {product.moments.slice(0, -1).join(", ")} &amp; {product.moments.at(-1)}.
          </p>

          <ProductBuy slug={product.slug} />
        </div>
      </div>

      {related.length > 0 && (
        <section className="related">
          <header className="head">
            <div>
              <p className="eyebrow">More from {collectionName(product.category)}</p>
              <h2 className="h2">
                If the <em>{product.name}</em> tempted you…
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
