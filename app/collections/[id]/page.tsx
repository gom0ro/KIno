import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { COLLECTIONS, getCollection } from "@/lib/collections";
import MovieGrid from "@/components/MovieGrid";

export function generateStaticParams() {
  return COLLECTIONS.map((c) => ({ id: c.id }));
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const collection = getCollection(params.id);
  if (!collection) return { title: "Подборка не найдена" };
  return {
    title: `${collection.title} — подборка`,
    description: collection.description,
  };
}

export default function CollectionPage({
  params,
}: {
  params: { id: string };
}) {
  const collection = getCollection(params.id);
  if (!collection) notFound();

  return (
    <div className="animate-fade-in space-y-6">
      <nav aria-label="Хлебные крошки" className="text-sm text-zinc-500">
        <Link href="/collections" className="hover:text-accent">
          Подборки
        </Link>
        <span className="mx-2" aria-hidden>
          /
        </span>
        <span className="text-zinc-400">{collection.title}</span>
      </nav>

      <div
        className="relative overflow-hidden rounded-2xl p-6 sm:p-8"
        style={{
          background: `linear-gradient(135deg, ${collection.gradient[0]}, ${collection.gradient[1]})`,
        }}
      >
        <span className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10" />
        <h1 className="relative text-3xl font-black text-white sm:text-4xl">
          {collection.title}
        </h1>
        <p className="relative mt-2 max-w-lg text-sm leading-snug text-white/85 sm:text-base">
          {collection.description}
        </p>
      </div>

      {collection.movies.length > 0 ? (
        <MovieGrid movies={collection.movies} />
      ) : (
        <p className="text-sm text-zinc-500">
          В этой подборке пока нет фильмов.
        </p>
      )}
    </div>
  );
}
