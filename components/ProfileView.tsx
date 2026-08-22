"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useFavorites } from "@/hooks/useFavorites";
import { getLists, LIST_KEYS } from "@/lib/lists";
import { getAllRatings } from "@/lib/ratings";
import { getAll as getAllHistory } from "@/lib/watch-history";
import { AUTH_CHANGED_EVENT } from "@/lib/events";
import { MOVIES } from "@/lib/movies";
import { TrashIcon, HeartIcon } from "@/components/icons";
import MovieGrid from "@/components/MovieGrid";

interface ProfileUser {
  id: string;
  email: string;
  name: string;
  bio: string | null;
  role: string;
  avatarColor: string;
  avatarUrl: string | null;
}

interface Stats {
  comments: number;
}

interface Watch {
  hours: number;
  minutes: number;
  movies: number;
  rank: number;
}

export default function ProfileView() {
  const { favorites } = useFavorites();
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [watch, setWatch] = useState<Watch | null>(null);
  const [localCounts, setLocalCounts] = useState({
    lists: 0,
    ratings: 0,
    history: 0,
  });
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarColor, setAvatarColor] = useState("#e50914");
  const [avatarColors, setAvatarColors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/profile", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as {
        user: ProfileUser;
        stats: Stats;
        watch: Watch;
        avatarColors: string[];
      };
      setUser(data.user);
      setStats(data.stats);
      setWatch(data.watch);
      setAvatarColors(data.avatarColors);
      setName(data.user.name);
      setBio(data.user.bio ?? "");
      setAvatarColor(data.user.avatarColor);
    } catch {}
  }, []);

  useEffect(() => {
    void load();
    const reload = () => void load();
    window.addEventListener(AUTH_CHANGED_EVENT, reload);
    return () => window.removeEventListener(AUTH_CHANGED_EVENT, reload);
  }, [load]);

  useEffect(() => {
    const lists = getLists();
    const listCount = LIST_KEYS.reduce(
      (sum, k) => sum + lists[k].length,
      0
    );
    setLocalCounts({
      lists: listCount,
      ratings: Object.keys(getAllRatings()).length,
      history: getAllHistory().length,
    });
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, bio, avatarColor }),
      });
      if (res.ok) {
        setSaved(true);
        window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
        await load();
      }
    } finally {
      setSaving(false);
    }
  }

  async function uploadAvatar(file: File) {
    setUploading(true);
    setUploadError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        body: fd,
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setUploadError(data.error ?? "Не удалось загрузить фото");
        return;
      }
      window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
      await load();
    } catch {
      setUploadError("Ошибка сети");
    } finally {
      setUploading(false);
    }
  }

  async function deleteAvatar() {
    const res = await fetch("/api/profile/avatar", { method: "DELETE" });
    if (res.ok) {
      window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
      await load();
    }
  }

  if (!user) {
    return (
      <div className="animate-fade-in space-y-4" aria-hidden>
        <div className="h-24 w-64 animate-pulse rounded-xl bg-base-800" />
        <div className="h-48 animate-pulse rounded-xl bg-base-800" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-8">
      <section className="flex flex-wrap items-center gap-5">
        <div className="relative">
          {user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatarUrl}
              alt=""
              className="h-20 w-20 select-none rounded-full object-cover ring-1 ring-fg/10"
            />
          ) : (
            <span
              aria-hidden
              className="flex h-20 w-20 select-none items-center justify-center rounded-full text-3xl font-black text-white"
              style={{ backgroundColor: user.avatarColor }}
            >
              {user.name.charAt(0).toUpperCase()}
            </span>
          )}
          {user.avatarUrl && (
            <button
              type="button"
              onClick={deleteAvatar}
              aria-label="Удалить фото"
              title="Удалить фото"
              className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full border border-fg/10 bg-base-900 text-zinc-400 transition-colors hover:text-red-400"
            >
              <TrashIcon className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="min-w-0">
          <h1 className="text-3xl font-black text-fg">{user.name}</h1>
          <p className="mt-1 text-sm text-zinc-500">{user.email}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {user.role === "admin" && (
              <span className="rounded-full bg-accent/15 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-accent">
                Администратор
              </span>
            )}
            <label className="cursor-pointer text-xs font-medium text-zinc-500 transition-colors hover:text-accent">
              {uploading ? "Загрузка…" : user.avatarUrl ? "Сменить фото" : "Загрузить фото"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void uploadAvatar(f);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
          {uploadError && (
            <p className="mt-1 text-xs text-red-400">{uploadError}</p>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-xl font-bold text-fg">
          <span className="h-6 w-1.5 rounded-full bg-accent" />
          <HeartIcon className="h-5 w-5 text-zinc-400" />
          Избранное
          <span className="text-sm font-normal text-zinc-500">
            ({favorites.length})
          </span>
        </h2>
        {favorites.length > 0 ? (
          <MovieGrid
            movies={favorites
              .map((id) => MOVIES.find((m) => m.id === id))
              .filter((m): m is (typeof MOVIES)[number] => Boolean(m))}
          />
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-fg/10 py-16 text-center">
            <HeartIcon className="h-10 w-10 text-zinc-600" />
            <p className="mt-4 font-medium text-zinc-300">Пока пусто</p>
            <p className="mt-1 max-w-sm text-sm text-zinc-500">
              Нажимайте на сердечко на карточках фильмов — они появятся здесь
            </p>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-xl font-bold text-fg">
          <span className="h-6 w-1.5 rounded-full bg-accent" />
          Время просмотра
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            {
              label: "Часов всего",
              value:
                watch && watch.hours + watch.minutes > 0
                  ? `${watch.hours} ч ${watch.minutes} мин`
                  : "—",
            },
            { label: "Фильмов начато", value: watch?.movies ?? 0 },
            {
              label: "Место в топе",
              value: watch?.rank ? `#${watch.rank}` : "—",
            },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="rounded-xl border border-fg/5 bg-base-800/60 p-4"
            >
              <p className="text-xl font-black text-fg">{value}</p>
              <p className="mt-0.5 text-xs text-zinc-500">{label}</p>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-zinc-600">
          Часы засчитываются автоматически во время просмотра.{" "}
          <Link href="/top" className="text-accent hover:underline">
            Топ-50 зрителей
          </Link>
        </p>
      </section>

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-xl font-bold text-fg">
          <span className="h-6 w-1.5 rounded-full bg-accent" />
          Статистика
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            { label: "Избранное", value: favorites.length },
            { label: "В списках", value: localCounts.lists },
            { label: "Оценки", value: localCounts.ratings },
            { label: "История", value: localCounts.history },
            { label: "Комментарии", value: stats?.comments ?? 0 },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="rounded-xl border border-fg/5 bg-base-800/60 p-4"
            >
              <p className="text-2xl font-black text-fg">{value}</p>
              <p className="mt-0.5 text-xs text-zinc-500">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-xl font-bold text-fg">
          <span className="h-6 w-1.5 rounded-full bg-accent" />
          Настройки профиля
        </h2>
        <form onSubmit={save} className="max-w-xl space-y-4 rounded-xl border border-fg/5 bg-base-800/60 p-5">
          <div>
            <label htmlFor="name" className="text-sm font-medium text-zinc-300">
              Имя
            </label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
              required
              className="mt-1.5 w-full rounded-lg border border-fg/10 bg-base-950 px-3 py-2.5 text-sm text-zinc-200 outline-none transition-colors focus:border-accent"
            />
          </div>

          <div>
            <label htmlFor="bio" className="text-sm font-medium text-zinc-300">
              О себе
            </label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              maxLength={200}
              placeholder="Пара слов о ваших вкусовых предпочтениях…"
              className="mt-1.5 w-full resize-y rounded-lg border border-fg/10 bg-base-950 px-3 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 outline-none transition-colors focus:border-accent"
            />
          </div>

          <div>
            <span className="text-sm font-medium text-zinc-300">Цвет аватара</span>
            <div className="mt-2 flex flex-wrap gap-2.5">
              {avatarColors.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Цвет ${c}`}
                  aria-pressed={avatarColor === c}
                  onClick={() => setAvatarColor(c)}
                  style={{ backgroundColor: c }}
                  className={`h-8 w-8 rounded-full transition-transform hover:scale-110 ${
                    avatarColor === c
                      ? "ring-2 ring-fg ring-offset-2 ring-offset-base-800"
                      : ""
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Сохранение…" : "Сохранить"}
            </button>
            {saved && (
              <span className="text-sm text-emerald-400">Сохранено!</span>
            )}
          </div>
        </form>
      </section>
    </div>
  );
}
