"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { TrashIcon } from "@/components/icons";

interface Movie {
  id: string;
  title: string;
  year: number;
  rating: number;
  duration: number;
  videoUrl: string;
}

const EMPTY = {
  title: "",
  originalTitle: "",
  year: String(new Date().getFullYear()),
  duration: "",
  ageRating: "16",
  country: "",
  director: "",
  genres: "",
  cast: "",
  description: "",
  videoUrl: "",
};

function splitList(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function AdminPage() {
  const [role, setRole] = useState<"loading" | "admin" | "user" | "guest">(
    "loading"
  );
  const [movies, setMovies] = useState<Movie[] | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(
    null
  );

  const loadMovies = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/movies", { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as { movies: Movie[] };
        setMovies(data.movies);
      }
    } catch {
      setMovies(null);
    }
  }, []);

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { user: { role: string } | null }) => {
        if (!d.user) setRole("guest");
        else setRole(d.user.role === "admin" ? "admin" : "user");
      })
      .catch(() => setRole("guest"));
  }, []);

  useEffect(() => {
    if (role === "admin") void loadMovies();
  }, [role, loadMovies]);

  function set<K extends keyof typeof EMPTY>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function upload(file: File) {
    setUploading(true);
    setMessage(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setMessage({ ok: false, text: data.error ?? "Ошибка загрузки" });
        return;
      }
      set("videoUrl", data.url);
      setMessage({ ok: true, text: `Видео загружено: ${data.url}` });
    } catch {
      setMessage({ ok: false, text: "Ошибка сети при загрузке" });
    } finally {
      setUploading(false);
    }
  }

  async function submit() {
    if (saving) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/movies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          year: Number(form.year),
          duration: Number(form.duration),
          ageRating: Number(form.ageRating),
          genres: splitList(form.genres),
          cast: splitList(form.cast),
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setMessage({ ok: false, text: data.error ?? "Ошибка сохранения" });
        return;
      }
      setForm(EMPTY);
      setMessage({ ok: true, text: "Фильм добавлен в каталог" });
      await loadMovies();
    } catch {
      setMessage({ ok: false, text: "Ошибка сети" });
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string, title: string) {
    if (!window.confirm(`Удалить фильм «${title}» из каталога?`)) return;
    const res = await fetch(`/api/admin/movies/${id}`, { method: "DELETE" });
    if (res.status === 204) {
      setMovies((prev) => prev?.filter((m) => m.id !== id) ?? prev);
      setMessage({ ok: true, text: `«${title}» удалён` });
    } else {
      setMessage({ ok: false, text: "Не удалось удалить фильм" });
    }
  }

  if (role === "loading") {
    return <div className="h-40 animate-pulse rounded-xl bg-base-800" aria-hidden />;
  }
  if (role === "guest" || role === "user") {
    return (
      <div className="animate-fade-in">
        <p className="rounded-lg border border-dashed border-fg/10 px-4 py-3 text-sm text-zinc-500">
          {role === "guest" ? (
            <>
              <Link href="/login" className="font-medium text-accent hover:underline">
                Войдите
              </Link>{" "}
              под учётной записью администратора.
            </>
          ) : (
            <>Доступ только для администратора.</>
          )}
        </p>
      </div>
    );
  }

  const inputCls =
    "mt-1.5 w-full rounded-lg border border-fg/10 bg-base-950 px-3 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 outline-none transition-colors focus:border-accent";
  const labelCls = "block text-sm font-medium text-zinc-400";

  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <h1 className="text-3xl font-black text-fg">Админка</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Добавление и удаление фильмов каталога
        </p>
      </div>

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-xl font-bold text-fg">
          <span className="h-6 w-1.5 rounded-full bg-accent" />
          Новый фильм
        </h2>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
          className="grid gap-4 rounded-xl border border-fg/5 bg-base-800/60 p-5 sm:grid-cols-2"
        >
          <label className={labelCls}>
            Название *
            <input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              required
              className={inputCls}
            />
          </label>
          <label className={labelCls}>
            Оригинальное название
            <input
              value={form.originalTitle}
              onChange={(e) => set("originalTitle", e.target.value)}
              className={inputCls}
            />
          </label>
          <label className={labelCls}>
            Год *
            <input
              type="number"
              min={1900}
              max={2100}
              value={form.year}
              onChange={(e) => set("year", e.target.value)}
              required
              className={inputCls}
            />
          </label>
          <label className={labelCls}>
            Длительность, мин *
            <input
              type="number"
              min={1}
              max={600}
              value={form.duration}
              onChange={(e) => set("duration", e.target.value)}
              required
              className={inputCls}
            />
          </label>
          <label className={labelCls}>
            Возрастной рейтинг *
            <select
              value={form.ageRating}
              onChange={(e) => set("ageRating", e.target.value)}
              className={inputCls}
            >
              {[0, 6, 12, 16, 18].map((a) => (
                <option key={a} value={a}>
                  {a}+
                </option>
              ))}
            </select>
          </label>
          <label className={labelCls}>
            Страна *
            <input
              value={form.country}
              onChange={(e) => set("country", e.target.value)}
              placeholder="США"
              required
              className={inputCls}
            />
          </label>
          <label className={labelCls}>
            Режиссёр *
            <input
              value={form.director}
              onChange={(e) => set("director", e.target.value)}
              required
              className={inputCls}
            />
          </label>
          <label className={labelCls}>
            Жанры (через запятую) *
            <input
              value={form.genres}
              onChange={(e) => set("genres", e.target.value)}
              placeholder="Драма, Триллер"
              required
              className={inputCls}
            />
          </label>
          <label className={`${labelCls} sm:col-span-2`}>
            Актёры (через запятую) *
            <input
              value={form.cast}
              onChange={(e) => set("cast", e.target.value)}
              placeholder="Актёр один, Актриса два"
              required
              className={inputCls}
            />
          </label>
          <label className={`${labelCls} sm:col-span-2`}>
            Описание *
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={4}
              minLength={10}
              maxLength={2000}
              required
              className={`${inputCls} resize-y`}
            />
          </label>

          <div className="sm:col-span-2">
            <span className={labelCls}>Видео *</span>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <input
                value={form.videoUrl}
                onChange={(e) => set("videoUrl", e.target.value)}
                placeholder="/uploads/videos/…mp4 или https://…m3u8"
                required
                className={`${inputCls} mt-0 flex-1 min-w-[240px]`}
              />
              <label
                className={`cursor-pointer rounded-lg border border-fg/10 px-4 py-2.5 text-sm font-medium transition-colors hover:border-accent ${
                  uploading ? "pointer-events-none opacity-50" : ""
                }`}
              >
                {uploading ? "Загрузка…" : "Загрузить MP4"}
                <input
                  type="file"
                  accept="video/mp4"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void upload(f);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
          </div>

          {message && (
            <p
              className={`text-sm sm:col-span-2 ${
                message.ok ? "text-green-400" : "text-red-400"
              }`}
            >
              {message.text}
            </p>
          )}

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={saving || uploading}
              className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Сохранение…" : "Добавить фильм"}
            </button>
          </div>
        </form>
      </section>

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-xl font-bold text-fg">
          <span className="h-6 w-1.5 rounded-full bg-accent" />
          Каталог{" "}
          {movies !== null && (
            <span className="text-sm font-normal text-zinc-500">
              ({movies.length})
            </span>
          )}
        </h2>

        {movies === null ? (
          <div className="space-y-2" aria-hidden>
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-base-800" />
            ))}
          </div>
        ) : (
          <ul className="divide-y divide-fg/5 overflow-hidden rounded-xl border border-fg/5 bg-base-800/40">
            {movies.map((m) => (
              <li
                key={m.id}
                className="flex items-center gap-3 px-4 py-3 text-sm"
              >
                <span className="min-w-0 flex-1 truncate text-zinc-200">
                  {m.title}{" "}
                  <span className="text-zinc-600">· {m.year}</span>
                </span>
                <span className="hidden shrink-0 text-zinc-600 sm:block">
                  {m.videoUrl.startsWith("/") ? "локальное видео" : "внешний источник"}
                </span>
                <Link
                  href={`/film/${m.id}`}
                  className="shrink-0 rounded-lg px-2 py-1 text-xs text-accent hover:bg-fg/5"
                >
                  Открыть
                </Link>
                <button
                  type="button"
                  onClick={() => remove(m.id, m.title)}
                  aria-label={`Удалить «${m.title}»`}
                  title="Удалить"
                  className="shrink-0 rounded-lg p-1.5 text-zinc-600 transition-colors hover:bg-fg/5 hover:text-red-400"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
