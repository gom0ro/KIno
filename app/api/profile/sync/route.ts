import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";
import { MOVIES } from "@/lib/movies";

const MAX_ITEMS = 500;

export async function POST(req: Request): Promise<Response> {
  const uid = getSessionUserId();
  if (!uid) {
    return NextResponse.json({ error: "Требуется вход" }, { status: 401 });
  }

  let body: { favorites?: unknown; ratings?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const knownIds = new Set(MOVIES.map((m) => m.id));

  const favorites = Array.isArray(body.favorites)
    ? [...new Set(body.favorites)]
        .filter(
          (id): id is string =>
            typeof id === "string" && knownIds.has(id)
        )
        .slice(0, MAX_ITEMS)
    : null;

  let ratings: { movieId: string; value: number }[] | null = null;
  if (
    typeof body.ratings === "object" &&
    body.ratings !== null &&
    !Array.isArray(body.ratings)
  ) {
    ratings = Object.entries(body.ratings as Record<string, unknown>)
      .filter(
        ([id, v]) =>
          typeof id === "string" &&
          knownIds.has(id) &&
          typeof v === "number" &&
          Number.isInteger(v) &&
          v >= 1 &&
          v <= 10
      )
      .slice(0, MAX_ITEMS)
      .map(([movieId, value]) => ({ movieId, value: value as number }));
  }

  if (!favorites && !ratings) {
    return NextResponse.json({ error: "Нет данных" }, { status: 400 });
  }

  const ops = [];
  if (favorites) {
    ops.push(prisma.userFavorite.deleteMany({ where: { userId: uid } }));
    if (favorites.length > 0) {
      ops.push(
        prisma.userFavorite.createMany({
          data: favorites.map((movieId) => ({ userId: uid, movieId })),
          skipDuplicates: true,
        })
      );
    }
  }
  if (ratings) {
    ops.push(prisma.userRating.deleteMany({ where: { userId: uid } }));
    if (ratings.length > 0) {
      ops.push(
        prisma.userRating.createMany({
          data: ratings.map((r) => ({ userId: uid, ...r })),
          skipDuplicates: true,
        })
      );
    }
  }

  await prisma.$transaction(ops);
  return NextResponse.json({ ok: true });
}
