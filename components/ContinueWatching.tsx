"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MOVIES } from "@/lib/movies";
import {
  getAll,
  HISTORY_EVENT,
  type HistoryEntry,
} from "@/lib/watch-history";

export default function ContinueWatching({ minimal = false }: { minimal?: boolean }) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    const update = () => setEntries(getAll());
    update();
    window.addEventListener(HISTORY_EVENT, update);
    return () => window.removeEventListener(HISTORY_EVENT, update);
  }, []);

  if (entries.length === 0) return null;

  const items = entries
    .map((entry) => ({
      entry,
      movie: MOVIES.find((m) => m.id === entry.id),
    }))
    .filter(
      (x): x is { entry: HistoryEntry; movie: (typeof MOVIES)[number] } =>
        Boolean(x.movie)
    )
    .slice(0, 6);

  if (items.length === 0) return null;

  if (minimal) {
    return (
      <section className="animate-fade-in">
        <h2 className="mb-6 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
          Продолжить просмотр
        </h2>
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {items.map(({ entry, movie }) => {
            const pct =
              entry.duration > 0
                ? Math.min(100, (entry.position / entry.duration) * 100)
                : 0;
            return (
              <Link key={entry.id} href={`/film/${movie.id}`} className="group block">
                <div className="relative aspect-[2/3] overflow-hidden rounded-lg ring-1 ring-fg/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/posters/${movie.id}.svg`}
                    alt={movie.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="mt-2 h-0.5 w-full overflow-hidden rounded-full bg-fg/10">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="mt-2 truncate text-sm font-medium text-fg transition-colors group-hover:text-accent">
                  {movie.title}
                </p>
              </Link>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <section className="animate-fade-in">
      <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-fg sm:text-2xl">
        <span className="h-6 w-1.5 rounded-full bg-accent" />
        Продолжить просмотр
      </h2>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {items.map(({ entry, movie }) => {
          const pct =
            entry.duration > 0
              ? Math.min(100, (entry.position / entry.duration) * 100)
              : 0;
          return (
            <Link
              key={entry.id}
              href={`/film/${movie.id}`}
              className="group relative overflow-hidden rounded-xl border border-fg/5 transition-all duration-300 hover:-translate-y-1 hover:border-accent/60"
            >
              <div className="relative aspect-[2/3]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/posters/${movie.id}.svg`}
                  alt={movie.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                <span className="absolute left-2 top-2 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-zinc-200 backdrop-blur">
                  {Math.round(pct)}%
                </span>
                <div className="absolute inset-x-0 bottom-0 p-3">
                  <p className="truncate text-sm font-semibold text-fg">
                    {movie.title}
                  </p>
                  <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-fg/20">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
