import type { Metadata } from "next";
import RandomMovieButton from "@/components/RandomMovieButton";
import { MOVIES } from "@/lib/movies";

export const metadata: Metadata = {
  title: "Случайный фильм",
  description:
    "Не знаете, что посмотреть? Нажмите одну кнопку — выберем случайный фильм из каталога и сразу откроем его страницу.",
};

export default function RandomPage() {
  return (
    <div className="flex min-h-[65vh] animate-fade-in flex-col items-center justify-center py-16 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
        Случайный фильм
      </p>
      <h1 className="mt-4 max-w-2xl text-4xl font-semibold leading-tight tracking-tight text-fg sm:text-5xl">
        Не знаете, что посмотреть?
      </h1>
      <p className="mt-5 max-w-md leading-relaxed text-zinc-400">
        Кубик — это простой способ выбрать кино за один клик. Нажимаете кнопку —
        мы берём случайный фильм из {MOVIES.length}{" "}
        {MOVIES.length % 10 === 1 && MOVIES.length % 100 !== 11
          ? "фильма"
          : "фильмов"}{" "}
        каталога и сразу открываем его страницу: описание, рейтинг, плеер.
      </p>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-zinc-500">
        Не понравился фильм — просто вернитесь назад и бросьте кубик ещё раз.
      </p>

      <RandomMovieButton />
    </div>
  );
}
