"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { BellIcon, MessageIcon } from "@/components/icons";
import { NOTIF_CHANGED_EVENT } from "@/lib/events";

interface NotificationItem {
  id: string;
  type: string;
  message: string;
  movieId: string | null;
  read: boolean;
  createdAt: string;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("ru-RU", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[] | null>(null);
  const [denied, setDenied] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (res.status === 401) {
        setDenied(true);
        setItems([]);
        return;
      }
      const data = (await res.json()) as {
        notifications: NotificationItem[];
      };
      setItems(data.notifications);
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function markAll() {
    await fetch("/api/notifications/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    setItems((prev) => prev?.map((n) => ({ ...n, read: true })) ?? prev);
    window.dispatchEvent(new Event(NOTIF_CHANGED_EVENT));
  }

  async function open(n: NotificationItem) {
    if (!n.read) {
      setItems((prev) =>
        prev?.map((x) => (x.id === n.id ? { ...x, read: true } : x)) ?? prev
      );
      fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [n.id] }),
      }).then(() => window.dispatchEvent(new Event(NOTIF_CHANGED_EVENT)));
    }
  }

  if (denied) {
    return (
      <div className="animate-fade-in">
        <p className="rounded-lg border border-dashed border-fg/10 px-4 py-3 text-sm text-zinc-500">
          <Link href="/login" className="font-medium text-accent hover:underline">
            Войдите
          </Link>
          , чтобы видеть уведомления.
        </p>
      </div>
    );
  }

  const unreadCount = items?.filter((n) => !n.read).length ?? 0;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black text-fg">Уведомления</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {unreadCount > 0
              ? `Новых: ${unreadCount}`
              : "Всё прочитано"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAll}
            className="rounded-lg border border-fg/10 px-4 py-2 text-sm text-zinc-300 transition-colors hover:border-accent hover:text-fg"
          >
            Отметить все прочитанными
          </button>
        )}
      </div>

      {items === null ? (
        <div className="space-y-3" aria-hidden>
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-base-800" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-zinc-500">Уведомлений пока нет.</p>
      ) : (
        <ul className="divide-y divide-fg/5 overflow-hidden rounded-xl border border-fg/5 bg-base-800/40">
          {items.map((n) => {
            const Icon = n.type === "comment" ? MessageIcon : BellIcon;
            const inner = (
              <>
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                    n.type === "comment"
                      ? "bg-accent/15 text-accent"
                      : "bg-cyan-400/10 text-cyan-300"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={`block truncate text-sm ${
                      n.read ? "text-zinc-400" : "font-semibold text-fg"
                    }`}
                  >
                    {n.message}
                  </span>
                  <span className="mt-0.5 block text-xs text-zinc-600">
                    {formatDate(n.createdAt)}
                  </span>
                </span>
                {!n.read && (
                  <span
                    className="h-2 w-2 shrink-0 rounded-full bg-accent"
                    aria-label="Непрочитано"
                  />
                )}
              </>
            );
            return (
              <li key={n.id} className={n.read ? "" : "bg-accent/5"}>
                {n.movieId ? (
                  <Link
                    href={`/film/${n.movieId}`}
                    onClick={() => open(n)}
                    className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-fg/5"
                  >
                    {inner}
                  </Link>
                ) : (
                  <div className="flex items-center gap-3 px-4 py-3.5">
                    {inner}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
