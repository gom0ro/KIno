import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  MOVIES,
  formatDuration,
  getMovie,
  getSimilar,
} from "@/lib/movies";
import HlsPlayer from "@/components/HlsPlayer";
import FavoriteButton from "@/components/FavoriteButton";
import MovieGrid from "@/components/MovieGrid";
import Comments from "@/components/Comments";
import RatingBadge from "@/components/RatingBadge";
import RatingStars from "@/components/RatingStars";
import MovieListSelector from "@/components/MovieListSelector";

interface Props {
  params: { id: string };
}

export const revalidate = 3600;

export function generateStaticParams() {
  return MOVIES.map(({ id }) => ({ id }));
}

export function generateMetadata({ params }: Props): Metadata {
  const movie = getMovie(params.id);
  if (!movie) return { title: "Фильм не найден" };
  return {
    title: `${movie.title} (${movie.year}) смотреть онлайн`,
    description: movie.description,
    openGraph: {
      title: movie.title,
      description: movie.description,
      type: "video.movie",
    },
  };
}

export default function FilmPage({ params }: Props) {
  const movie = getMovie(params.id);
  if (!movie) notFound();

  const similar = getSimilar(movie);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Movie",
    name: movie.title,
    alternateName: movie.originalTitle,
    description: movie.description,
    image: `/posters/${movie.id}.svg`,
    datePublished: `${movie.year}-01-01`,
    genre: movie.genres,
    countryOfOrigin: movie.country,
    duration: `PT${Math.floor(movie.duration / 60)}H${movie.duration % 60}M`,
    director: { "@type": "Person", name: movie.director },
    actor: movie.cast.map((name) => ({ "@type": "Person", name })),
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: movie.rating,
      ratingCount: movie.votes,
      bestRating: 10,
      worstRating: 0,
    },
  };

  return (
    <div className="animate-fade-in space-y-10">
      <nav aria-label="Навигация" className="text-sm text-zinc-500">
        <Link href="/catalog" className="transition-colors hover:text-accent">
          ← Назад в каталог
        </Link>
      </nav>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="space-y-5">
        <div>
          <h1 className="text-3xl font-black text-fg sm:text-4xl">
            {movie.title}
            <span className="ml-3 align-middle text-lg font-normal text-zinc-500">
              {movie.ageRating}+
            </span>
          </h1>
          <p className="mt-1 text-sm text-zinc-500">{movie.originalTitle}</p>
        </div>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/posters/${movie.id}.svg`}
          alt={`Постер — ${movie.title}`}
          className="w-full max-w-[220px] rounded-xl shadow-lg ring-1 ring-fg/10 sm:max-w-[260px]"
        />

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-zinc-300">
          <RatingBadge rating={movie.rating} />
          <span className="text-zinc-500">
            {movie.votes.toLocaleString("ru-RU")} оценок
          </span>
          <span>{movie.year}</span>
          <span>{formatDuration(movie.duration)}</span>
          <span>{movie.country}</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {movie.genres.map((g) => (
            <Link
              key={g}
              href={`/catalog?genre=${encodeURIComponent(g)}`}
              className="rounded-full border border-fg/10 bg-fg/5 px-3 py-1 text-xs font-medium text-zinc-300 transition-colors hover:border-accent hover:text-fg"
            >
              {g}
            </Link>
          ))}
        </div>
      </header>

      <section>
        <h2 className="mb-2 text-lg font-bold text-fg">Описание</h2>
        <p className="leading-relaxed text-zinc-300">{movie.description}</p>
      </section>

      <section>
        <dl className="grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-zinc-500">Режиссёр</dt>
            <dd className="mt-0.5 text-zinc-200">{movie.director}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Страна</dt>
            <dd className="mt-0.5 text-zinc-200">{movie.country}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-zinc-500">В главных ролях</dt>
            <dd className="mt-0.5 text-zinc-200">{movie.cast.join(", ")}</dd>
          </div>
        </dl>
      </section>

      <HlsPlayer src={movie.videoUrl} title={movie.title} movieId={movie.id} />

      <section className="flex flex-wrap items-center gap-x-8 gap-y-4">
        <RatingStars movieId={movie.id} />
        <MovieListSelector movieId={movie.id} />
        <FavoriteButton id={movie.id} size="md" />
      </section>

      <Comments movieId={movie.id} />

      {similar.length > 0 && (
        <section>
          <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-fg sm:text-2xl">
            <span className="h-6 w-1.5 rounded-full bg-accent" />
            Похожие фильмы
          </h2>
          <MovieGrid movies={similar} />
        </section>
      )}
    </div>
  );
}
