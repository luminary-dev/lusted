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

// The shell stays URL-independent; params are read inside Suspense (instant navigation).
// Every slug is prerendered by generateStaticParams, so the fallback is only a safety net.
export default function ProductPage({ params }: PageProps<"/products/[slug]">) {
  return (
    <main className="pdp">
      <div className="container">
        <Suspense fallback={<div className="pdp-skeleton" />}>
          <ProductDetails params={params} />
        </Suspense>
      </div>
    </main>
  );
}

async function ProductDetails({
  params,
}: {
  params: PageProps<"/products/[slug]">["params"];
}) {
  const product = getProduct((await params).slug);
  if (!product) notFound();

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
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
