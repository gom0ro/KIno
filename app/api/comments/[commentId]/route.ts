import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function DELETE(
  _req: Request,
  ctx: { params: { commentId: string } }
): Promise<Response> {
  const me = await getSessionUser();
  if (!me) {
    return NextResponse.json({ error: "Требуется вход" }, { status: 401 });
  }

  const comment = await prisma.comment.findUnique({
    where: { id: ctx.params.commentId },
    select: { userId: true },
  });
  if (!comment) {
    return NextResponse.json({ error: "Комментарий не найден" }, { status: 404 });
  }
  if (comment.userId !== me.id && me.role !== "admin") {
    return NextResponse.json({ error: "Нет прав на удаление" }, { status: 403 });
  }

  await prisma.comment.delete({ where: { id: ctx.params.commentId } });
  return new NextResponse(null, { status: 204 });
}
