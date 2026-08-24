"use client";

import { useEffect, useState, type ComponentType } from "react";
import { MOVIES } from "@/lib/movies";
import MovieGrid from "@/components/MovieGrid";
import {
  PlayIcon,
  ClockIcon,
  CheckIcon,
  type IconProps,
} from "@/components/icons";
import {
  getLists,
  getList,
  LIST_KEYS,
  LIST_LABELS,
  LISTS_EVENT,
  type ListKey,
} from "@/lib/lists";

const ICONS: Record<ListKey, ComponentType<IconProps>> = {
  watching: PlayIcon,
  planned: ClockIcon,
  watched: CheckIcon,
};

export default function ListsView() {
  const [tab, setTab] = useState<ListKey>("watching");
  const [lists, setLists] = useState<Record<ListKey, string[]>>({
    watching: [],
    planned: [],
    watched: [],
  });

  useEffect(() => {
    const refresh = () => setLists(getLists());
    refresh();
    window.addEventListener(LISTS_EVENT, refresh);
    return () => window.removeEventListener(LISTS_EVENT, refresh);
  }, []);

  const ids = lists[tab];
  const movies = ids
    .map((id) => MOVIES.find((m) => m.id === id))
    .filter((m): m is (typeof MOVIES)[number] => Boolean(m));
  const TabIconEmpty = ICONS[tab];

  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <h1 className="text-3xl font-black text-fg">Мои списки</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Управляйте тем, что смотрите, планируете и уже посмотрели
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {LIST_KEYS.map((key) => {
          const TabIcon = ICONS[key];
          return (
            <button
              key={key}
              type="button"
              aria-pressed={tab === key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                tab === key
                  ? "bg-accent text-white"
                  : "bg-base-800 text-zinc-400 hover:text-fg"
              }`}
            >
              <TabIcon className="h-4 w-4" />
              {LIST_LABELS[key]}
              <span
                className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-bold ${
                  tab === key ? "bg-fg/20" : "bg-fg/10"
                }`}
              >
                {getList(key).length}
              </span>
            </button>
          );
        })}
      </div>

      {movies.length > 0 ? (
        <MovieGrid movies={movies} />
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-fg/10 py-16 text-center">
          <TabIconEmpty className="h-10 w-10 text-zinc-600" />
          <p className="mt-4 font-medium text-zinc-300">
            Список «{LIST_LABELS[tab]}» пуст
          </p>
          <p className="mt-1 max-w-sm text-sm text-zinc-500">
            Откройте любой фильм и добавьте его кнопками под описанием
          </p>
        </div>
      )}
    </div>
  );
}
