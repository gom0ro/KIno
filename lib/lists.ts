export type ListKey = "watching" | "planned" | "watched";

export const LIST_KEYS: ListKey[] = ["watching", "planned", "watched"];

export const LIST_LABELS: Record<ListKey, string> = {
  watching: "Смотрю",
  planned: "Буду смотреть",
  watched: "Просмотрено",
};

export interface ListsState {
  watching: string[];
  planned: string[];
  watched: string[];
}

export const LISTS_KEY = "kino:lists";
export const LISTS_EVENT = "kino:lists-changed";

function emptyLists(): ListsState {
  return { watching: [], planned: [], watched: [] };
}

function read(): ListsState {
  try {
    const parsed: unknown = JSON.parse(
      localStorage.getItem(LISTS_KEY) ?? "{}"
    );
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return emptyLists();
    }
    const src = parsed as Partial<ListsState>;
    const out = emptyLists();
    for (const key of LIST_KEYS) {
      const arr = src[key];
      if (Array.isArray(arr)) {
        out[key] = arr.filter((x): x is string => typeof x === "string");
      }
    }
    return out;
  } catch {
    return emptyLists();
  }
}

function write(state: ListsState): void {
  localStorage.setItem(LISTS_KEY, JSON.stringify(state));
  window.dispatchEvent(new Event(LISTS_EVENT));
}

export function getLists(): ListsState {
  return read();
}

export function getList(key: ListKey): string[] {
  return read()[key];
}

/** Добавляет фильм в список, убирая из двух остальных. Повторный вызов убирает. */
export function setListMembership(key: ListKey, id: string): void {
  const state = read();
  const alreadyOnlyHere =
    state[key].includes(id) &&
    LIST_KEYS.every((k) => k === key || !state[k].includes(id));

  for (const k of LIST_KEYS) {
    state[k] = state[k].filter((x) => x !== id);
  }
  if (!alreadyOnlyHere) {
    state[key] = [id, ...state[key]];
  }
  write(state);
}
