import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getSessionUser,
  updateUserProfile,
  AVATAR_COLORS,
} from "@/lib/auth";
import { getWatchSummary } from "@/lib/top";

export async function GET(): Promise<Response> {
  const me = await getSessionUser();
  if (!me) {
    return NextResponse.json({ error: "Требуется вход" }, { status: 401 });
  }
  const [commentCount, watch] = await Promise.all([
    prisma.comment.count({ where: { userId: me.id } }),
    getWatchSummary(me.id),
  ]);
  return NextResponse.json({
    user: me,
    stats: { comments: commentCount },
    watch,
    avatarColors: AVATAR_COLORS,
  });
}

export async function PATCH(req: Request): Promise<Response> {
  const me = await getSessionUser();
  if (!me) {
    return NextResponse.json({ error: "Требуется вход" }, { status: 401 });
  }

  let body: { name?: string; bio?: string; avatarColor?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const data: { name?: string; bio?: string; avatarColor?: string } = {};

  if (body.name !== undefined) {
    const name = body.name.trim();
    if (name.length < 2 || name.length > 40) {
      return NextResponse.json(
        { error: "Имя должно быть от 2 до 40 символов" },
        { status: 400 }
      );
    }
    data.name = name;
  }

  if (body.bio !== undefined) {
    const bio = body.bio.trim();
    if (bio.length > 300) {
      return NextResponse.json(
        { error: "О себе — максимум 300 символов" },
        { status: 400 }
      );
    }
    data.bio = bio;
  }

  if (body.avatarColor !== undefined) {
    if (!AVATAR_COLORS.includes(body.avatarColor)) {
      return NextResponse.json(
        { error: "Недопустимый цвет" },
        { status: 400 }
      );
    }
    data.avatarColor = body.avatarColor;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json(
      { error: "Нет данных для обновления" },
      { status: 400 }
    );
  }

  const user = await updateUserProfile(me.id, data);
  return NextResponse.json({ user });
}
