import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function POST(req: Request): Promise<Response> {
  const me = await getSessionUser();
  if (!me) {
    return NextResponse.json({ error: "Требуется вход" }, { status: 401 });
  }

  let body: { ids?: string[] } = {};
  try {
    body = (await req.json()) as { ids?: string[] };
  } catch {
    body = {};
  }

  const data =
    Array.isArray(body.ids) && body.ids.length > 0
      ? { userId: me.id, id: { in: body.ids } }
      : { userId: me.id };

  await prisma.notification.updateMany({ where: data, data: { read: true } });
  return NextResponse.json({ ok: true });
}
