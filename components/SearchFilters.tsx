"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

interface Props {
  genres: string[];
  years: number[];
}

const SORT_OPTIONS = [
  { value: "rating-desc", label: "По рейтингу" },
  { value: "year-desc", label: "Сначала новые" },
  { value: "year-asc", label: "Сначала старые" },
  { value: "title-asc", label: "По алфавиту" },
] as const;

const selectClass =
  "min-w-0 rounded-lg border border-fg/10 bg-base-800 px-3 py-2.5 text-base text-zinc-200 outline-none transition-colors focus:border-accent hover:border-fg/20 sm:text-sm";

export default function SearchFilters({ genres, years }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState(params.get("q") ?? "");

  useEffect(() => {
    setQ(params.get("q") ?? "");
  }, [params]);

  useEffect(() => {
    if (!params.get("focus")) return;
    inputRef.current?.focus();
    const next = new URLSearchParams(params.toString());
    next.delete("focus");
    window.history.replaceState(
      null,
      "",
      `/catalog${next.size ? `?${next}` : ""}`
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const push = useCallback(
    (updates: Record<string, string>) => {
      const next = new URLSearchParams(params.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (!value || value === "all") next.delete(key);
        else next.set(key, value);
      }
      next.delete("page");
      router.replace(`/catalog${next.size ? `?${next}` : ""}`, {
        scroll: false,
      });
    },
    [params, router]
  );

  useEffect(() => {
    if (q === (params.get("q") ?? "")) return;
    const t = setTimeout(() => push({ q }), 400);
    return () => clearTimeout(t);
  }, [q, params, push]);

  const active =
    Boolean(params.get("q")) ||
    (params.get("genre") && params.get("genre") !== "all") ||
    (params.get("year") && params.get("year") !== "all");

  return (
    <div className="mb-6 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
      <div className="relative col-span-2 flex-1">
        <svg
          viewBox="0 0 24 24"
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 fill-zinc-500"
        >
          <path d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 1 0-.7.7l.27.28v.79l5 4.99L20.49 19zm-6 0A4.5 4.5 0 1 1 14 9.5 4.5 4.5 0 0 1 9.5 14z" />
        </svg>
        <input
          ref={inputRef}
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Название, режиссёр или актёр…"
          className={`${selectClass} w-full pl-9`}
        />
      </div>

      <select
        aria-label="Жанр"
        value={params.get("genre") ?? "all"}
        onChange={(e) => push({ genre: e.target.value })}
        className={selectClass}
      >
        <option value="all">Все жанры</option>
        {genres.map((g) => (
          <option key={g} value={g}>
            {g}
          </option>
        ))}
      </select>

      <select
        aria-label="Год"
        value={params.get("year") ?? "all"}
        onChange={(e) => push({ year: e.target.value })}
        className={selectClass}
      >
        <option value="all">Все годы</option>
        {years.map((y) => (
          <option key={y} value={String(y)}>
            {y}
          </option>
        ))}
      </select>

      <select
        aria-label="Сортировка"
        value={params.get("sort") ?? "rating-desc"}
        onChange={(e) => push({ sort: e.target.value })}
        className={selectClass}
      >
        {SORT_OPTIONS.map(({ value, label }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      {active && (
        <button
          type="button"
          onClick={() => router.replace("/catalog", { scroll: false })}
          className="rounded-lg border border-fg/10 px-3 py-2.5 text-base text-zinc-400 transition-colors hover:border-accent hover:text-fg sm:text-sm"
        >
          Сбросить
        </button>
      )}
    </div>
  );
}
