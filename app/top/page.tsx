import type { Metadata } from "next";
import Link from "next/link";
import { getTopViewers, formatHours, type TopPeriod } from "@/lib/top";
import { getSessionUser } from "@/lib/auth";
import { TrophyIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Топ-50 зрителей",
  description:
    "Рейтинг самых активных зрителей КИНО по суммарным часам просмотра.",
};

const RANK_STYLES = [
  "bg-accent text-white",
  "bg-zinc-300 text-base-950",
  "bg-amber-600 text-white",
] as const;

export default async function TopPage({
  searchParams,
}: {
  searchParams: { period?: string };
}) {
  const period: TopPeriod = searchParams.period === "week" ? "week" : "all";
  const [top, me] = await Promise.all([
    getTopViewers(50, period),
    getSessionUser(),
  ]);
  const myRank = me ? top.findIndex((v) => v.id === me.id) : -1;

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="flex flex-wrap items-center gap-3 text-3xl font-black text-fg sm:text-4xl">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-white">
            <TrophyIcon className="h-6 w-6" />
          </span>
          Топ-50 зрителей
        </h1>
        <p className="mt-2 max-w-xl text-sm text-zinc-500">
          Самые активные зрители сайта — рейтинг по суммарному времени,
          проведённому за фильмами. Смотрите больше, чтобы подняться выше!
        </p>
        {me && (
          <p className="mt-2 text-sm text-zinc-400">
            {myRank === -1
              ? period === "week"
                ? "На этой неделе вы пока не смотрели фильмы."
                : "Вас пока нет в топе — включите любой фильм и начните смотреть."
              : `Вы на ${myRank + 1} месте.${
                  period === "week" ? " (за неделю)" : ""
                }`}
          </p>
        )}
      </div>

      <div className="inline-flex rounded-lg bg-base-800 p-1">
        {(
          [
            ["all", "За всё время"],
            ["week", "За неделю"],
          ] as const
        ).map(([value, label]) => (
          <Link
            key={value}
            href={value === "all" ? "/top" : "/top?period=week"}
            aria-current={period === value ? "true" : undefined}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              period === value
                ? "bg-accent text-white"
                : "text-zinc-400 hover:text-fg"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      <ol className="divide-y divide-fg/5 overflow-hidden rounded-xl border border-fg/5 bg-base-800/40">
        {top.length === 0 && (
          <li className="px-4 py-8 text-center text-sm text-zinc-500">
            Пока никто не смотрел фильмы. Станьте первым!
          </li>
        )}
        {top.map((v, i) => {
          const isMe = me?.id === v.id;
          return (
            <li
              key={v.id}
              className={isMe ? "bg-accent/10" : i < 3 ? "bg-fg/[0.03]" : ""}
            >
              <Link
                href={`/users/${v.id}`}
                className="flex items-center gap-3 px-3 py-3 transition-colors hover:bg-fg/5 sm:gap-4 sm:px-4"
              >
                <span
                  aria-label={`${i + 1} место`}
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-black ${
                    RANK_STYLES[i] ?? "bg-fg/5 text-zinc-400"
                  }`}
                >
                  {i + 1}
                </span>

                {v.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={v.avatarUrl}
                    alt=""
                    className="h-11 w-11 shrink-0 select-none rounded-full object-cover ring-1 ring-fg/10"
                  />
                ) : (
                  <span
                    aria-hidden
                    className="flex h-11 w-11 shrink-0 select-none items-center justify-center rounded-full text-base font-bold text-white"
                    style={{ backgroundColor: v.avatarColor }}
                  >
                    {v.name.charAt(0).toUpperCase()}
                  </span>
                )}

                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-fg">
                    {v.name}
                    {isMe && (
                      <span className="ml-2 rounded-full bg-accent px-2 py-0.5 align-middle text-[11px] font-bold uppercase tracking-wide text-fg">
                        вы
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block text-xs text-zinc-500">
                    фильмов: {v.movies}
                  </span>
                </span>

                <span className="shrink-0 text-right">
                  <span className="block text-base font-black tabular-nums text-fg sm:text-lg">
                    {formatHours(v.hours)}
                  </span>
                  <span className="mt-0.5 block text-[11px] leading-none text-zinc-500">
                    просмотра
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>

      {!me && (
        <p className="text-sm text-zinc-500">
          Хотите в рейтинге?{" "}
          <Link href="/register" className="font-medium text-accent hover:underline">
            Зарегистрируйтесь
          </Link>{" "}
          и смотрите фильмы — часы засчитываются автоматически.
        </p>
      )}
    </div>
  );
}
