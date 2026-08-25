import { NextResponse } from "next/server";
import {
  EMAIL_RE,
  createUser,
  findUserByEmail,
  setSessionCookie,
  createNotification,
} from "@/lib/auth";

export async function POST(req: Request) {
  let body: { name?: string; email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Некорректный запрос" },
      { status: 400 }
    );
  }

  const name = (body.name ?? "").trim();
  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";

  if (name.length < 2) {
    return NextResponse.json(
      { error: "Имя должно содержать минимум 2 символа" },
      { status: 400 }
    );
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: "Введите корректный email" },
      { status: 400 }
    );
  }
  if (password.length < 6) {
    return NextResponse.json(
      { error: "Пароль должен содержать минимум 6 символов" },
      { status: 400 }
    );
  }
  if (await findUserByEmail(email)) {
    return NextResponse.json(
      { error: "Пользователь с таким email уже существует" },
      { status: 409 }
    );
  }

  try {
    const user = await createUser(name, email, password);
    await createNotification({
      userId: user.id,
      type: "system",
      message:
        "Добро пожаловать в ФИЛЬМИК! Добавляйте фильмы в списки, ставьте оценки и оставляйте комментарии.",
    });
    setSessionCookie(user.id);
    return NextResponse.json({ user }, { status: 201 });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Не удалось создать аккаунт";
    return NextResponse.json({ error: message }, { status: 409 });
  }
}
