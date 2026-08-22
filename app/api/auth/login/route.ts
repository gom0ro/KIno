import { NextResponse } from "next/server";
import { checkCredentials, setSessionCookie, getUserById } from "@/lib/auth";

export async function POST(req: Request) {
  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Некорректный запрос" },
      { status: 400 }
    );
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";

  if (!email || !password) {
    return NextResponse.json(
      { error: "Заполните email и пароль" },
      { status: 400 }
    );
  }

  const user = await checkCredentials(email, password);
  if (!user) {
    return NextResponse.json(
      { error: "Неверный email или пароль" },
      { status: 401 }
    );
  }

  setSessionCookie(user.id);
  const full = await getUserById(user.id);
  return NextResponse.json({ user: full });
}
