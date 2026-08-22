"use client";

import { useCallback, useEffect, useState } from "react";

export const FAVORITES_KEY = "kino:favorites";
const EVENT = "kino:favorites-changed";

function read(): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(FAVORITES_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function loadFavorites(): string[] {
  return read();
}

export function useFavorites() {
  const [ids, setIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setIds(read());
    setReady(true);

    const onChange = () => setIds(read());
    window.addEventListener(EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const toggle = useCallback((id: string) => {
    const current = read();
    const next = current.includes(id)
      ? current.filter((x) => x !== id)
      : [id, ...current];
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(EVENT));
  }, []);

  const has = useCallback((id: string) => ids.includes(id), [ids]);

  return { favorites: ids, ready, toggle, has };
}
