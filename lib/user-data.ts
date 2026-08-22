import { FAVORITES_KEY, loadFavorites } from "@/hooks/useFavorites";
import {
  getAll as getAllHistory,
  HISTORY_EVENT,
  HISTORY_KEY,
  MAX_ENTRIES,
  type HistoryEntry,
} from "./watch-history";
import {
  getAllRatings,
  RATINGS_EVENT,
  RATINGS_KEY,
  clampRating,
} from "./ratings";
import {
  getLists,
  LIST_KEYS,
  LISTS_EVENT,
  LISTS_KEY,
  type ListKey,
  type ListsState,
} from "./lists";

export interface BackupFile {
  app: "kino";
  version: 1;
  exportedAt: string;
  favorites: string[];
  history: HistoryEntry[];
  ratings: Record<string, number>;
  lists: ListsState;
}

const BACKUP_EVENT = "kino:data-imported";

export function buildBackup(): BackupFile {
  return {
    app: "kino",
    version: 1,
    exportedAt: new Date().toISOString(),
    favorites: loadFavorites(),
    history: getAllHistory(),
    ratings: getAllRatings(),
    lists: getLists(),
  };
}

function dispatchAll(): void {
  window.dispatchEvent(new Event(BACKUP_EVENT));
  window.dispatchEvent(new Event("kino:favorites-changed"));
  window.dispatchEvent(new Event(HISTORY_EVENT));
  window.dispatchEvent(new Event(RATINGS_EVENT));
  window.dispatchEvent(new Event(LISTS_EVENT));
}

export interface ImportResult {
  favorites: number;
  history: number;
  ratings: number;
  lists: number;
}

export function applyBackup(raw: unknown): ImportResult {
  if (
    typeof raw !== "object" ||
    raw === null ||
    (raw as BackupFile).app !== "kino" ||
    (raw as BackupFile).version !== 1
  ) {
    throw new Error("Файл не является резервной копией КИНО");
  }

  const data = raw as Partial<BackupFile>;
  const result: ImportResult = { favorites: 0, history: 0, ratings: 0, lists: 0 };

  // Избранное: объединение без дублей
  if (Array.isArray(data.favorites)) {
    const current = loadFavorites();
    const incoming = data.favorites.filter(
      (x): x is string => typeof x === "string"
    );
    const merged = [...new Set([...incoming, ...current])];
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(merged));
    result.favorites = merged.length - current.length;
  }

  // История: по каждому фильму оставляем более свежую запись
  if (Array.isArray(data.history)) {
    const byId = new Map<string, HistoryEntry>();
    for (const e of [...getAllHistory(), ...(data.history as HistoryEntry[])]) {
      if (
        typeof e?.id === "string" &&
        typeof e?.position === "number" &&
        typeof e?.duration === "number" &&
        typeof e?.updatedAt === "number"
      ) {
        const best = byId.get(e.id);
        if (!best || e.updatedAt > best.updatedAt) byId.set(e.id, e);
      }
    }
    const merged = [...byId.values()]
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, MAX_ENTRIES);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(merged));
    result.history = merged.length;
  }

  // Оценки
  if (
    typeof data.ratings === "object" &&
    data.ratings !== null &&
    !Array.isArray(data.ratings)
  ) {
    const merged: Record<string, number> = getAllRatings();
    for (const [id, v] of Object.entries(data.ratings)) {
      if (typeof id !== "string") continue;
      const c = clampRating(Number(v));
      if (c) {
        merged[id] = c;
        result.ratings++;
      }
    }
    localStorage.setItem(RATINGS_KEY, JSON.stringify(merged));
  }

  // Списки
  if (
    typeof data.lists === "object" &&
    data.lists !== null &&
    !Array.isArray(data.lists)
  ) {
    const current = getLists();
    const src = data.lists as Partial<ListsState>;
    for (const key of LIST_KEYS) {
      const arr = src[key];
      if (!Array.isArray(arr)) continue;
      const set = new Set(current[key]);
      let added = 0;
      for (const item of arr) {
        if (typeof item === "string" && !set.has(item)) {
          set.add(item);
          added++;
        }
      }
      current[key] = [...set];
      result.lists += added;
    }
    localStorage.setItem(LISTS_KEY, JSON.stringify(current));
  }

  dispatchAll();
  return result;
}

export function downloadBackup(): void {
  const blob = new Blob([JSON.stringify(buildBackup(), null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `kino-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export type { ListKey };
