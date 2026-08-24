"use client";

import { useEffect } from "react";
import { FAVORITES_KEY } from "@/hooks/useFavorites";
import { RATINGS_KEY, RATINGS_EVENT } from "@/lib/ratings";

const FAVORITES_EVENT = "kino:favorites-changed";
const DEBOUNCE_MS = 800;

export default function ProfileSync() {
  useEffect(() => {
    let timer: number | undefined;

    async function push() {
      try {
        const favorites: unknown = JSON.parse(
          localStorage.getItem(FAVORITES_KEY) ?? "[]"
        );
        const ratings: unknown = JSON.parse(
          localStorage.getItem(RATINGS_KEY) ?? "{}"
        );
        await fetch("/api/profile/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ favorites, ratings }),
        });
      } catch {
        /* гость или сеть недоступна — тихо пропускаем */
      }
    }

    function schedule() {
      if (timer !== undefined) clearTimeout(timer);
      timer = window.setTimeout(push, DEBOUNCE_MS);
    }

    schedule();
    window.addEventListener(FAVORITES_EVENT, schedule);
    window.addEventListener(RATINGS_EVENT, schedule);
    window.addEventListener("storage", schedule);

    return () => {
      if (timer !== undefined) clearTimeout(timer);
      window.removeEventListener(FAVORITES_EVENT, schedule);
      window.removeEventListener(RATINGS_EVENT, schedule);
      window.removeEventListener("storage", schedule);
    };
  }, []);

  return null;
}
