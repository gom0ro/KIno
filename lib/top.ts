import { prisma } from "./prisma";

export type TopPeriod = "all" | "week";

export interface ViewerEntry {
  id: string;
  name: string;
  avatarColor: string;
  avatarUrl: string | null;
  hours: number;
  movies: number;
}

function weekAgoDay(): string {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString().slice(0, 10);
}

export async function getTopViewers(
  limit = 50,
  period: TopPeriod = "all"
): Promise<ViewerEntry[]> {
  const grouped = await prisma.watchStat.groupBy({
    by: ["userId"],
    where:
      period === "week" ? { day: { gte: weekAgoDay() } } : undefined,
    _sum: { seconds: true },
    _count: { movieId: true },
    orderBy: { _sum: { seconds: "desc" } },
    take: limit,
  });

  const userIds = grouped.map((g) => g.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, avatarColor: true, avatarUrl: true },
  });
  const byId = new Map(users.map((u) => [u.id, u]));

  return grouped.flatMap((g) => {
    const u = byId.get(g.userId);
    if (!u) return [];
    return [
      {
        id: u.id,
        name: u.name,
        avatarColor: u.avatarColor,
        avatarUrl: u.avatarUrl,
        hours: Math.round((g._sum.seconds ?? 0) / 3600),
        movies: g._count.movieId,
      },
    ];
  });
}

export interface WatchSummary {
  hours: number;
  minutes: number;
  movies: number;
  rank: number;
}

export async function getWatchSummary(
  userId: string,
  period: TopPeriod = "all"
): Promise<WatchSummary> {
  const agg = await prisma.watchStat.aggregate({
    where: {
      userId,
      ...(period === "week" ? { day: { gte: weekAgoDay() } } : {}),
    },
    _sum: { seconds: true },
    _count: { movieId: true },
  });
  const totalSeconds = agg._sum.seconds ?? 0;

  const grouped = await prisma.watchStat.groupBy({
    by: ["userId"],
    where:
      period === "week" ? { day: { gte: weekAgoDay() } } : undefined,
    _sum: { seconds: true },
  });
  const sorted = [...grouped].sort(
    (a, b) => (b._sum.seconds ?? 0) - (a._sum.seconds ?? 0)
  );
  const rank =
    totalSeconds > 0 ? sorted.findIndex((g) => g.userId === userId) + 1 : 0;

  return {
    hours: Math.floor(totalSeconds / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    movies: agg._count.movieId,
    rank,
  };
}

export function formatHours(h: number): string {
  return `${h.toLocaleString("ru-RU")} ч`;
}
