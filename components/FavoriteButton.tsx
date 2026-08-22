"use client";

import { useFavorites } from "@/hooks/useFavorites";

interface Props {
  id: string;
  size?: "sm" | "md";
}

export default function FavoriteButton({ id, size = "md" }: Props) {
  const { has, toggle } = useFavorites();
  const active = has(id);
  const dim = size === "md" ? "h-10 w-10" : "h-8 w-8";

  return (
    <button
      type="button"
      aria-label={active ? "Убрать из избранного" : "Добавить в избранное"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(id);
      }}
      className={`${dim} flex items-center justify-center rounded-full border border-white/10 bg-black/60 backdrop-blur transition-all hover:scale-110 hover:border-white/30 active:scale-95`}
    >
      <svg
        viewBox="0 0 24 24"
        className={size === "md" ? "h-5 w-5" : "h-4 w-4"}
        fill={active ? "#e50914" : "none"}
        stroke={active ? "#e50914" : "#d4d4d8"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  );
}
