import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getWatchSummary } from "@/lib/top";
import { MOVIES } from "@/lib/movies";

export const dynamic = "force-dynamic";

async function getUser(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      bio: true,
      avatarColor: true,
      avatarUrl: true,
      role: true,
      createdAt: true,
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const user = await getUser(params.id);
  return { title: user ? user.name : "Профиль не найден" };
}

export default async function PublicProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getUser(params.id);
  if (!user) notFound();

  const [watch, comments] = await Promise.all([
    getWatchSummary(user.id),
    prisma.comment.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  return (
    <div className="animate-fade-in space-y-8">
      <div className="flex flex-wrap items-center gap-5">
        {user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.avatarUrl}
            alt=""
            className="h-20 w-20 select-none rounded-full object-cover ring-1 ring-fg/10"
          />
        ) : (
          <span
            aria-hidden
            className="flex h-20 w-20 select-none items-center justify-center rounded-full text-3xl font-black text-fg"
            style={{ backgroundColor: user.avatarColor }}
          >
            {user.name.charAt(0).toUpperCase()}
          </span>
        )}
        <div>
          <h1 className="text-3xl font-black text-fg">{user.name}</h1>
          <p className="mt-1 text-sm text-zinc-500">
            На сайте с{" "}
            {user.createdAt.toLocaleDateString("ru-RU", {
              month: "long",
              year: "numeric",
            })}
          </p>
          {user.role === "admin" && (
            <span className="mt-2 inline-block rounded-full bg-accent/15 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-accent">
              Администратор
            </span>
          )}
        </div>
      </div>

      {watch.hours + watch.minutes > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-xl font-bold text-fg">
            <span className="h-6 w-1.5 rounded-full bg-accent" />
            Активность
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-fg/5 bg-base-800/60 p-4">
              <p className="text-xl font-black text-fg">
                {watch.hours > 0
                  ? `${watch.hours} ч ${watch.minutes} мин`
                  : `${watch.minutes} мин`}
              </p>
              <p className="mt-0.5 text-xs text-zinc-500">Просмотрено</p>
            </div>
            <div className="rounded-xl border border-fg/5 bg-base-800/60 p-4">
              <p className="text-xl font-black text-fg">{watch.movies}</p>
              <p className="mt-0.5 text-xs text-zinc-500">Фильмов начато</p>
            </div>
            <div className="rounded-xl border border-fg/5 bg-base-800/60 p-4">
              <p className="text-xl font-black text-fg">
                {watch.rank ? `#${watch.rank}` : "—"}
              </p>
              <p className="mt-0.5 text-xs text-zinc-500">Место в топе</p>
            </div>
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-xl font-bold text-fg">
          <span className="h-6 w-1.5 rounded-full bg-accent" />
          Комментарии
        </h2>
        {comments.length === 0 ? (
          <p className="text-sm text-zinc-500">Комментариев пока нет.</p>
        ) : (
          <ul className="divide-y divide-fg/5 overflow-hidden rounded-xl border border-fg/5 bg-base-800/40">
            {comments.map((c) => {
              const movie = MOVIES.find((m) => m.id === c.movieId);
              return (
                <li key={c.id} className="px-4 py-3">
                  <Link
                    href={`/film/${c.movieId}`}
                    className="text-sm font-semibold text-accent hover:underline"
                  >
                    {movie?.title ?? "Фильм"}
                  </Link>
                  <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-zinc-300">
                    {c.text}
                  </p>
                  <p className="mt-1 text-xs text-zinc-600">
                    {c.createdAt.toLocaleDateString("ru-RU", {
                      day: "numeric",
                      month: "long",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
