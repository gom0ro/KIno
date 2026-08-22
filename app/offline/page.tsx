import type { Metadata } from "next";
import Link from "next/link";
import { WifiOffIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Нет соединения",
};

export default function OfflinePage() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <WifiOffIcon className="h-12 w-12 text-zinc-500" />
      <h1 className="mt-6 text-3xl font-black text-fg">Нет соединения</h1>
      <p className="mt-2 max-w-md text-zinc-400">
        Проверьте подключение к интернету — страница появится, как только вы
        снова будете онлайн.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-lg bg-accent px-6 py-3 font-semibold text-white transition-colors hover:bg-accent-hover"
      >
        На главную
      </Link>
    </div>
  );
}
