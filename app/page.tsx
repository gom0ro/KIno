import Link from "next/link";
import {
  formatDuration,
  getFeatured,
  getNewReleases,
  getTrending,
} from "@/lib/movies";
import MovieGrid from "@/components/MovieGrid";
import RatingBadge from "@/components/RatingBadge";
import FavoriteButton from "@/components/FavoriteButton";
import ContinueWatching from "@/components/ContinueWatching";
import { FlameIcon } from "@/components/icons";
import { COLLECTIONS } from "@/lib/collections";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-fg sm:text-2xl">
      <span className="h-6 w-1.5 rounded-full bg-accent" />
      {children}
    </h2>
  );
}

export default function HomePage() {
  const featured = getFeatured();
  const trending = getTrending();
  const newReleases = getNewReleases();
  const [c1, c2] = featured.colors;

  return (
    <div className="space-y-12">
      <section className="relative overflow-hidden rounded-2xl border border-fg/5">
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(120deg, ${c1} 0%, ${c2} 100%)` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-base-950/95 via-base-950/70 to-transparent" />

        <div className="relative grid items-center gap-6 p-6 sm:p-10 lg:grid-cols-[1fr_260px]">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-bold uppercase tracking-wider">
              <FlameIcon className="h-3.5 w-3.5" />
              В тренде
            </span>
            <h1 className="mt-4 text-3xl font-black leading-tight text-white sm:text-5xl">
              {featured.title}
            </h1>
            <p className="mt-1 text-sm text-zinc-400">{featured.originalTitle}</p>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-zinc-300">
              <RatingBadge rating={featured.rating} />
              <span>{featured.year}</span>
              <span>{formatDuration(featured.duration)}</span>
              <span className="rounded border border-white/20 px-1.5 py-0.5 text-xs">
                {featured.ageRating}+
              </span>
              <span>{featured.genres.join(", ")}</span>
            </div>

            <p className="mt-4 line-clamp-3 leading-relaxed text-zinc-300">
              {featured.description}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href={`/film/${featured.id}`}
                className="flex items-center gap-2 rounded-lg bg-accent px-6 py-3 font-semibold text-white transition-all hover:bg-accent-hover hover:shadow-[0_0_30px_rgba(229,9,20,0.5)]"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Смотреть
              </Link>
              <Link
                href="/catalog"
                className="rounded-lg border border-white/15 bg-white/5 px-6 py-3 font-semibold text-white backdrop-blur transition-colors hover:bg-white/10"
              >
                Весь каталог
              </Link>
              <FavoriteButton id={featured.id} />
            </div>
          </div>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/posters/${featured.id}.svg`}
            alt={featured.title}
            className="hidden w-full rounded-xl shadow-2xl ring-1 ring-white/10 lg:block"
          />
        </div>
      </section>

      <ContinueWatching />

      <section>
        <SectionTitle>Подборки</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {COLLECTIONS.slice(0, 3).map((c) => (
            <Link
              key={c.id}
              href={`/collections/${c.id}`}
              className="group relative overflow-hidden rounded-xl p-4 transition-transform hover:-translate-y-0.5"
              style={{
                background: `linear-gradient(135deg, ${c.gradient[0]}, ${c.gradient[1]})`,
              }}
            >
              <span className="relative block text-base font-bold text-white">
                {c.title}
                <span className="ml-2 rounded-full bg-black/25 px-2 py-0.5 text-[11px] font-semibold">
                  {c.movies.length}
                </span>
              </span>
              <span className="mt-1 block truncate text-xs text-white/80">
                {c.description}
              </span>
            </Link>
          ))}
        </div>
        <p className="mt-3 text-sm text-zinc-500">
          Все подборки —{" "}
          <Link href="/collections" className="text-accent hover:underline">
            здесь
          </Link>
          .
        </p>
      </section>

      {trending.length > 0 && (
        <section>
          <SectionTitle>В тренде</SectionTitle>
          <MovieGrid movies={trending} />
        </section>
      )}

      {newReleases.length > 0 && (
        <section>
          <SectionTitle>Новинки</SectionTitle>
          <MovieGrid movies={newReleases} />
        </section>
      )}

      <section>
        <SectionTitle>Все фильмы</SectionTitle>
        <p className="-mt-3 mb-4 text-sm text-zinc-500">
          Ищите по названию, фильтруйте по жанру и году в{" "}
          <Link href="/catalog" className="text-accent hover:underline">
            каталоге
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
