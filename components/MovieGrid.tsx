import type { Movie } from "@/lib/types";
import { FilmIcon } from "@/components/icons";
import MovieCard from "./MovieCard";

interface Props {
  movies: Movie[];
}

export default function MovieGrid({ movies }: Props) {
  if (movies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-fg/10 py-20 text-center">
        <FilmIcon className="h-10 w-10 text-zinc-600" />
        <p className="mt-4 font-medium text-zinc-300">Ничего не найдено</p>
        <p className="mt-1 text-sm text-zinc-500">
          Попробуйте изменить параметры поиска или фильтры
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
      {movies.map((m) => (
        <MovieCard key={m.id} movie={m} />
      ))}
    </div>
  );
}
