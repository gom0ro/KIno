import { NextResponse } from "next/server";
import { MOVIES } from "@/lib/movies";

export const dynamic = "force-dynamic";

export function GET(req: Request) {
  const movie =
    MOVIES[Math.floor(Math.random() * MOVIES.length)] ?? MOVIES[0];
  return NextResponse.redirect(new URL(`/film/${movie.id}`, req.url), {
    status: 307,
  });
}
