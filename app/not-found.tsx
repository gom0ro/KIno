import Link from "next/link";
import { TheaterIcon } from "@/components/icons";

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <TheaterIcon className="h-14 w-14 text-zinc-500" />
      <h1 className="mt-6 text-3xl font-black text-fg">404</h1>
      <p className="mt-2 max-w-md text-zinc-400">
        Такой страницы нет или она была удалена, но у нас есть много других
        фильмов.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-lg bg-accent px-6 py-3 font-semibold text-white transition-colors hover:bg-accent-hover"
      >
        Вернуться домой
      </Link>
    </div>
  );
}
