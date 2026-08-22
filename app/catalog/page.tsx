import type { Metadata } from "next";
import { Suspense } from "react";
import {
  getGenres,
  getYears,
  searchMovies,
} from "@/lib/movies";
import type { CatalogFilters, SortOption } from "@/lib/types";
import SearchFilters from "@/components/SearchFilters";
import MovieGrid from "@/components/MovieGrid";
import Pagination from "@/components/Pagination";

export const metadata: Metadata = {
  title: "Каталог фильмов",
  description:
    "Полный каталог фильмов: поиск по названию, фильтры по жанру и году, сортировка по рейтингу.",
};

const VALID_SORTS: SortOption[] = [
  "rating-desc",
  "rating-asc",
  "year-desc",
  "year-asc",
  "title-asc",
];

interface Props {
  searchParams?: { [key: string]: string | string[] | undefined };
}

function one(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default function CatalogPage({ searchParams }: Props) {
  const sp = searchParams ?? {};

  const sortRaw = one(sp.sort);
  const yearRaw = one(sp.year);
  const pageRaw = Number(one(sp.page));

  const filters: CatalogFilters = {
    q: one(sp.q),
    genre: one(sp.genre),
    year:
      yearRaw && /^\d{4}$/.test(yearRaw) ? yearRaw : undefined,
    sort: VALID_SORTS.includes(sortRaw as SortOption)
      ? (sortRaw as SortOption)
      : undefined,
    page: Number.isInteger(pageRaw) && pageRaw > 0 ? pageRaw : undefined,
  };

  const result = searchMovies(filters);

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-black text-fg">Каталог фильмов</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Найдено фильмов: <span className="text-zinc-300">{result.total}</span>
          {result.total > result.items.length &&
            ` · страница ${result.page} из ${result.pages}`}
        </p>
      </div>

      <Suspense fallback={<div className="skeleton mb-6 h-[52px]" />}>
        <SearchFilters genres={getGenres()} years={getYears()} />
      </Suspense>

      <MovieGrid movies={result.items} />

      <Pagination filters={filters} page={result.page} pages={result.pages} />
    </div>
  );
}
