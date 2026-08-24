import Link from "next/link";
import {
  formatDuration,
  getFeatured,
  getNewReleases,
  getTrending,
} from "@/lib/movies";
import type { Movie } from "@/lib/types";
import { StarIcon } from "@/components/icons";
import ContinueWatching from "@/components/ContinueWatching";
import { COLLECTIONS } from "@/lib/collections";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-6 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
      {children}
    </h2>
  );
}

function MovieItem({ movie }: { movie: Movie }) {
  return (
    <Link href={`/film/${movie.id}`} className="group block animate-fade-in">
      <div className="aspect-[2/3] overflow-hidden rounded-lg ring-1 ring-fg/10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/posters/${movie.id}.svg`}
          alt={movie.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
      </div>
      <h3 className="mt-3 truncate text-sm font-medium text-fg transition-colors group-hover:text-accent">
        {movie.title}
      </h3>
      <p className="mt-0.5 truncate text-xs text-zinc-500">
        {movie.year} · {movie.genres[0]}
      </p>
    </Link>
  );
}

export default function HomePage() {
  const featured = getFeatured();
  const trending = getTrending();
  const newReleases = getNewReleases();

  return (
    <div className="space-y-16">
      <section className="grid items-center gap-10 pt-4 lg:grid-cols-[1fr_240px]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
            В тренде
          </p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-tight text-fg sm:text-6xl">
            {featured.title}
          </h1>
          <p className="mt-2 text-sm text-zinc-500">{featured.originalTitle}</p>

          <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-zinc-500">
            <span className="inline-flex items-center gap-1 font-medium text-fg">
              <StarIcon className="h-3.5 w-3.5" />
              {featured.rating.toFixed(1)}
            </span>
            <span>{featured.year}</span>
            <span>{formatDuration(featured.duration)}</span>
            <span>{featured.ageRating}+</span>
            <span>{featured.genres.join(", ")}</span>
          </div>

          <p className="mt-4 line-clamp-3 max-w-xl leading-relaxed text-zinc-400">
            {featured.description}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href={`/film/${featured.id}`}
              className="rounded-lg bg-fg px-6 py-2.5 font-medium text-base-950 transition-opacity hover:opacity-85"
            >
              Смотреть
            </Link>
            <Link
              href="/catalog"
              className="rounded-lg border border-fg/15 px-6 py-2.5 font-medium text-fg transition-colors hover:border-fg/40"
            >
              Весь каталог
            </Link>
          </div>
        </div>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/posters/${featured.id}.svg`}
          alt={featured.title}
          className="hidden w-full rounded-xl ring-1 ring-fg/10 lg:block"
        />
      </section>

      <ContinueWatching minimal />

      {trending.length > 0 && (
        <section>
          <SectionLabel>В тренде</SectionLabel>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {trending.map((m) => (
              <MovieItem key={m.id} movie={m} />
            ))}
          </div>
        </section>
      )}

      {newReleases.length > 0 && (
        <section>
          <SectionLabel>Новинки</SectionLabel>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {newReleases.map((m) => (
              <MovieItem key={m.id} movie={m} />
            ))}
          </div>
        </section>
      )}

      <section>
        <SectionLabel>Подборки</SectionLabel>
        <div>
          {COLLECTIONS.slice(0, 3).map((c) => (
            <Link
              key={c.id}
              href={`/collections/${c.id}`}
              className="group -mx-2 flex items-center justify-between gap-4 border-b border-fg/10 px-2 py-4 transition-colors first:border-t hover:bg-fg/[0.04]"
            >
              <span className="flex items-baseline gap-2 whitespace-nowrap text-base font-medium text-fg">
                {c.title}
                <span className="text-sm font-normal text-zinc-500">
                  {c.movies.length}
                </span>
              </span>
              <span className="hidden flex-1 truncate text-sm text-zinc-500 md:block">
                {c.description}
              </span>
              <span
                aria-hidden
                className="text-zinc-500 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-fg"
              >
                →
              </span>
            </Link>
          ))}
        </div>
        <Link
          href="/collections"
          className="mt-4 inline-block text-sm font-medium text-fg underline decoration-fg/30 underline-offset-4 transition-colors hover:decoration-fg"
        >
          Все подборки
        </Link>
      </section>

      <section className="border-t border-fg/10 pb-4 pt-10">
        <SectionLabel>Все фильмы</SectionLabel>
        <p className="text-sm text-zinc-500">
          Ищите по названию, фильтруйте по жанру и году в{" "}
          <Link
            href="/catalog"
            className="font-medium text-fg underline decoration-fg/30 underline-offset-4 transition-colors hover:decoration-fg"
          >
            каталоге
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
