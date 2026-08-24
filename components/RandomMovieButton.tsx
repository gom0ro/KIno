"use client";

import { useRouter } from "next/navigation";
import { MOVIES } from "@/lib/movies";
import { DiceIcon } from "@/components/icons";

export default function RandomMovieButton() {
  const router = useRouter();

  function go() {
    const movie =
      MOVIES[Math.floor(Math.random() * MOVIES.length)] ?? MOVIES[0];
    router.push(`/film/${movie.id}`);
  }

  return (
    <button
      type="button"
      onClick={go}
      className="mt-10 inline-flex items-center gap-2 rounded-lg bg-fg px-8 py-3 text-base font-medium text-base-950 transition-opacity hover:opacity-85"
    >
      <DiceIcon className="h-5 w-5" />
      Выбрать случайный фильм
    </button>
  );
}
