import Link from "next/link";
import {
  formatDuration,
  getFeatured,
  getNewReleases,
  getTrending,
  getGenres,
  MOVIES,
} from "@/lib/movies";
import type { Movie } from "@/lib/types";
import { PlayIcon, StarIcon } from "@/components/icons";
import ContinueWatching from "@/components/ContinueWatching";
import { COLLECTIONS } from "@/lib/collections";
import HeroSearch from "@/components/HeroSearch";

const GENRES = getGenres().slice(0, 10);

function SectionHeader({
  children,
  href,
  count,
}: {
  children: React.ReactNode;
  href?: string;
  count?: number;
}) {
  return (
    <div className="mb-6 flex items-end justify-between">
      <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
        {children}
        {count !== undefined && (
          <span className="ml-2 text-zinc-600">{count}</span>
        )}
      </h2>
      {href && (
        <Link
          href={href}
          className="text-xs font-medium text-zinc-500 transition-colors hover:text-fg"
        >
          Все →
        </Link>
      )}
    </div>
  );
}

function MovieCard({ movie }: { movie: Movie }) {
  return (
    <Link href={`/film/${movie.id}`} className="group block animate-fade-in">
      <div className="relative aspect-[2/3] overflow-hidden rounded-xl ring-1 ring-fg/10 transition-all duration-300 group-hover:ring-accent/40 group-hover:shadow-lg group-hover:shadow-accent/10">
        <img
          src={`/posters/${movie.id}.svg`}
          alt={movie.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <div className="absolute bottom-0 left-0 right-0 translate-y-2 p-3 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <span className="inline-flex items-center gap-1 rounded-md bg-accent/90 px-2 py-1 text-[10px] font-bold text-white backdrop-blur">
            <PlayIcon className="h-2.5 w-2.5" />
            Смотреть
          </span>
        </div>
        <span className="absolute right-2 top-2 flex items-center gap-0.5 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-zinc-100 shadow-sm backdrop-blur-md">
          <StarIcon className="h-2.5 w-2.5 text-amber-400" />
          {movie.rating.toFixed(1)}
        </span>
      </div>
      <h3 className="mt-2.5 truncate text-sm font-medium text-fg transition-colors group-hover:text-accent">
        {movie.title}
      </h3>
      <p className="mt-0.5 truncate text-xs text-zinc-500">
        {movie.year} · {movie.genres[0]}
      </p>
    </Link>
  );
}

function CollectionCard({
  collection,
}: {
  collection: (typeof COLLECTIONS)[number];
}) {
  return (
    <Link
      href={`/collections/${collection.id}`}
      className="group relative overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
      style={{
        background: `linear-gradient(135deg, ${collection.gradient[0]}, ${collection.gradient[1]})`,
      }}
    >
      <div className="absolute inset-0 bg-black/20 transition-colors group-hover:bg-black/10" />
      <div className="relative z-10">
        <p className="text-lg font-bold text-white">{collection.title}</p>
        <p className="mt-1 line-clamp-2 text-sm text-white/70">
          {collection.description}
        </p>
        <p className="mt-3 text-xs font-medium text-white/50">
          {collection.movies.length} фильмов
        </p>
      </div>
      <div className="absolute -bottom-4 -right-4 text-6xl font-black text-white/[0.06] transition-transform group-hover:scale-110">
        {collection.movies.length}
      </div>
    </Link>
  );
}

export default function HomePage() {
  const featured = getFeatured();
  const trending = getTrending();
  const newReleases = getNewReleases();

  return (
    <div className="space-y-20">
      {/* HERO */}
      <section className="relative -mx-4 overflow-hidden px-4 pb-4 pt-8 sm:-mx-6 sm:px-6 sm:pt-12">
        <div className="pointer-events-none absolute inset-0">
          <img
            src={`/posters/${featured.id}.svg`}
            alt=""
            className="h-full w-full object-cover opacity-[0.07] blur-2xl scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-base-950/40 via-base-950 to-base-950" />
        </div>

        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent sm:text-sm">
            Онлайн-кинотеатр
          </p>
          <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-fg sm:text-5xl lg:text-6xl">
            Смотри фильмы
            <br />
            <span className="bg-gradient-to-r from-accent to-rose-400 bg-clip-text text-transparent">
              когда хочется
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-zinc-400 sm:text-base">
            Тысячи фильмов в HD-качестве с&nbsp;удобным плеером.
            Оценивай, собирай списки, делись с&nbsp;друзьями.
          </p>

          <div className="mt-8 flex justify-center">
            <HeroSearch />
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs text-zinc-500">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-fg/10 bg-base-800/60 px-3 py-1 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {MOVIES.length} фильмов
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-fg/10 bg-base-800/60 px-3 py-1 backdrop-blur">
              HD и HLS
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-fg/10 bg-base-800/60 px-3 py-1 backdrop-blur">
              Бесплатно
            </span>
          </div>
        </div>
      </section>

      {/* GENRE CHIPS */}
      <section>
        <SectionHeader>Жанры</SectionHeader>
        <div className="flex flex-wrap gap-2">
          {GENRES.map((genre) => (
            <Link
              key={genre}
              href={`/catalog?genre=${encodeURIComponent(genre)}`}
              className="rounded-full border border-fg/10 bg-base-800/50 px-4 py-2 text-sm font-medium text-zinc-400 transition-all hover:border-accent/40 hover:bg-accent/10 hover:text-fg"
            >
              {genre}
            </Link>
          ))}
          <Link
            href="/catalog"
            className="rounded-full border border-dashed border-fg/15 px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:border-fg/30 hover:text-zinc-400"
          >
            Все жанры →
          </Link>
        </div>
      </section>

      {/* FEATURED */}
      <section className="grid items-center gap-10 lg:grid-cols-[1fr_260px]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            В тренде
          </p>
          <h2 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-fg sm:text-5xl">
            {featured.title}
          </h2>
          <p className="mt-1.5 text-sm text-zinc-500">
            {featured.originalTitle}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-zinc-500">
            <span className="inline-flex items-center gap-1 font-semibold text-amber-400">
              <StarIcon className="h-3.5 w-3.5" />
              {featured.rating.toFixed(1)}
            </span>
            <span>{featured.year}</span>
            <span className="text-zinc-700">·</span>
            <span>{formatDuration(featured.duration)}</span>
            <span className="text-zinc-700">·</span>
            <span>{featured.ageRating}+</span>
            <span className="text-zinc-700">·</span>
            <span>{featured.genres.join(", ")}</span>
          </div>

          <p className="mt-4 line-clamp-3 max-w-xl leading-relaxed text-zinc-400">
            {featured.description}
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              href={`/film/${featured.id}`}
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-7 py-3 font-semibold text-white shadow-lg shadow-accent/25 transition-all hover:bg-accent-hover hover:shadow-accent/35 active:scale-[0.97]"
            >
              <PlayIcon className="h-4 w-4" />
              Смотреть
            </Link>
            <Link
              href="/catalog"
              className="rounded-xl border border-fg/15 px-6 py-3 font-medium text-fg transition-colors hover:border-fg/30 hover:bg-fg/5"
            >
              Каталог
            </Link>
          </div>
        </div>

        <img
          src={`/posters/${featured.id}.svg`}
          alt={featured.title}
          className="hidden w-full rounded-2xl ring-1 ring-fg/10 shadow-2xl shadow-black/40 lg:block"
        />
      </section>

      <ContinueWatching minimal />

      {/* TRENDING */}
      {trending.length > 0 && (
        <section>
          <SectionHeader href="/catalog?sort=rating-desc" count={trending.length}>
            В тренде
          </SectionHeader>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {trending.map((m) => (
              <MovieCard key={m.id} movie={m} />
            ))}
          </div>
        </section>
      )}

      {/* NEW RELEASES */}
      {newReleases.length > 0 && (
        <section>
          <SectionHeader href="/catalog?sort=year-desc" count={newReleases.length}>
            Новинки
          </SectionHeader>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {newReleases.map((m) => (
              <MovieCard key={m.id} movie={m} />
            ))}
          </div>
        </section>
      )}

      {/* COLLECTIONS */}
      <section>
        <SectionHeader href="/collections" count={COLLECTIONS.length}>
          Подборки
        </SectionHeader>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {COLLECTIONS.slice(0, 6).map((c) => (
            <CollectionCard key={c.id} collection={c} />
          ))}
        </div>
      </section>

      {/* FOOTER CTA */}
      <section className="border-t border-fg/10 pb-4 pt-10 text-center">
        <p className="text-sm text-zinc-500">
          Более{" "}
          <span className="font-semibold text-fg">{MOVIES.length} фильмов</span>{" "}
          ждут вас в{" "}
          <Link
            href="/catalog"
            className="font-medium text-accent underline decoration-accent/30 underline-offset-4 transition-colors hover:decoration-accent"
          >
            каталоге
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
