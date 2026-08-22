import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { MOVIES } from "@/lib/movies";

const MAX_TEXT = 1000;

export async function GET(
  _req: Request,
  ctx: { params: { movieId: string } }
): Promise<Response> {
  const { movieId } = ctx.params;
  const rows = await prisma.comment.findMany({
    where: { movieId },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      user: { select: { id: true, name: true, avatarColor: true } },
    },
  });
  return NextResponse.json({
    comments: rows.map((c) => ({
      id: c.id,
      text: c.text,
      createdAt: c.createdAt.toISOString(),
      userId: c.userId,
      userName: c.user.name,
      avatarColor: c.user.avatarColor,
    })),
  });
}

export async function POST(
  req: Request,
  ctx: { params: { movieId: string } }
): Promise<Response> {
  const { movieId } = ctx.params;
  const me = await getSessionUser();
  if (!me) {
    return NextResponse.json({ error: "Требуется вход" }, { status: 401 });
  }

  let body: { text?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const text = (body.text ?? "").trim();
  if (!text || text.length > MAX_TEXT) {
    return NextResponse.json(
      { error: `Комментарий должен быть от 1 до ${MAX_TEXT} символов` },
      { status: 400 }
    );
  }

  const comment = await prisma.comment.create({
    data: { movieId, userId: me.id, text },
    include: {
      user: { select: { id: true, name: true, avatarColor: true } },
    },
  });

  const title = MOVIES.find((m) => m.id === movieId)?.title ?? "фильм";
  const others = await prisma.comment.findMany({
    where: { movieId, userId: { not: me.id } },
    select: { userId: true },
    distinct: ["userId"],
  });
  if (others.length > 0) {
    await prisma.notification.createMany({
      data: others.map((o) => ({
        userId: o.userId,
        type: "comment",
        movieId,
        message: `${me.name} прокомментировал(а) «${title}»`,
      })),
    });
  }

  return NextResponse.json(
    {
      comment: {
        id: comment.id,
        text: comment.text,
        createdAt: comment.createdAt.toISOString(),
        userId: comment.userId,
        userName: comment.user.name,
        avatarColor: comment.user.avatarColor,
      },
    },
    { status: 201 }
  );
}
