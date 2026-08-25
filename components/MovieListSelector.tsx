"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  getList,
  LIST_KEYS,
  LIST_LABELS,
  LISTS_EVENT,
  setListMembership,
  type ListKey,
} from "@/lib/lists";
import { useMe } from "@/hooks/useMe";
import { EyeIcon, BookmarkIcon, CheckCircleIcon } from "@/components/icons";

const LIST_ICONS: Record<ListKey, typeof EyeIcon> = {
  watching: EyeIcon,
  planned: BookmarkIcon,
  watched: CheckCircleIcon,
};

export default function MovieListSelector({ movieId }: { movieId: string }) {
  const { me, ready } = useMe();
  const [active, setActive] = useState<ListKey | null>(null);

  const refresh = useCallback(() => {
    setActive(
      LIST_KEYS.find((k) => getList(k).includes(movieId)) ?? null
    );
  }, [movieId]);

  useEffect(() => {
    refresh();
    window.addEventListener(LISTS_EVENT, refresh);
    return () => window.removeEventListener(LISTS_EVENT, refresh);
  }, [refresh]);

  if (!ready) return null;
  if (!me)
    return (
      <p className="rounded-lg border border-dashed border-fg/10 px-4 py-3 text-sm text-zinc-500">
        Хотите вести список «Смотрю / Буду смотреть / Просмотрено»?{" "}
        <Link href="/login" className="font-medium text-accent hover:underline">
          Войдите
        </Link>{" "}
        или{" "}
        <Link
          href="/register"
          className="font-medium text-accent hover:underline"
        >
          зарегистрируйтесь
        </Link>
        .
      </p>
    );

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-zinc-500">Мой список:</span>
      <div className="flex overflow-hidden rounded-lg border border-fg/10">
        {LIST_KEYS.map((key) => {
          const isActive = active === key;
          const Icon = LIST_ICONS[key];
          return (
            <button
              key={key}
              type="button"
              aria-pressed={isActive}
              onClick={() => {
                setListMembership(key, movieId);
                refresh();
              }}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-accent text-white"
                  : "bg-fg/5 text-zinc-400 hover:bg-fg/10 hover:text-fg"
              } ${key !== LIST_KEYS[0] ? "border-l border-fg/5" : ""}`}
            >
              <Icon className="h-3.5 w-3.5" />
              {LIST_LABELS[key]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
