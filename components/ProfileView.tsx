"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFavorites } from "@/hooks/useFavorites";
import { getLists, LIST_KEYS } from "@/lib/lists";
import { getAllRatings } from "@/lib/ratings";
import {
  getAll as getAllHistory,
  removePosition,
  type HistoryEntry,
} from "@/lib/watch-history";
import { AUTH_CHANGED_EVENT } from "@/lib/events";
import { maskEmail } from "@/lib/mask";
import { MOVIES, formatDuration } from "@/lib/movies";
import {
  TrashIcon,
  HeartIcon,
  StarIcon,
  ClockIcon,
  TrophyIcon,
  PlayIcon,
  FilmIcon,
  TuneIcon,
  PencilIcon,
  MessageIcon,
} from "@/components/icons";
import MovieGrid from "@/components/MovieGrid";
import MyComments from "@/components/MyComments";
import DataManager from "@/components/DataManager";
import PasswordInput from "@/components/PasswordInput";

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

type Tab = "overview" | "history" | "achievements" | "settings";

const TABS = [
  { id: "overview", label: "Обзор", Icon: FilmIcon },
  { id: "history", label: "История", Icon: ClockIcon },
  { id: "achievements", label: "Достижения", Icon: TrophyIcon },
  { id: "settings", label: "Настройки", Icon: TuneIcon },
] as const;

