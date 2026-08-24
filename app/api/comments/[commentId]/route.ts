import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

const MAX_TEXT = 1000;

export async function PATCH(
  req: Request,
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
    return NextResponse.json({ error: "Нет прав на изменение" }, { status: 403 });
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

  const updated = await prisma.comment.update({
    where: { id: ctx.params.commentId },
    data: { text },
  });

  return NextResponse.json({
    comment: {
      id: updated.id,
      text: updated.text,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    },
  });
}

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
