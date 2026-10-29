import type { Metadata } from "next";
import FavouritesList from "@/components/shop/FavouritesList";

export const metadata: Metadata = {
  title: "Favourites — Lusted",
  description: "The Lusted pieces you can’t stop thinking about.",
  // each visitor's own list, kept in their browser — nothing for a search engine to index, so no canonical either
  // (robots.txt keeps crawlers out; this covers a link to it found elsewhere)
  robots: { index: false },
};

export default function FavouritesPage() {
  return (
    <main className="shop">
      <div className="container">
        <header className="shop-head">
          <p className="eyebrow">Can’t stop thinking about</p>
          <h1 className="h2">
            The ones you <em>keep coming back to.</em>
          </h1>
          <p className="lede">Saved on this device — tap the heart on any piece to keep it close, or let it go.</p>
        </header>
        <FavouritesList />
      </div>
    </main>
  );
}
