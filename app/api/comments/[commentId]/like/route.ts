import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";

export async function POST(
  _req: Request,
  ctx: { params: { commentId: string } }
): Promise<Response> {
  const uid = getSessionUserId();
  if (!uid) {
    return NextResponse.json({ error: "Требуется вход" }, { status: 401 });
  }
  const { commentId } = ctx.params;

  const exists = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { id: true },
  });
  if (!exists) {
    return NextResponse.json({ error: "Комментарий не найден" }, { status: 404 });
  }

  const liked = await prisma.commentLike.findUnique({
    where: { userId_commentId: { userId: uid, commentId } },
    select: { userId: true },
  });

  if (liked) {
    await prisma.commentLike.delete({
      where: { userId_commentId: { userId: uid, commentId } },
    });
  } else {
    await prisma.commentLike.create({ data: { userId: uid, commentId } });
  }

  const likes = await prisma.commentLike.count({ where: { commentId } });
  return NextResponse.json({ liked: !liked, likes });
}
