import { NextResponse } from "next/server";
import { quickSearch } from "@/lib/movies";

export async function GET(req: Request): Promise<Response> {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const limitRaw = Number(searchParams.get("limit"));
  const limit =
    Number.isInteger(limitRaw) && limitRaw > 0 && limitRaw <= 20
      ? limitRaw
      : 6;

  const items = quickSearch(q, limit).map((m) => ({
    id: m.id,
    title: m.title,
    year: m.year,
    rating: m.rating,
  }));

  return NextResponse.json({ items });
}
