import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(): Promise<Response> {
  const me = await getSessionUser();
  if (!me) {
    return NextResponse.json({ error: "Требуется вход" }, { status: 401 });
  }

  const rows = await prisma.notification.findMany({
    where: { userId: me.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({
    notifications: rows.map((n) => ({
      id: n.id,
      type: n.type,
      message: n.message,
      movieId: n.movieId,
      read: n.read,
      createdAt: n.createdAt.toISOString(),
    })),
    unreadCount: rows.filter((n) => !n.read).length,
  });
}
