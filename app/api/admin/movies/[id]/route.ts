import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth";
import { removeMovie } from "@/lib/movies-admin";

export async function DELETE(
  _req: Request,
  ctx: { params: { id: string } }
): Promise<Response> {
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
  if (process.env.VERCEL === "1") {
    return NextResponse.json(
      {
        error:
          "В облачной версии каталог неизменяемый: удаляйте фильмы локально и деплойте",
      },
      { status: 501 }
    );
  }

  const ok = await removeMovie(ctx.params.id);
  if (!ok) {
    return NextResponse.json({ error: "Фильм не найден" }, { status: 404 });
  }

  revalidatePath("/");
  revalidatePath("/catalog");

  return new NextResponse(null, { status: 204 });
}
