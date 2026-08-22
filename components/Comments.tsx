"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AUTH_CHANGED_EVENT } from "@/lib/events";
import { MessageIcon, TrashIcon } from "@/components/icons";

interface CommentItem {
  id: string;
  text: string;
  createdAt: string;
  userId: string;
  userName: string;
  avatarColor: string;
}

interface Me {
  id: string;
  name: string;
}

const MAX_TEXT = 1000;

export default function Comments({ movieId }: { movieId: string }) {
  const [comments, setComments] = useState<CommentItem[] | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [cRes, meRes] = await Promise.all([
        fetch(`/api/films/${movieId}/comments`, { cache: "no-store" }),
        fetch("/api/auth/me", { cache: "no-store" }),
      ]);
      const cData = (await cRes.json()) as { comments: CommentItem[] };
      setComments(cData.comments);
      const meData = (await meRes.json()) as { user: Me | null };
      setMe(meData.user);
    } catch {
      setComments([]);
    }
  }, [movieId]);

  useEffect(() => {
    void load();
    const reload = () => void load();
    window.addEventListener(AUTH_CHANGED_EVENT, reload);
    return () => window.removeEventListener(AUTH_CHANGED_EVENT, reload);
  }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/films/${movieId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim() }),
      });
      const data = (await res.json()) as {
        comment?: CommentItem;
        error?: string;
      };
      if (!res.ok || !data.comment) {
        setError(data.error ?? "Не удалось отправить комментарий");
        return;
      }
      setComments((prev) => [data.comment!, ...(prev ?? [])]);
      setText("");
    } catch {
      setError("Ошибка сети");
    } finally {
      setSending(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Удалить комментарий?")) return;
    const res = await fetch(`/api/comments/${id}`, { method: "DELETE" });
    if (res.ok) {
      setComments((prev) => (prev ?? []).filter((c) => c.id !== id));
    }
  }

  return (
    <section className="mt-10">
      <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-fg sm:text-2xl">
        <span className="h-6 w-1.5 rounded-full bg-accent" />
        <MessageIcon className="h-5 w-5 text-zinc-400" />
        Комментарии
        {comments && (
          <span className="text-sm font-normal text-zinc-500">
            ({comments.length})
          </span>
        )}
      </h2>

      {me ? (
        <form onSubmit={submit} className="mb-6 space-y-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            maxLength={MAX_TEXT}
            placeholder="Поделитесь мнением о фильме…"
            className="w-full resize-y rounded-lg border border-fg/10 bg-base-800 px-3 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 outline-none transition-colors focus:border-accent"
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-600">
              {text.length}/{MAX_TEXT}
            </span>
            <button
              type="submit"
              disabled={sending || !text.trim()}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {sending ? "Отправка…" : "Отправить"}
            </button>
          </div>
        </form>
      ) : (
        <p className="mb-6 rounded-lg border border-dashed border-fg/10 px-4 py-3 text-sm text-zinc-500">
          Хотите оставить комментарий?{" "}
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
      )}

      {!comments ? (
        <div className="space-y-4 py-6" aria-hidden>
          <div className="h-9 w-9 rounded-full bg-base-800" />
          <div className="h-3 w-32 rounded bg-base-800" />
          <div className="h-3 w-3/4 rounded bg-base-800" />
        </div>
      ) : comments.length === 0 ? (
        <p className="py-4 text-sm text-zinc-500">
          Пока нет комментариев. Будьте первым!
        </p>
      ) : (
        <ul className="divide-y divide-fg/5">
          {comments.map((c) => (
            <li key={c.id} className="group flex gap-3 py-4">
              <Link href={`/users/${c.userId}`} aria-hidden tabIndex={-1}>
                <span
                  className="flex h-9 w-9 shrink-0 select-none items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ backgroundColor: c.avatarColor }}
                >
                  {c.userName.charAt(0).toUpperCase()}
                </span>
              </Link>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <Link
                    href={`/users/${c.userId}`}
                    className="truncate text-sm font-semibold text-fg hover:text-accent"
                  >
                    {c.userName}
                  </Link>
                  <time className="shrink-0 text-xs text-zinc-600">
                    {new Date(c.createdAt).toLocaleString("ru-RU", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                </div>
                <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-zinc-300">
                  {c.text}
                </p>
              </div>
              {me?.id === c.userId && (
                <button
                  type="button"
                  onClick={() => remove(c.id)}
                  aria-label="Удалить комментарий"
                  title="Удалить"
                  className="self-start rounded-lg p-1.5 text-zinc-600 opacity-0 transition-all hover:bg-fg/5 hover:text-red-400 focus-visible:opacity-100 group-hover:opacity-100"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
