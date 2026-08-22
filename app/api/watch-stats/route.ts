import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";
import { MOVIES } from "@/lib/movies";

export async function POST(req: Request): Promise<Response> {
  const uid = getSessionUserId();
  if (!uid) {
    return NextResponse.json({ error: "Требуется вход" }, { status: 401 });
  }

  let body: { movieId?: string; seconds?: number };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const movieId = typeof body.movieId === "string" ? body.movieId : "";
  const seconds = Number(body.seconds);
  if (!MOVIES.some((m) => m.id === movieId)) {
    return NextResponse.json({ error: "Фильм не найден" }, { status: 404 });
  }
  if (!Number.isFinite(seconds) || seconds <= 0 || seconds > 60) {
    return NextResponse.json({ error: "Некорректный интервал" }, { status: 400 });
  }

  await prisma.watchStat.upsert({
    where: {
      userId_movieId_day: {
        userId: uid,
        movieId,
        day: new Date().toISOString().slice(0, 10),
      },
    },
    create: { userId: uid, movieId, day: new Date().toISOString().slice(0, 10), seconds },
    update: { seconds: { increment: seconds } },
  });

  return NextResponse.json({ ok: true });
}
