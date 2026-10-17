import type { Metadata } from "next";
import FavouritesList from "@/components/shop/FavouritesList";

export const metadata: Metadata = {
  title: "Favourites — Lusted",
  description: "The Lusted pieces you've saved.",
};

export default function FavouritesPage() {
  return (
    <main className="shop">
      <div className="container">
        <header className="shop-head">
          <p className="eyebrow">Favourites</p>
          <h1 className="h2">
            Pieces you <em>love.</em>
          </h1>
          <p className="lede">Saved on this device — tap the heart on any piece to add or remove it.</p>
        </header>
        <FavouritesList />
      </div>
    </main>
  );
}
