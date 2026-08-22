import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth";
import { addMovie, getMoviesRaw, type NewMovieInput } from "@/lib/movies-admin";

interface MovieBody {
  title?: unknown;
  originalTitle?: unknown;
  description?: unknown;
  year?: unknown;
  genres?: unknown;
  duration?: unknown;
  ageRating?: unknown;
  director?: unknown;
  cast?: unknown;
  country?: unknown;
  videoUrl?: unknown;
}

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

export async function GET(): Promise<Response> {
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
  return NextResponse.json({ movies: await getMoviesRaw() });
}

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
  if (process.env.VERCEL === "1") {
    return NextResponse.json(
      {
        error:
          "В облачной версии каталог неизменяемый: добавляйте фильмы локально и деплойте",
      },
      { status: 501 }
    );
  }

  let body: MovieBody;
  try {
    body = (await req.json()) as MovieBody;
  } catch {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const title = str(body.title);
  const description = str(body.description);
  const director = str(body.director);
  const country = str(body.country);
  const videoUrl = str(body.videoUrl);
  const year = Number(body.year);
  const duration = Number(body.duration);
  const ageRating = Number(body.ageRating ?? 16);
  const genres = Array.isArray(body.genres)
    ? body.genres.map(str).filter(Boolean).slice(0, 5)
    : [];
  const cast = Array.isArray(body.cast)
    ? body.cast.map(str).filter(Boolean).slice(0, 10)
    : [];

  if (title.length < 1 || title.length > 120) {
    return NextResponse.json({ error: "Название: от 1 до 120 символов" }, { status: 400 });
  }
  if (!Number.isInteger(year) || year < 1900 || year > 2100) {
    return NextResponse.json({ error: "Год: целое число 1900–2100" }, { status: 400 });
  }
  if (!Number.isInteger(duration) || duration < 1 || duration > 600) {
    return NextResponse.json({ error: "Длительность: 1–600 минут" }, { status: 400 });
  }
  if (!Number.isInteger(ageRating) || ageRating < 0 || ageRating > 18) {
    return NextResponse.json({ error: "Возрастной рейтинг: 0–18" }, { status: 400 });
  }
  if (description.length < 10 || description.length > 2000) {
    return NextResponse.json({ error: "Описание: от 10 до 2000 символов" }, { status: 400 });
  }
  if (!director) {
    return NextResponse.json({ error: "Укажите режиссёра" }, { status: 400 });
  }
  if (!country) {
    return NextResponse.json({ error: "Укажите страну" }, { status: 400 });
  }
  if (genres.length === 0) {
    return NextResponse.json({ error: "Укажите хотя бы один жанр" }, { status: 400 });
  }
  if (cast.length === 0) {
    return NextResponse.json({ error: "Укажите хотя бы одного актёра" }, { status: 400 });
  }
  if (!/^(https?:\/\/|\/)/.test(videoUrl)) {
    return NextResponse.json(
      { error: "Ссылка на видео должна начинаться с http(s):// или /" },
      { status: 400 }
    );
  }

  const input: NewMovieInput = {
    title,
    originalTitle: str(body.originalTitle),
    description,
    year,
    genres,
    duration,
    ageRating,
    director,
    cast,
    country,
    videoUrl,
  };

  const movie = await addMovie(input);

  revalidatePath("/");
  revalidatePath("/catalog");
  revalidatePath(`/film/${movie.id}`);

  return NextResponse.json({ movie }, { status: 201 });
}
