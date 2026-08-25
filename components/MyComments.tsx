"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { MOVIES } from "@/lib/movies";
import { TrashIcon } from "@/components/icons";

interface MyComment {
  id: string;
  movieId: string;
  text: string;
  createdAt: string;
  updatedAt: string;
}

const MAX_TEXT = 1000;

function fmt(iso: string) {
  return new Date(iso).toLocaleString("ru-RU", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MyComments() {
  const [comments, setComments] = useState<MyComment[] | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/profile/comments", { cache: "no-store" });
      const data = (await res.json()) as { comments?: MyComment[] };
      setComments(data.comments ?? []);
    } catch {
      setComments([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveEdit(id: string) {
    if (!editText.trim() || savingEdit) return;
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/comments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: editText.trim() }),
      });
      const data = (await res.json()) as {
        comment?: { id: string; text: string; updatedAt: string };
        error?: string;
      };
      if (res.ok && data.comment) {
        setComments((prev) =>
          (prev ?? []).map((c) =>
            c.id === id
              ? {
                  ...c,
                  text: data.comment!.text,
                  updatedAt: data.comment!.updatedAt,
                }
              : c
          )
        );
        setEditingId(null);
        setEditText("");
      }
    } catch {
    } finally {
      setSavingEdit(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Удалить комментарий?")) return;
    const res = await fetch(`/api/comments/${id}`, { method: "DELETE" });
    if (res.ok) {
      setComments((prev) => (prev ?? []).filter((c) => c.id !== id));
    }
  }

  if (!comments) {
    return (
      <div className="space-y-4 py-2" aria-hidden>
        <div className="h-3 w-3/4 rounded bg-base-800" />
        <div className="h-3 w-1/2 rounded bg-base-800" />
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-fg/10 px-4 py-6 text-sm text-zinc-500">
        Вы пока ничего не комментировали.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-fg/5 overflow-hidden rounded-xl border border-fg/5 bg-base-800/60">
      {comments.map((c) => {
        const movie = MOVIES.find((m) => m.id === c.movieId);
        const edited =
          new Date(c.updatedAt).getTime() >
          new Date(c.createdAt).getTime() + 1000;
        return (
          <li key={c.id} className="group px-4 py-3.5 sm:px-5">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <Link
                href={`/film/${c.movieId}`}
                className="text-sm font-semibold text-fg transition-colors hover:text-accent"
              >
                {movie?.title ?? "Фильм"}
              </Link>
              <time className="shrink-0 text-xs text-zinc-600">
                {fmt(c.createdAt)}
              </time>
              {edited && (
                <span
                  className="shrink-0 text-xs italic text-zinc-600"
                  title={`Изменён: ${fmt(c.updatedAt)}`}
                >
                  изменено
                </span>
              )}
              <span className="ml-auto flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100 sm:opacity-0">
                {editingId !== c.id && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(c.id);
                        setEditText(c.text);
                      }}
                      aria-label="Изменить комментарий"
                      title="Изменить"
                      className="rounded-lg p-1.5 text-zinc-600 transition-all hover:bg-fg/5 hover:text-fg"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        aria-hidden
                        className="h-4 w-4"
                      >
                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(c.id)}
                      aria-label="Удалить комментарий"
                      title="Удалить"
                      className="rounded-lg p-1.5 text-zinc-600 transition-all hover:bg-fg/5 hover:text-red-400"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </>
                )}
              </span>
            </div>

            {editingId === c.id ? (
              <div className="mt-2 space-y-2">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  rows={3}
                  maxLength={MAX_TEXT}
                  autoFocus
                  className="w-full resize-y rounded-lg border border-fg/10 bg-base-950 px-3 py-2.5 text-sm text-zinc-200 outline-none transition-colors focus:border-accent"
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-600">
                    {editText.length}/{MAX_TEXT}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(null);
                        setEditText("");
                      }}
                      className="rounded-lg border border-fg/10 px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:text-fg"
                    >
                      Отмена
                    </button>
                    <button
                      type="button"
                      onClick={() => saveEdit(c.id)}
                      disabled={savingEdit || !editText.trim()}
                      className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {savingEdit ? "Сохранение…" : "Сохранить"}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                {c.text}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
