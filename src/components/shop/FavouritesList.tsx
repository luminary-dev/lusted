"use client";

import Link from "next/link";
import { useFavourites } from "@/lib/favourites";
import { getProduct, type Product } from "@/lib/products";
import { productUrl, useOrigin } from "@/lib/order";
import { whatsappLink } from "@/lib/site";
import HintButton from "./HintButton";
import ProductCard from "./ProductCard";
import { ArrowRight, WhatsApp } from "../icons";

export default function FavouritesList() {
  const saved = useFavourites()
    .map(getProduct)
    .filter((p): p is Product => !!p);
  const origin = useOrigin();

  if (!saved.length) {
    return (
      <div className="empty fav-empty">
        <h2 className="h3">No favourites yet.</h2>
        <p>Tap the heart on any piece that gets your pulse going, and it’ll be waiting for you here.</p>
        <Link href="/products" className="btn btn-wine">
          Browse the shop, go on <ArrowRight className="arrow" />
        </Link>
      </div>
    );
  }

  const ask = `Hi Lusted! I'm interested in these pieces:\n\n${saved.map((p) => `• ${p.name}`).join("\n")}`;
  // the whole list as one hint, each piece with its link, so whoever gets it can choose
  const hint = `Picture me in ${saved.length === 1 ? "this" : "these"} — then picture peeling ${saved.length === 1 ? "it" : "them"} off me. Consider this a hint.\n\n${saved.map((p) => `• ${p.name}\n${productUrl(origin, p.slug)}`).join("\n")}`;
  return (
    <>
      <div className="results-bar fav-bar">
        <p>
          {saved.length} saved {saved.length === 1 ? "piece" : "pieces"}
        </p>
        <a className="btn btn-ghost" data-wa-source="favourites" href={whatsappLink(ask)} target="_blank" rel="noopener noreferrer">
          <WhatsApp /> Ask about these on WhatsApp
        </a>
        <HintButton title="A hint from Lusted" text={hint} copy={hint} copyLabel="Copy the list" source="favourites" />
      </div>
      <div className="product-grid fav-grid">
        {saved.map((p) => (
          <ProductCard key={p.slug} product={p} />
        ))}
      </div>
    </>
  );
}
