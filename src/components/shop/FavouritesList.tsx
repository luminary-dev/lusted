"use client";

import Link from "next/link";
import { useFavourites } from "@/lib/favourites";
import { getProduct, type Product } from "@/lib/products";
import { whatsappLink } from "@/lib/site";
import ProductCard from "./ProductCard";
import { ArrowRight, WhatsApp } from "../icons";

export default function FavouritesList() {
  const saved = useFavourites()
    .map(getProduct)
    .filter((p): p is Product => !!p);

  if (!saved.length) {
    return (
      <div className="empty fav-empty">
        <h2 className="h3">No favourites yet.</h2>
        <p>Tap the heart on any piece to save it here for later.</p>
        <Link href="/products" className="btn btn-wine">
          Browse the shop <ArrowRight className="arrow" />
        </Link>
      </div>
    );
  }

  const ask = `Hi Lusted! I'm interested in these pieces:\n\n${saved.map((p) => `• ${p.name}`).join("\n")}`;
  return (
    <>
      <div className="results-bar fav-bar">
        <p>
          {saved.length} saved {saved.length === 1 ? "piece" : "pieces"}
        </p>
        <a className="btn btn-ghost" href={whatsappLink(ask)} target="_blank" rel="noopener noreferrer">
          <WhatsApp /> Ask about these on WhatsApp
        </a>
      </div>
      <div className="product-grid fav-grid">
        {saved.map((p) => (
          <ProductCard key={p.slug} product={p} />
        ))}
      </div>
    </>
  );
}
