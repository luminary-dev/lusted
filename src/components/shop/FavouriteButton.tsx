"use client";

import { toggleFavourite, useFavourites } from "@/lib/favourites";
import { Heart } from "../icons";

export default function FavouriteButton({ slug, name, className = "" }: { slug: string; name: string; className?: string }) {
  const saved = useFavourites().includes(slug);
  return (
    <button
      type="button"
      className={`fav-btn ${saved ? "is-saved" : ""} ${className}`}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${name} from favourites` : `Save ${name} to favourites`}
      onClick={(e) => {
        e.preventDefault();
        toggleFavourite(slug);
      }}
    >
      <Heart />
    </button>
  );
}
