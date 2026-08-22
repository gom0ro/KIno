import { MOVIES, getTrending } from "./movies";
import type { Movie } from "./types";

export interface Collection {
  id: string;
  title: string;
  description: string;
  gradient: [string, string];
  movies: Movie[];
}

function byGenre(genres: string[], minRating = 0): Movie[] {
  return MOVIES.filter(
    (m) =>
      m.genres.some((g) => genres.includes(g)) && m.rating >= minRating
  );
}

export const COLLECTIONS: Collection[] = [
  {
    id: "vecher",
    title: "Для вечера",
    description: "Спокойные драмы и мелодрамы под чай или что-то покрепче",
    gradient: ["#7c3aed", "#db2777"],
    movies: byGenre(["Драма", "Мелодрама"], 6.5).slice(0, 12),
  },
  {
    id: "top",
    title: "Топ по рейтингу",
    description: "Лучшие фильмы сайта — отобраны по оценкам зрителей",
    gradient: ["#eab308", "#ea580c"],
    movies: [...MOVIES].sort((a, b) => b.rating - a.rating).slice(0, 12),
  },
  {
    id: "novinki",
    title: "Новинки",
    description: "Совсем свежие премьеры нашего кинотеатра",
    gradient: ["#0891b2", "#4f46e5"],
    movies: MOVIES.filter((m) => m.isNew),
  },
  {
    id: "korotkie",
    title: "На один вечер",
    description: "До полутора часов — когда хочется кино, а не марафона",
    gradient: ["#16a34a", "#0d9488"],
    movies: MOVIES.filter((m) => m.duration < 105 && m.rating >= 6.5),
  },
  {
    id: "mistika",
    title: "Мистика и нуар",
    description: "Тёмные детективы, загадки и городские тени",
    gradient: ["#334155", "#0f172a"],
    movies: byGenre(["Мистика", "Нуар", "Детектив"], 6).slice(0, 12),
  },
  {
    id: "adrenalin",
    title: "Адреналин",
    description: "Боевики, катастрофы и триллеры — пульс гарантирован",
    gradient: ["#dc2626", "#9a3412"],
    movies: byGenre(["Боевик", "Катастрофа", "Триллер"], 6).slice(0, 12),
  },
];

export function getCollection(id: string): Collection | undefined {
  return COLLECTIONS.find((c) => c.id === id);
}

export const TRENDING_IDS = new Set(getTrending().map((m) => m.id));
