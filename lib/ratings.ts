export type RatingMap = Record<string, number>;

export const RATINGS_KEY = "kino:ratings";
export const RATINGS_EVENT = "kino:ratings-changed";

export function clampRating(v: number): number | null {
  const r = Math.round(v);
  return r >= 1 && r <= 10 ? r : null;
}

function read(): RatingMap {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(RATINGS_KEY) ?? "{}");
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return {};
    }
    const out: RatingMap = {};
    for (const [id, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof id === "string" && typeof v === "number") {
        const c = clampRating(v);
        if (c) out[id] = c;
      }
    }
    return out;
  } catch {
    return {};
  }
}

function write(map: RatingMap): void {
  localStorage.setItem(RATINGS_KEY, JSON.stringify(map));
  window.dispatchEvent(new Event(RATINGS_EVENT));
}

export function getRating(id: string): number | null {
  return read()[id] ?? null;
}

export function getAllRatings(): RatingMap {
  return read();
}

export function setRating(id: string, value: number | null): void {
  const map = read();
  const v = value === null ? null : clampRating(value);
  if (v === null) delete map[id];
  else map[id] = v;
  write(map);
}