function SectionCard({
  title,
  icon: Icon,
  right,
  children,
  className = "",
}: {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-fg/5 bg-base-900/60 p-5 transition-colors sm:p-6 ${className}`}
    >
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
          {Icon ? <Icon className="h-5 w-5" /> : null}
        </span>
        <h2 className="text-lg font-bold text-fg sm:text-xl">{title}</h2>
        {right && <div className="ml-auto">{right}</div>}
      </div>
      {children}
    </section>
  );
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
  const [showMyComments, setShowMyComments] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [tab, setTab] = useState<Tab>("overview");
  const [pwCurrent, setPwCurrent] = useState("");
  const [pwNew, setPwNew] = useState("");
  const [pwRepeat, setPwRepeat] = useState("");
  const [pwMessage, setPwMessage] = useState<{
    type: "ok" | "error";
    text: string;
  } | null>(null);
  const [pwSaving, setPwSaving] = useState(false);
  const [emNew, setEmNew] = useState("");
  const [emCurrent, setEmCurrent] = useState("");
  const [emMessage, setEmMessage] = useState<{
    type: "ok" | "error";
    text: string;
  } | null>(null);
  const [emSaving, setEmSaving] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const router = useRouter();

  async function logout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
      router.push("/");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

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
    const readLocal = () => ({
      lists: LIST_KEYS.reduce((sum, k) => sum + getLists()[k].length, 0),
      ratings: Object.keys(getAllRatings()).length,
      history: getAllHistory().length,
    });
    setLocalCounts(readLocal());
    setHistory(getAllHistory());

    const refresh = () => {
      setLocalCounts(readLocal());
      setHistory(getAllHistory());
    };
    window.addEventListener("storage", refresh);
    return () => window.removeEventListener("storage", refresh);
  }, []);

  const rated = getAllRatings();

  const seenIds = new Set([
    ...Object.keys(rated),
    ...favorites,
    ...history.map((h) => h.id),
  ]);
  const genreCount = new Map<string, number>();
  for (const id of seenIds) {
    const movie = MOVIES.find((m) => m.id === id);
    if (!movie) continue;
    for (const g of movie.genres) {
      genreCount.set(g, (genreCount.get(g) ?? 0) + 1);
    }
  }
  const tasteTotal = [...genreCount.values()].reduce((a, b) => a + b, 0);
  const tasteTop = [...genreCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const ratingValues = Object.values(rated);
  const ratingCounts = new Map<number, number>();
  for (const v of ratingValues) {
    ratingCounts.set(v, (ratingCounts.get(v) ?? 0) + 1);
  }
  const ratingHistogram = Array.from({ length: 10 }, (_, i) => ({
    value: i + 1,
    count: ratingCounts.get(i + 1) ?? 0,
  }));
  const ratingAvg =
    ratingValues.length > 0
      ? ratingValues.reduce((sum, v) => sum + v, 0) / ratingValues.length
      : null;

  const achievements = [
    {
      Icon: PlayIcon,
      name: "Первый сеанс",
      desc: "Начать смотреть фильм",
      done: localCounts.history > 0 || (watch?.movies ?? 0) > 0,
    },
    {
      Icon: ClockIcon,
      name: "Киноман",
      desc: "Просмотреть 10 часов",
      done: (watch?.hours ?? 0) >= 10,
    },
    {
      Icon: HeartIcon,
      name: "Коллекционер",
      desc: "Добавить 10 фильмов в избранное",
      done: favorites.length >= 10,
    },
    {
      Icon: StarIcon,
      name: "Критик",
      desc: "Оценить 10 фильмов",
      done: localCounts.ratings >= 10,
    },
    {
      Icon: TrophyIcon,
      name: "Элита топа",
      desc: "Попасть в топ-50 зрителей",
      done: (watch?.rank ?? Infinity) <= 50 && !!watch?.rank,
    },
  ];
  const unlockedCount = achievements.filter((a) => a.done).length;

  function removeHistory(id: string) {
    removePosition(id);
    setHistory(getAllHistory());
    setLocalCounts((c) => ({ ...c, history: getAllHistory().length }));
  }

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

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (pwSaving) return;
    if (pwNew !== pwRepeat) {
      setPwMessage({ type: "error", text: "Пароли не совпадают" });
      return;
    }
    setPwSaving(true);
    setPwMessage(null);
    try {
      const res = await fetch("/api/profile/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: pwCurrent, newPassword: pwNew }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setPwMessage({ type: "error", text: data.error ?? "Ошибка" });
        return;
      }
      setPwMessage({ type: "ok", text: "Пароль изменён" });
      setPwCurrent("");
      setPwNew("");
      setPwRepeat("");
    } catch {
      setPwMessage({ type: "error", text: "Ошибка сети" });
    } finally {
      setPwSaving(false);
    }
  }

  async function changeEmail(e: React.FormEvent) {
    e.preventDefault();
    if (emSaving) return;
    setEmSaving(true);
    setEmMessage(null);
    try {
      const res = await fetch("/api/profile/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newEmail: emNew, currentPassword: emCurrent }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setEmMessage({ type: "error", text: data.error ?? "Ошибка" });
        return;
      }
      setEmMessage({ type: "ok", text: "Почта изменена" });
      setEmNew("");
      setEmCurrent("");
      window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
      await load();
    } catch {
      setEmMessage({ type: "error", text: "Ошибка сети" });
    } finally {
      setEmSaving(false);
    }
  }

  async function deleteAccount(e: React.FormEvent) {
    e.preventDefault();
    if (deleting || !deletePassword) return;
    if (
      !window.confirm(
        "Аккаунт будет удалён безвозвратно вместе с комментариями и статистикой. Продолжить?"
      )
    ) {
      return;
    }
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch("/api/profile", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: deletePassword }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setDeleteError(data.error ?? "Ошибка");
        return;
      }
      localStorage.clear();
      window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
      window.location.href = "/";
    } catch {
      setDeleteError("Ошибка сети");
    } finally {
      setDeleting(false);
    }
  }

  if (!user) {
    return (
      <div className="animate-fade-in space-y-6" aria-hidden>
        <div className="overflow-hidden rounded-3xl border border-fg/5 bg-base-900">
          <div className="skeleton h-32 rounded-none sm:h-40" />
          <div className="-mt-12 px-6 pb-6">
            <div className="skeleton h-24 w-24 rounded-full ring-4 ring-base-900" />
            <div className="skeleton mt-4 h-7 w-56" />
            <div className="skeleton mt-2 h-4 w-40" />
          </div>
        </div>
        <div className="skeleton h-12 w-full rounded-xl" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-2">
          <div className="skeleton h-64" />
          <div className="skeleton h-64" />
        </div>
      </div>
    );
  }

  const heroGlow = user.avatarColor;

  return (
    <div className="animate-fade-in space-y-8">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-3xl border border-fg/5 bg-base-900 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.5)]">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-full opacity-[0.13]"
          style={{
            background: `radial-gradient(600px 220px at 15% 0%, ${heroGlow}, transparent), radial-gradient(500px 200px at 85% 0%, #e50914, transparent)`,
          }}
        />
        <div aria-hidden className="h-16 sm:h-24" />
        <div className="relative px-5 pb-6 sm:px-8">
          <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
            <div className="group relative -mt-12 shrink-0 sm:-mt-16">
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatarUrl}
                  alt=""
                  className="h-28 w-28 select-none rounded-2xl object-cover shadow-xl ring-4 ring-base-900 sm:h-32 sm:w-32"
                />
              ) : (
                <span
                  aria-hidden
                  className="flex h-28 w-28 select-none items-center justify-center rounded-2xl text-4xl font-black text-white shadow-xl ring-4 ring-base-900 sm:h-32 sm:w-32 sm:text-5xl"
                  style={{ backgroundColor: user.avatarColor }}
                >
                  {user.name.charAt(0).toUpperCase()}
                </span>
              )}
              <label
                className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-2xl bg-black/55 opacity-0 transition-opacity group-hover:opacity-100"
                title={uploading ? "Загрузка…" : "Сменить фото"}
              >
                <PencilIcon className="h-6 w-6 text-white" />
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
              {user.avatarUrl && (
                <button
                  type="button"
                  onClick={deleteAvatar}
                  aria-label="Удалить фото"
                  title="Удалить фото"
                  className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full border border-fg/10 bg-base-800 text-zinc-400 shadow-lg transition-colors hover:text-red-400"
                >
                  <TrashIcon className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="min-w-0 flex-1 pb-1">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <h1 className="text-3xl font-black tracking-tight text-fg sm:text-4xl">
                  {user.name}
                </h1>
                {user.role === "admin" && (
                  <span className="rounded-full bg-accent/15 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-accent ring-1 ring-accent/30">
                    Администратор
                  </span>
                )}
              </div>
              {user.bio && (
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-400">
                  {user.bio}
                </p>
              )}
              {uploadError && (
                <p className="mt-2 text-xs text-red-400">{uploadError}</p>
              )}
            </div>
          </div>

          {/* STATS */}
          <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {[
              {
                Icon: ClockIcon,
                label: "Времени",
                value:
                  watch && watch.hours + watch.minutes > 0
                    ? `${watch.hours} ч ${watch.minutes} м`
                    : "—",
                href: "/top",
              },
              {
                Icon: PlayIcon,
                label: "Начато",
                value: watch?.movies ?? 0,
              },
              {
                Icon: TrophyIcon,
                label: "В топе",
                value: watch?.rank ? `#${watch.rank}` : "—",
                href: "/top",
              },
              {
                Icon: StarIcon,
                label: "Оценок",
                value: localCounts.ratings,
              },
              {
                Icon: HeartIcon,
                label: "Избранное",
                value: favorites.length,
              },
            ].map(({ Icon, label, value, href }, i) => {
              const inner = (
                <>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-fg/5 text-zinc-400 transition-colors group-hover:bg-accent/10 group-hover:text-accent">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-lg font-black leading-tight text-fg">
                      {value}
                    </span>
                    <span className="block text-[11px] uppercase tracking-wide text-zinc-600">
                      {label}
                    </span>
                  </span>
                </>
              );
              const cls = `group flex items-center gap-3 rounded-xl border border-fg/5 bg-base-800/80 p-3 backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-accent/30 ${
                href ? "" : "cursor-default"
              }`;
              return (
                <div key={label} className="animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                  {href ? (
                    <Link href={href} className={cls}>
                      {inner}
                    </Link>
                  ) : (
                    <div className={cls}>{inner}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* TABS */}
      <nav
        aria-label="Разделы профиля"
        className="sticky top-16 z-30 -mx-4 border-b border-fg/5 bg-base-950/85 px-4 py-2 backdrop-blur-md sm:-mx-6 sm:px-6 md:rounded-xl md:border md:border-fg/5 md:px-2 md:py-1.5"
      >
        <div className="flex w-full min-w-0 snap-x gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TABS.map(({ id, label, Icon }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                aria-current={active ? "page" : undefined}
                className={`flex shrink-0 snap-start items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  active
                    ? "bg-accent text-white shadow-[0_4px_16px_-4px_rgba(229,9,20,0.5)]"
                    : "text-zinc-400 hover:bg-fg/5 hover:text-fg"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* OVERVIEW */}
      {tab === "overview" && (
        <div key="overview" className="animate-fade-in space-y-6">
          {history.length > 0 && (
            <SectionCard title="Продолжить просмотр" icon={PlayIcon}>
              <ul className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {history.map((entry, i) => {
                  const movie = MOVIES.find((m) => m.id === entry.id);
                  if (!movie) return null;
                  const total = entry.duration || movie.duration * 60;
                  const progress = Math.min(
                    100,
                    Math.round((entry.position / total) * 100)
                  );
                  const finished = entry.duration > 0 && entry.position / entry.duration > 0.95;
                  return (
                    <li
                      key={entry.id}
                      className="w-64 shrink-0 animate-fade-in snap-start"
                      style={{ animationDelay: `${i * 60}ms` }}
                    >
                      <Link
                        href={`/film/${movie.id}`}
                        className="group block overflow-hidden rounded-xl border border-fg/5 bg-base-800/80 transition-all duration-300 hover:-translate-y-1 hover:border-accent/50 hover:shadow-[0_12px_36px_-12px_rgba(229,9,20,0.4)]"
                      >
                        <div className="relative aspect-video overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`/posters/${movie.id}.svg`}
                            alt=""
                            loading="lazy"
                            className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100">
                            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-white shadow-lg">
                              <PlayIcon className="ml-0.5 h-5 w-5" />
                            </span>
                          </div>
                          <span className="absolute bottom-2 left-2 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur">
                            {finished
                              ? "Финал"
                              : `Осталось ~${formatDuration(Math.max(1, Math.round((total - entry.position) / 60)))}`}
                          </span>
                        </div>
                        <div className="p-3">
                          <p className="truncate text-sm font-semibold text-fg">
                            {movie.title}
                          </p>
                          <p className="text-xs text-zinc-500">{movie.year}</p>
                          <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-base-950">
                            <span
                              className="block h-full rounded-full bg-gradient-to-r from-accent to-accent-hover transition-all duration-700"
                              style={{ width: `${progress}%` }}
                            />
                          </span>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </SectionCard>
          )}

          {(tasteTotal > 0 || ratingAvg !== null) && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {tasteTotal > 0 && (
                <SectionCard title="Ваши вкусы" icon={FilmIcon}>
                  <ul className="space-y-4">
                    {tasteTop.map(([genre, count], i) => (
                      <li key={genre}>
                        <div className="mb-1.5 flex items-baseline justify-between text-sm">
                          <span
                            className={
                              i === 0
                                ? "font-semibold text-fg"
                                : "text-zinc-300"
                            }
                          >
                            {genre}
                            {i === 0 && (
                              <span className="ml-2 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent">
                                любимый
                              </span>
                            )}
                          </span>
                          <span className="text-xs font-medium text-zinc-500">
                            {Math.round((count / tasteTotal) * 100)}%
                          </span>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-base-800">
                          <div
                            className="h-full rounded-full transition-all duration-1000 ease-out"
                            style={{
                              width: `${(count / tasteTop[0][1]) * 100}%`,
                              background: `linear-gradient(90deg, ${user.avatarColor}, #e50914)`,
                              opacity: 0.45 + (1 - i * 0.09),
                            }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 border-t border-fg/5 pt-3 text-xs text-zinc-600">
                    По оценкам, истории и избранному · {tasteTotal} отметок
                  </p>
                </SectionCard>
              )}

              {ratingAvg !== null && (
                <SectionCard
                  title="График оценок"
                  icon={StarIcon}
                  right={
                    <span className="rounded-full bg-base-800 px-3 py-1 text-xs text-zinc-400">
                      Средняя{" "}
                      <span className="font-bold text-accent">
                        {ratingAvg.toFixed(1)}
                      </span>
                    </span>
                  }
                >
                  <div className="flex h-40 items-end gap-1.5">
                    {ratingHistogram.map(({ value, count }) => {
                      const max = Math.max(
                        ...ratingHistogram.map((h) => h.count),
                        1
                      );
                      return (
                        <div
                          key={value}
                          className="group relative flex h-full flex-1 flex-col justify-end"
                          title={`Оценка ${value}: ${count}`}
                        >
                          <span
                            className={`mb-1 text-center text-[10px] font-bold text-zinc-400 transition-opacity ${
                              count > 0
                                ? "opacity-0 group-hover:opacity-100"
                                : ""
                            }`}
                          >
                            {count || ""}
                          </span>
                          <div
                            className={`w-full rounded-t-md transition-all duration-700 group-hover:brightness-125 ${
                              value >= 8
                                ? "bg-emerald-500/80"
                                : value >= 5
                                  ? "bg-accent"
                                  : "bg-zinc-600"
                            }`}
                            style={{ height: `${Math.max(count > 0 ? 6 : 2, (count / max) * 100)}%` }}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-2 flex gap-1.5 border-t border-fg/5 pt-2 text-center text-[10px] font-medium text-zinc-600">
                    {ratingHistogram.map(({ value }) => (
                      <span key={value} className="flex-1">
                        {value}
                      </span>
                    ))}
                  </div>
                </SectionCard>
              )}
            </div>
          )}

          <SectionCard
            title="Избранное"
            icon={HeartIcon}
            right={
              <span className="rounded-full bg-base-800 px-3 py-1 text-xs text-zinc-400">
                {favorites.length}
              </span>
            }
          >
            {favorites.length > 0 ? (
              <MovieGrid
                movies={favorites
                  .map((id) => MOVIES.find((m) => m.id === id))
                  .filter((m): m is (typeof MOVIES)[number] => Boolean(m))}
              />
            ) : (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-fg/10 py-14 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-fg/5">
                  <HeartIcon className="h-7 w-7 text-zinc-600" />
                </span>
                <p className="mt-4 font-medium text-zinc-300">Пока пусто</p>
                <p className="mt-1 max-w-sm text-sm text-zinc-500">
                  Нажимайте на сердечко на карточках фильмов — они появятся здесь
                </p>
                <Link
                  href="/catalog"
                  className="mt-4 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                >
                  Перейти в каталог
                </Link>
              </div>
            )}
          </SectionCard>

          <button
            type="button"
            onClick={() => setShowMyComments((v) => !v)}
            aria-expanded={showMyComments}
            className="group flex w-full items-center gap-3 rounded-2xl border border-fg/5 bg-base-900/60 p-5 text-left transition-colors hover:border-accent/30"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <MessageIcon className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-bold text-fg">Мои комментарии</span>
              <span className="block text-xs text-zinc-500">
                {stats?.comments ?? 0} написано — нажмите, чтобы{" "}
                {showMyComments ? "скрыть" : "посмотреть"}
              </span>
            </span>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
              className={`h-4 w-4 shrink-0 text-zinc-500 transition-transform ${
                showMyComments ? "rotate-180" : ""
              }`}
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
          {showMyComments && (
            <div className="animate-fade-in">
              <MyComments />
            </div>
          )}
        </div>
      )}

      {/* HISTORY */}
      {tab === "history" && (
        <div key="history" className="animate-fade-in">
          <SectionCard
            title="История просмотров"
            icon={ClockIcon}
            right={
              <span className="rounded-full bg-base-800 px-3 py-1 text-xs text-zinc-400">
                {history.length}
              </span>
            }
          >
            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-fg/10 py-14 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-fg/5">
                  <PlayIcon className="h-6 w-6 text-zinc-600" />
                </span>
                <p className="mt-4 font-medium text-zinc-300">
                  Вы ещё ничего не смотрели
                </p>
                <Link
                  href="/catalog"
                  className="mt-4 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                >
                  Выбрать фильм
                </Link>
              </div>
            ) : (
              <ul className="space-y-2.5">
                {history.map((entry, i) => {
                  const movie = MOVIES.find((m) => m.id === entry.id);
                  if (!movie) return null;
                  const total = entry.duration || movie.duration * 60;
                  const progress = Math.min(
                    100,
                    Math.round((entry.position / total) * 100)
                  );
                  const finished =
                    entry.duration > 0 && entry.position / entry.duration > 0.95;
                  return (
                    <li
                      key={entry.id}
                      className="group/row flex items-center gap-3 rounded-xl border border-fg/5 bg-base-800/80 p-3 transition-colors hover:border-accent/40 animate-fade-in"
                      style={{ animationDelay: `${i * 40}ms` }}
                    >
                      <Link
                        href={`/film/${movie.id}`}
                        className="flex min-w-0 flex-1 items-center gap-3"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`/posters/${movie.id}.svg`}
                          alt=""
                          loading="lazy"
                          className="h-14 w-10 shrink-0 rounded-md object-cover ring-1 ring-fg/10"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-fg">
                            {movie.title}
                          </span>
                          <span className="block text-xs text-zinc-500">
                            {movie.year} ·{" "}
                            {finished
                              ? "просмотрено"
                              : `осталось ~${formatDuration(Math.max(1, Math.round((total - entry.position) / 60)))}`}
                          </span>
                          <span className="mt-1.5 flex items-center gap-2">
                            <span className="block h-1.5 flex-1 overflow-hidden rounded-full bg-base-950">
                              <span
                                className="block h-full rounded-full bg-gradient-to-r from-accent to-accent-hover"
                                style={{ width: `${progress}%` }}
                              />
                            </span>
                            <span className="w-9 text-right text-[10px] font-bold text-zinc-600">
                              {progress}%
                            </span>
                          </span>
                        </span>
                      </Link>
                      <span className="shrink-0 rounded-lg border border-fg/10 px-3 py-1.5 text-xs font-medium text-zinc-300 opacity-0 transition-opacity group-hover/row:opacity-100">
                        <Link href={`/film/${movie.id}`}>
                          {finished ? "Ещё раз" : "Продолжить"}
                        </Link>
                      </span>
                      <button
                        type="button"
                        onClick={() => removeHistory(entry.id)}
                        aria-label={`Убрать «${movie.title}» из истории`}
                        title="Убрать из истории"
                        className="shrink-0 rounded-lg p-1.5 text-zinc-600 transition-colors hover:bg-fg/5 hover:text-red-400"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </SectionCard>
        </div>
      )}

      {/* ACHIEVEMENTS */}
      {tab === "achievements" && (
        <div key="achievements" className="animate-fade-in space-y-6">
          <SectionCard
            title="Достижения"
            icon={TrophyIcon}
            right={
              <span className="rounded-full bg-base-800 px-3 py-1 text-xs text-zinc-400">
                {unlockedCount}/{achievements.length}
              </span>
            }
          >
            <div className="mb-6 h-2.5 overflow-hidden rounded-full bg-base-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-accent to-orange-400 transition-all duration-1000"
                style={{ width: `${(unlockedCount / achievements.length) * 100}%` }}
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {achievements.map(({ Icon, name, desc, done }, i) => (
                <div
                  key={name}
                  className={`relative flex items-start gap-4 overflow-hidden rounded-xl border p-4 transition-all duration-300 animate-fade-in ${
                    done
                      ? "border-accent/30 bg-gradient-to-br from-accent/[0.08] to-transparent hover:-translate-y-0.5 hover:border-accent/60"
                      : "border-fg/5 bg-base-800/40"
                  }`}
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  {done && (
                    <span
                      aria-hidden
                      className="absolute -right-4 -top-4 h-14 w-14 rounded-full bg-accent/10 blur-lg"
                    />
                  )}
                  <span
                    className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                      done
                        ? "bg-gradient-to-br from-accent to-accent-hover text-white shadow-[0_6px_18px_-4px_rgba(229,9,20,0.6)]"
                        : "bg-fg/5 text-zinc-600 grayscale"
                    }`}
                  >
                    <Icon className="h-6 w-6" />
                  </span>
                  <span className="min-w-0">
                    <span
                      className={`block text-sm font-bold ${
                        done ? "text-fg" : "text-zinc-500"
                      }`}
                    >
                      {name}
                    </span>
                    <span className="mt-0.5 block text-xs leading-snug text-zinc-500">
                      {desc}
                    </span>
                    <span
                      className={`mt-1.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        done
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "bg-fg/5 text-zinc-600"
                      }`}
                    >
                      {done ? "получено" : "заблокировано"}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Статистика активности" icon={StarIcon}>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "В списках", value: localCounts.lists },
                { label: "Оценки", value: localCounts.ratings },
                { label: "История", value: localCounts.history },
                { label: "Комментарии", value: stats?.comments ?? 0 },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="rounded-xl border border-fg/5 bg-base-800/80 p-4"
                >
                  <p className="text-2xl font-black text-fg">{value}</p>
                  <p className="mt-0.5 text-xs text-zinc-500">{label}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-zinc-600">
              Часы засчитываются автоматически во время просмотра.{" "}
              <Link href="/top" className="font-medium text-accent hover:underline">
                Топ-50 зрителей
              </Link>
            </p>
          </SectionCard>
        </div>
      )}

      {/* SETTINGS */}
      {tab === "settings" && (
        <div key="settings" className="animate-fade-in grid grid-cols-1 gap-6 xl:grid-cols-2">
          <SectionCard title="Профиль" icon={TuneIcon} className="xl:col-span-2 xl:max-w-3xl">
            <form onSubmit={save} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
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
                  <span className="text-sm font-medium text-zinc-300">
                    Цвет аватара
                  </span>
                  <div className="mt-2.5 flex flex-wrap gap-2">
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
                            ? "ring-2 ring-fg ring-offset-2 ring-offset-base-900"
                            : ""
                        }`}
                      />
                    ))}
                  </div>
                </div>
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

              <div className="flex items-center gap-3 border-t border-fg/5 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? "Сохранение…" : "Сохранить"}
                </button>
                {saved && (
                  <span className="text-sm font-medium text-emerald-400">
                    Сохранено!
                  </span>
                )}
              </div>
            </form>

            <div className="mt-5 border-t border-fg/5 pt-5">
              <DataManager />
            </div>
          </SectionCard>

          <SectionCard title="Почта" icon={TuneIcon}>
            <div>
              <span className="text-sm font-medium text-zinc-300">
                Текущая почта
              </span>
              <p className="mt-1.5 rounded-lg border border-fg/10 bg-base-950 px-3 py-2.5 text-sm text-zinc-400">
                {maskEmail(user.email)}
              </p>
            </div>
            <form onSubmit={changeEmail} className="mt-4 space-y-4">
              <div>
                <label htmlFor="em-new" className="text-sm font-medium text-zinc-300">
                  Новая почта
                </label>
                <input
                  id="em-new"
                  type="email"
                  value={emNew}
                  onChange={(e) => setEmNew(e.target.value)}
                  required
                  maxLength={100}
                  autoComplete="email"
                  className="mt-1.5 w-full rounded-lg border border-fg/10 bg-base-950 px-3 py-2.5 text-sm text-zinc-200 outline-none transition-colors focus:border-accent"
                />
              </div>
              <div>
                <label htmlFor="em-current" className="text-sm font-medium text-zinc-300">
                  Текущий пароль
                </label>
                <PasswordInput
                  id="em-current"
                  value={emCurrent}
                  onChange={(e) => setEmCurrent(e.target.value)}
                  required
                  maxLength={100}
                  autoComplete="current-password"
                  wrapperClassName="mt-1.5"
                  className="w-full rounded-lg border border-fg/10 bg-base-950 px-3 py-2.5 text-sm text-zinc-200 outline-none transition-colors focus:border-accent"
                />
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={emSaving}
                  className="rounded-lg border border-fg/15 px-5 py-2.5 text-sm font-semibold text-fg transition-colors hover:border-accent disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {emSaving ? "Сохранение…" : "Изменить почту"}
                </button>
                {emMessage && (
                  <span
                    className={`text-sm ${
                      emMessage.type === "ok"
                        ? "text-emerald-400"
                        : "text-red-400"
                    }`}
                  >
                    {emMessage.text}
                  </span>
                )}
              </div>
            </form>
          </SectionCard>

          <SectionCard title="Безопасность" icon={TuneIcon}>
            <form onSubmit={changePassword} className="space-y-4">
              {(
                [
                  ["Текущий пароль", pwCurrent, setPwCurrent, "pw-current"],
                  ["Новый пароль", pwNew, setPwNew, "pw-new"],
                  ["Повторите новый пароль", pwRepeat, setPwRepeat, "pw-repeat"],
                ] as const
              ).map(([label, value, setter, id]) => (
                <div key={id}>
                  <label htmlFor={id} className="text-sm font-medium text-zinc-300">
                    {label}
                  </label>
                  <PasswordInput
                    id={id}
                    value={value}
                    onChange={(e) => setter(e.target.value)}
                    required
                    minLength={id === "pw-current" ? 1 : 8}
                    maxLength={100}
                    autoComplete={
                      id === "pw-current" ? "current-password" : "new-password"
                    }
                    wrapperClassName="mt-1.5"
                    className="w-full rounded-lg border border-fg/10 bg-base-950 px-3 py-2.5 text-sm text-zinc-200 outline-none transition-colors focus:border-accent"
                  />
                </div>
              ))}
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={pwSaving}
                  className="rounded-lg border border-fg/15 px-5 py-2.5 text-sm font-semibold text-fg transition-colors hover:border-accent disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {pwSaving ? "Смена…" : "Сменить пароль"}
                </button>
                {pwMessage && (
                  <span
                    className={`text-sm ${
                      pwMessage.type === "ok"
                        ? "text-emerald-400"
                        : "text-red-400"
                    }`}
                  >
                    {pwMessage.text}
                  </span>
                )}
              </div>
            </form>

            <div className="mt-5 flex items-center justify-between gap-3 border-t border-fg/5 pt-5">
              <div>
                <p className="text-sm font-semibold text-fg">Выйти с сайта</p>
                <p className="mt-0.5 text-xs text-zinc-500">
                  Завершить сеанс на этом устройстве
                </p>
              </div>
              <button
                type="button"
                onClick={logout}
                disabled={loggingOut}
                className="shrink-0 rounded-lg border border-fg/15 px-4 py-2 text-sm font-semibold text-zinc-300 transition-colors hover:border-accent hover:text-fg disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loggingOut ? "Выход…" : "Выйти"}
              </button>
            </div>
          </SectionCard>

          <SectionCard
            title="Опасная зона"
            icon={TrashIcon}
            className="border-red-500/20"
          >
            <form onSubmit={deleteAccount} className="space-y-4">
              <p className="text-sm leading-relaxed text-zinc-400">
                Удаление аккаунта необратимо: исчезнут профиль, комментарии и
                статистика просмотра.
              </p>
              <div>
                <label
                  htmlFor="delete-confirm"
                  className="text-sm font-medium text-zinc-300"
                >
                  Введите пароль для подтверждения
                </label>
                <PasswordInput
                  id="delete-confirm"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  wrapperClassName="mt-1.5"
                  className="w-full rounded-lg border border-fg/10 bg-base-950 px-3 py-2.5 text-sm text-zinc-200 outline-none transition-colors focus:border-red-500"
                />
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={deleting || !deletePassword}
                  className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {deleting ? "Удаление…" : "Удалить аккаунт"}
                </button>
                {deleteError && (
                  <span className="text-sm text-red-400">{deleteError}</span>
                )}
              </div>
            </form>
          </SectionCard>
        </div>
      )}
    </div>
  );
}
