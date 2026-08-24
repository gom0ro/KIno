import Link from "next/link";
import type { Movie } from "@/lib/types";
import { formatDuration } from "@/lib/movies";
import RatingBadge from "./RatingBadge";

export default function MovieCard({ movie }: { movie: Movie }) {
  return (
    <div className="group relative animate-fade-in">
      <Link
        href={`/film/${movie.id}`}
        className="block overflow-hidden rounded-xl border border-fg/5 bg-base-800 transition-all duration-300 hover:-translate-y-1 hover:border-accent/60 hover:shadow-[0_12px_40px_-12px_rgba(229,9,20,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <div className="relative aspect-[2/3] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/posters/${movie.id}.svg`}
            alt={movie.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <div className="absolute inset-x-0 bottom-0 translate-y-2 p-3 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <p className="line-clamp-3 text-xs leading-relaxed text-zinc-300">
              {movie.description}
            </p>
            <p className="mt-1.5 text-xs font-medium text-zinc-400">
              {movie.year} · {formatDuration(movie.duration)}
            </p>
          </div>
          <RatingBadge rating={movie.rating} className="absolute left-2 top-2 shadow" />
          {(movie.isNew || movie.trending) && (
            <span
              className={`absolute right-2 top-2 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white ${
                movie.trending ? "bg-accent" : "bg-sky-600"
              }`}
            >
              {movie.trending ? "В тренде" : "Новинка"}
            </span>
          )}
        </div>
        <div className="p-3">
          <h3 className="truncate text-sm font-semibold text-fg">
            {movie.title}
          </h3>
          <p className="mt-0.5 truncate text-xs text-zinc-500">
            {movie.genres.join(", ")}
          </p>
        </div>
      </Link>
    </div>
  );
}
