import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(): Promise<Response> {
  const me = await getSessionUser();
  if (!me) {
    return NextResponse.json({ error: "Требуется вход" }, { status: 401 });
  }

  const rows = await prisma.comment.findMany({
    where: { userId: me.id },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, avatarColor: true } },
    },
  });

  return NextResponse.json({
    comments: rows.map((c) => ({
      id: c.id,
      movieId: c.movieId,
      text: c.text,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
      userId: c.userId,
      userName: c.user.name,
      avatarColor: c.user.avatarColor,
    })),
  });
}
