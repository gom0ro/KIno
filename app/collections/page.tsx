import type { Metadata } from "next";
import Link from "next/link";
import { COLLECTIONS } from "@/lib/collections";

export const metadata: Metadata = {
  title: "Подборки",
  description:
    "Редакционные подборки фильмов: для вечера, топ по рейтингу, новинки, мистика и адреналин.",
};

export default function CollectionsPage() {
  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-3xl font-black text-fg sm:text-4xl">Подборки</h1>
        <p className="mt-2 max-w-xl text-sm text-zinc-500">
          Готовые коллекции на любое настроение — выбирайте и смотрите.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {COLLECTIONS.map((c) => (
          <Link
            key={c.id}
            href={`/collections/${c.id}`}
            className="group relative overflow-hidden rounded-2xl p-5 transition-transform hover:-translate-y-0.5"
            style={{
              background: `linear-gradient(135deg, ${c.gradient[0]}, ${c.gradient[1]})`,
            }}
          >
            <span className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 transition-transform group-hover:scale-125" />
            <span className="relative block">
              <span className="block text-lg font-black text-white">
                {c.title}
              </span>
              <span className="mt-1 block text-sm leading-snug text-white/85">
                {c.description}
              </span>
              <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-black/25 px-3 py-1 text-xs font-bold text-white">
                {c.movies.length} фильмов
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" aria-hidden>
                  <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z" />
                </svg>
              </span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
