"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { SearchIcon } from "@/components/icons";

interface Suggestion {
  id: string;
  title: string;
  year: number;
  rating: number;
}

export default function HeaderSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (
        t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.tagName === "SELECT" ||
          t.isContentEditable)
      ) {
        return;
      }
      e.preventDefault();
      if (inputRef.current?.offsetParent) {
        inputRef.current.focus();
      } else {
        router.push("/catalog?focus=1");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  useEffect(() => {
    const query = q.trim();
    if (query.length < 2) {
      setItems([]);
      setOpen(false);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(query)}&limit=6`,
          { signal: controller.signal }
        );
        if (!res.ok) return;
        const data = (await res.json()) as { items: Suggestion[] };
        setItems(data.items);
        setActive(-1);
        setOpen(true);
      } catch {
        /* запрос отменён */
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [q]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  function reset() {
    setQ("");
    setItems([]);
    setActive(-1);
    setOpen(false);
    inputRef.current?.blur();
  }

  function go(movieId?: string) {
    const query = q.trim();
    reset();
    if (movieId) router.push(`/film/${movieId}`);
    else if (query)
      router.push(`/catalog?q=${encodeURIComponent(query)}`);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      go(open && active >= 0 ? items[active].id : undefined);
      return;
    }
    if (!open || items.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i <= 0 ? items.length - 1 : i - 1));
    }
  }

  return (
    <div ref={rootRef} className="relative hidden min-w-0 flex-1 md:block">
      <div className="relative mx-auto max-w-sm lg:max-w-md">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-expanded={open}
          aria-controls="header-search-listbox"
          aria-autocomplete="list"
          aria-label="Поиск фильмов"
          title="Поиск по названию, режиссёру или актёру — нажмите /"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => items.length > 0 && setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Фильмы, режиссёры, актёры…"
          className="w-full rounded-full border border-fg/10 bg-base-800 py-2 pl-9 pr-9 text-sm text-fg outline-none transition-colors placeholder:text-zinc-500 hover:border-fg/20 focus:border-accent"
        />
        {!q && (
          <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded border border-fg/15 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-zinc-500">
            /
          </kbd>
        )}

        {open && (
          <div className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-fg/10 bg-base-900 shadow-[0_16px_48px_-8px_rgba(0,0,0,0.6)]">
            {items.length === 0 ? (
              <p className="px-4 py-3.5 text-sm text-zinc-500">
                Ничего не найдено
              </p>
            ) : (
              <>
                <ul id="header-search-listbox" role="listbox">
                  {items.map((m, i) => (
                    <li key={m.id} role="option" aria-selected={i === active}>
                      <Link
                        href={`/film/${m.id}`}
                        onMouseEnter={() => setActive(i)}
                        onClick={reset}
                        className={`flex items-center gap-3 px-3 py-2 transition-colors ${
                          i === active ? "bg-fg/10" : ""
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`/posters/${m.id}.svg`}
                          alt=""
                          loading="lazy"
                          className="h-14 w-10 shrink-0 rounded-md object-cover ring-1 ring-fg/10"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-fg">
                            {m.title}
                          </span>
                          <span className="block text-xs text-zinc-500">
                            {m.year}
                          </span>
                        </span>
                        <span className="shrink-0 text-sm font-bold text-accent">
                          {m.rating.toFixed(1)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/catalog?q=${encodeURIComponent(q.trim())}`}
                  onClick={reset}
                  className="block border-t border-fg/10 px-4 py-2.5 text-center text-sm font-medium text-zinc-400 transition-colors hover:bg-fg/5 hover:text-fg"
                >
                  Показать все результаты
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
