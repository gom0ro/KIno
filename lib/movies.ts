import raw from "@/data/movies.json";
import type { CatalogFilters, Movie } from "./types";

const data = raw as { movies: Movie[] };

export const MOVIES: Movie[] = data.movies;
export const PAGE_SIZE = 12;

export function getMovie(id: string): Movie | undefined {
  return MOVIES.find((m) => m.id === id);
}

export function getTrending(): Movie[] {
  return MOVIES.filter((m) => m.trending);
}

export function getNewReleases(): Movie[] {
  return MOVIES.filter((m) => m.isNew);
}

export function getFeatured(): Movie {
  return MOVIES.find((m) => m.trending) ?? MOVIES[0];
}

export function getGenres(): string[] {
  return [...new Set(MOVIES.flatMap((m) => m.genres))].sort((a, b) =>
    a.localeCompare(b, "ru")
  );
}

export function getYears(): number[] {
  return [...new Set(MOVIES.map((m) => m.year))].sort((a, b) => b - a);
}

export interface CatalogResult {
  items: Movie[];
  total: number;
  page: number;
  pages: number;
}

export function searchMovies(filters: CatalogFilters): CatalogResult {
  const q = filters.q?.trim().toLowerCase() ?? "";
  let list = MOVIES;

  if (q) {
    list = list.filter((m) =>
      [m.title, m.originalTitle, m.director, ...m.cast]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }

  if (filters.genre && filters.genre !== "all") {
    list = list.filter((m) => m.genres.includes(filters.genre!));
  }

  if (filters.year && filters.year !== "all") {
    list = list.filter((m) => m.year === Number(filters.year));
  }

  switch (filters.sort) {
    case "rating-asc":
      list = [...list].sort((a, b) => a.rating - b.rating);
      break;
    case "year-desc":
      list = [...list].sort((a, b) => b.year - a.year);
      break;
    case "year-asc":
      list = [...list].sort((a, b) => a.year - b.year);
      break;
    case "title-asc":
      list = [...list].sort((a, b) => a.title.localeCompare(b.title, "ru"));
      break;
    default:
      list = [...list].sort((a, b) => b.rating - a.rating);
  }

  const total = list.length;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(Math.max(1, filters.page ?? 1), pages);

  return {
    items: list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    total,
    page,
    pages,
  };
}

export function getSimilar(movie: Movie, limit = 6): Movie[] {
  return MOVIES.filter((m) => m.id !== movie.id)
    .map((m) => ({
      movie: m,
      score:
        m.genres.filter((g) => movie.genres.includes(g)).length + m.rating / 10,
    }))
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.movie.rating - a.movie.rating
    )
    .slice(0, limit)
    .map(({ movie: m }) => m);
}

export function formatDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h} ч ${m} мин` : `${m} мин`;
}
