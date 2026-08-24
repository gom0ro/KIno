import { NextResponse } from "next/server";
import {
  checkCredentials,
  changeUserPassword,
  getSessionUser,
} from "@/lib/auth";

export async function POST(req: Request): Promise<Response> {
  const me = await getSessionUser();
  if (!me) {
    return NextResponse.json({ error: "Требуется вход" }, { status: 401 });
  }

  let body: { currentPassword?: unknown; newPassword?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const current = body.currentPassword;
  const next = body.newPassword;
  if (typeof current !== "string" || typeof next !== "string") {
    return NextResponse.json({ error: "Заполните оба поля" }, { status: 400 });
  }
  if (next.length < 8 || next.length > 100) {
    return NextResponse.json(
      { error: "Новый пароль — от 8 до 100 символов" },
      { status: 400 }
    );
  }

  const ok = await checkCredentials(me.email, current);
  if (!ok) {
    return NextResponse.json(
      { error: "Текущий пароль неверен" },
      { status: 403 }
    );
  }

  await changeUserPassword(me.id, next);
  return NextResponse.json({ ok: true });
}
