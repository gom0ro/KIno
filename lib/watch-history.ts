export interface HistoryEntry {
  id: string;
  position: number;
  duration: number;
  updatedAt: number;
}

export const HISTORY_EVENT = "kino:history-changed";
export const HISTORY_KEY = "kino:history";
export const MAX_ENTRIES = 20;

function read(): HistoryEntry[] {
  try {
    const parsed: unknown = JSON.parse(
      localStorage.getItem(HISTORY_KEY) ?? "[]"
    );
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e): e is HistoryEntry =>
        typeof e === "object" &&
        e !== null &&
        typeof (e as HistoryEntry).id === "string" &&
        typeof (e as HistoryEntry).position === "number" &&
        typeof (e as HistoryEntry).duration === "number" &&
        typeof (e as HistoryEntry).updatedAt === "number"
    );
  } catch {
    return [];
  }
}

function write(list: HistoryEntry[]): void {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(HISTORY_EVENT));
}

export function getAll(): HistoryEntry[] {
  return read().sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getPosition(id: string): number | null {
  const entry = read().find((e) => e.id === id);
  return entry ? entry.position : null;
}

export function savePosition(
  id: string,
  position: number,
  duration: number
): void {
  const list = read().filter((e) => e.id !== id);
  list.push({ id, position, duration, updatedAt: Date.now() });
  write(list.sort((a, b) => b.updatedAt - a.updatedAt).slice(0, MAX_ENTRIES));
}

export function removePosition(id: string): void {
  const list = read();
  if (!list.some((e) => e.id === id)) return;
  write(list.filter((e) => e.id !== id));
}
