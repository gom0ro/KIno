import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { getSessionUser } from "@/lib/auth";
import { saveUpload } from "@/lib/storage";

const MAX_SIZE = 100 * 1024 * 1024;

export async function POST(req: Request): Promise<Response> {
  const me = await getSessionUser();
  if (!me) {
    return NextResponse.json({ error: "Требуется вход" }, { status: 401 });
  }
  if (me.role !== "admin") {
    return NextResponse.json(
      { error: "Доступ только для администратора" },
      { status: 403 }
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Файл не передан" }, { status: 400 });
  }
  if (file.type !== "video/mp4") {
    return NextResponse.json(
      { error: "Поддерживается только видео в формате MP4" },
      { status: 415 }
    );
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "Файл больше 100 МБ" },
      { status: 413 }
    );
  }

  const name = `${randomBytes(8).toString("hex")}.mp4`;
  const data = Buffer.from(await file.arrayBuffer());
  const stored = await saveUpload("videos", name, data, file.type);

  return NextResponse.json({ url: stored.url }, { status: 201 });
}
