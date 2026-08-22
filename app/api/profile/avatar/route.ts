import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { saveUpload, deleteStored } from "@/lib/storage";

const MAX_SIZE = 2 * 1024 * 1024;

const ALLOWED: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

export async function POST(req: Request): Promise<Response> {
  const me = await getSessionUser();
  if (!me) {
    return NextResponse.json({ error: "Требуется вход" }, { status: 401 });
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
  const ext = ALLOWED[file.type];
  if (!ext) {
    return NextResponse.json(
      { error: "Поддерживаются только JPG, PNG и WebP" },
      { status: 415 }
    );
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "Файл больше 2 МБ" },
      { status: 413 }
    );
  }

  const name = `${randomBytes(8).toString("hex")}${ext}`;
  const data = Buffer.from(await file.arrayBuffer());
  const stored = await saveUpload("avatars", name, data, file.type);

  await prisma.user.update({
    where: { id: me.id },
    data: { avatarUrl: stored.url },
  });
  if (me.avatarUrl && me.avatarUrl !== stored.url) {
    await deleteStored(me.avatarUrl);
  }

  return NextResponse.json({ avatarUrl: stored.url }, { status: 201 });
}

export async function DELETE(): Promise<Response> {
  const me = await getSessionUser();
  if (!me) {
    return NextResponse.json({ error: "Требуется вход" }, { status: 401 });
  }
  if (!me.avatarUrl) {
    return NextResponse.json(
      { error: "Аватар не загружен" },
      { status: 400 }
    );
  }

  await prisma.user.update({
    where: { id: me.id },
    data: { avatarUrl: null },
  });
  await deleteStored(me.avatarUrl);

  return new NextResponse(null, { status: 204 });
}
