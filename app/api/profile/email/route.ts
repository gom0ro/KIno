import { NextResponse } from "next/server";
import {
  checkCredentials,
  changeUserEmail,
  EMAIL_RE,
  findUserByEmail,
  getSessionUser,
} from "@/lib/auth";

export async function POST(req: Request): Promise<Response> {
  const me = await getSessionUser();
  if (!me) {
    return NextResponse.json({ error: "Требуется вход" }, { status: 401 });
  }

  let body: { newEmail?: unknown; currentPassword?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const newEmail =
    typeof body.newEmail === "string"
      ? body.newEmail.trim().toLowerCase()
      : "";
  if (!newEmail || !EMAIL_RE.test(newEmail)) {
    return NextResponse.json(
      { error: "Введите корректный email" },
      { status: 400 }
    );
  }

  const ok =
    typeof body.currentPassword === "string" && body.currentPassword
      ? await checkCredentials(me.email, body.currentPassword)
      : null;
  if (!ok) {
    return NextResponse.json(
      { error: "Текущий пароль неверен" },
      { status: 403 }
    );
  }

  if (newEmail === me.email) {
    return NextResponse.json(
      { error: "Это ваша текущая почта" },
      { status: 400 }
    );
  }
  if (await findUserByEmail(newEmail)) {
    return NextResponse.json(
      { error: "Эта почта уже занята" },
      { status: 409 }
    );
  }

  const user = await changeUserEmail(me.id, newEmail);
  return NextResponse.json({ user });
}
