import Link from "next/link";
import type { CatalogFilters } from "@/lib/types";

function buildHref(f: CatalogFilters, page: number): string {
  const sp = new URLSearchParams();
  if (f.q) sp.set("q", f.q);
  if (f.genre && f.genre !== "all") sp.set("genre", f.genre);
  if (f.year && f.year !== "all") sp.set("year", String(f.year));
  if (f.sort && f.sort !== "rating-desc") sp.set("sort", f.sort);
  if (page > 1) sp.set("page", String(page));
  const qs = sp.toString();
  return `/catalog${qs ? `?${qs}` : ""}`;
}

function pageWindow(page: number, pages: number): number[] {
  const out: number[] = [];
  const from = Math.max(1, page - 2);
  const to = Math.min(pages, from + 4);
  for (let i = Math.max(1, to - 4); i <= to; i++) out.push(i);
  return out;
}

const linkBase =
  "flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-medium transition-colors";

export default function Pagination({
  filters,
  page,
  pages,
}: {
  filters: CatalogFilters;
  page: number;
  pages: number;
}) {
  if (pages <= 1) return null;

  return (
    <nav
      aria-label="Постраничная навигация"
      className="mt-8 flex flex-wrap items-center justify-center gap-2"
    >
      {page > 1 && (
        <Link href={buildHref(filters, page - 1)} className={`${linkBase} border border-fg/10 text-zinc-600 dark:text-zinc-300 hover:border-accent hover:text-fg`}>
          ← Назад
        </Link>
      )}

      {pageWindow(page, pages).map((p) => (
        <Link
          key={p}
          href={buildHref(filters, p)}
          aria-current={p === page ? "page" : undefined}
          className={
            p === page
              ? `${linkBase} bg-accent text-white`
              : `${linkBase} border border-fg/10 text-zinc-600 dark:text-zinc-300 hover:border-accent hover:text-fg`
          }
        >
          {p}
        </Link>
      ))}

      {page < pages && (
        <Link href={buildHref(filters, page + 1)} className={`${linkBase} border border-fg/10 text-zinc-600 dark:text-zinc-300 hover:border-accent hover:text-fg`}>
          Вперёд →
        </Link>
      )}
    </nav>
  );
}
