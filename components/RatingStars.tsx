"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getRating, RATINGS_EVENT, setRating } from "@/lib/ratings";
import { useMe } from "@/hooks/useMe";

function AuthPrompt({ text }: { text: string }) {
  return (
    <p className="rounded-lg border border-dashed border-fg/10 px-4 py-3 text-sm text-zinc-500">
      {text}{" "}
      <Link href="/login" className="font-medium text-accent hover:underline">
        Войдите
      </Link>{" "}
      или{" "}
      <Link
        href="/register"
        className="font-medium text-accent hover:underline"
      >
        зарегистрируйтесь
      </Link>
      .
    </p>
  );
}

export default function RatingStars({ movieId }: { movieId: string }) {
  const { me, ready } = useMe();
  const [value, setValue] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    setValue(getRating(movieId));
    const onChange = () => setValue(getRating(movieId));
    window.addEventListener(RATINGS_EVENT, onChange);
    return () => window.removeEventListener(RATINGS_EVENT, onChange);
  }, [movieId]);

  const shown = hover ?? value ?? 0;

  if (!ready) return null;
  if (!me) return <AuthPrompt text="Хотите оценить фильм?" />;

  function pick(v: number) {
    setRating(movieId, value === v ? null : v);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex" onMouseLeave={() => setHover(null)}>
        {Array.from({ length: 10 }, (_, i) => i + 1).map((v) => (
          <button
            key={v}
            type="button"
            aria-label={`Оценить на ${v} из 10`}
            onMouseEnter={() => setHover(v)}
            onClick={() => pick(v)}
            className="p-0.5 transition-transform hover:scale-125"
          >
            <svg
              viewBox="0 0 24 24"
              className={`h-5 w-5 transition-colors ${
                v <= shown ? "fill-amber-400" : "fill-zinc-300 dark:fill-zinc-700"
              }`}
            >
              <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
          </button>
        ))}
      </div>
      <span className="text-sm text-zinc-400">
        {value ? `Ваша оценка: ${value}/10` : "Оцените фильм"}
      </span>
      {value && (
        <button
          type="button"
          onClick={() => setRating(movieId, null)}
          className="text-xs text-zinc-500 underline transition-colors hover:text-zinc-600 dark:hover:text-zinc-300"
        >
          убрать
        </button>
      )}
    </div>
  );
}
