"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AUTH_CHANGED_EVENT } from "@/lib/events";
import { NOTIF_CHANGED_EVENT } from "@/lib/events";
import { maskEmail } from "@/lib/mask";
import { BellIcon, DiceIcon, PlayIcon, SearchIcon } from "@/components/icons";
import ThemeToggle from "@/components/ThemeToggle";
import HeaderSearch from "@/components/HeaderSearch";
import type { PublicUser } from "@/lib/auth";

const LINKS = [
  { href: "/", label: "Главная" },
  { href: "/catalog", label: "Каталог" },
  { href: "/collections", label: "Подборки" },
  { href: "/top", label: "Топ-50" },
  { href: "/lists", label: "Списки" },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [unread, setUnread] = useState(0);

  const loadUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const data = (await res.json()) as { user: PublicUser | null };
      setUser(data.user);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    void loadUser();
    window.addEventListener(AUTH_CHANGED_EVENT, loadUser);
    return () => window.removeEventListener(AUTH_CHANGED_EVENT, loadUser);
  }, [loadUser]);

  useEffect(() => {
    if (!user) {
      setUnread(0);
      return;
    }
    let alive = true;
    async function loadCount() {
      try {
        const res = await fetch("/api/notifications", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { unreadCount: number };
        if (alive) setUnread(data.unreadCount);
      } catch {
        /* сеть недоступна */
      }
    }
    void loadCount();
    const timer = setInterval(loadCount, 60000);
    window.addEventListener(NOTIF_CHANGED_EVENT, loadCount);
    return () => {
      alive = false;
      clearInterval(timer);
      window.removeEventListener(NOTIF_CHANGED_EVENT, loadCount);
    };
  }, [user]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-fg/5 bg-base-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="group flex items-center gap-2.5 text-xl font-extrabold tracking-tight text-fg"
        >
          <span className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-accent via-accent to-rose-700 shadow-lg shadow-accent/25 transition-shadow group-hover:shadow-accent/40">
            <PlayIcon className="h-4 w-4 text-white drop-shadow-sm" />
          </span>
          <span className="bg-gradient-to-r from-base-800 via-fg to-zinc-500 bg-clip-text text-transparent dark:from-white dark:via-fg dark:to-zinc-400">
            ФИЛЬМИК
          </span>
        </Link>

        <HeaderSearch />

        <nav className="flex shrink-0 items-center gap-1 sm:gap-2">
          <div className="hidden items-center gap-1 md:flex">
            {(user?.role === "admin"
              ? [...LINKS, { href: "/admin", label: "Админка" }]
              : LINKS
            ).map(({ href, label }) => {
              const active =
                href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "bg-fg/10 text-fg"
                      : "text-zinc-400 hover:text-fg"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
            <span className="mx-1 h-5 w-px bg-fg/10" />
          </div>

          <ThemeToggle />

          <Link
            href="/catalog?focus=1"
            aria-label="Поиск фильмов"
            title="Поиск фильмов"
            className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-fg/10 hover:text-fg md:hidden"
          >
            <SearchIcon className="h-5 w-5" />
          </Link>

          <Link
            href="/random"
            aria-label="Случайный фильм"
            title="Случайный фильм"
            className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-fg/10 hover:text-fg"
          >
            <DiceIcon className="h-5 w-5" />
          </Link>

          {user && (
            <Link
              href="/notifications"
              aria-label="Уведомления"
              title="Уведомления"
              className="relative rounded-lg p-2 text-zinc-400 transition-colors hover:bg-fg/10 hover:text-fg"
            >
              <BellIcon className="h-5 w-5" />
              {unread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </Link>
          )}

          <span className="mx-1 hidden h-5 w-px bg-fg/10 sm:block" />

          {user ? (
            <div className="flex items-center gap-2">
              <Link
                href="/profile"
                title={`${maskEmail(user.email)} — открыть профиль`}
                className="flex items-center gap-1.5 text-sm font-medium text-zinc-200 transition-colors hover:text-fg"
              >
                {user.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatarUrl}
                    alt=""
                    className="h-7 w-7 shrink-0 rounded-full object-cover ring-1 ring-fg/10"
                  />
                ) : (
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-fg"
                    style={{ backgroundColor: user.avatarColor }}
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="hidden max-w-[140px] truncate lg:inline">
                  {user.name}
                </span>
              </Link>
              <button
                type="button"
                onClick={logout}
                aria-label="Выйти из аккаунта"
                title="Выйти"
                className="hidden rounded-lg border border-fg/10 px-2.5 py-1.5 text-sm text-zinc-400 transition-colors hover:border-accent hover:text-fg sm:block"
              >
                Выйти
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="hidden rounded-lg px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:text-fg sm:block"
              >
                Войти
              </Link>
              <Link
                href="/register"
                className={`hidden rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors sm:block ${
                  pathname === "/register"
                    ? "bg-accent-hover text-white"
                    : "bg-accent text-white hover:bg-accent-hover"
                }`}
              >
                Регистрация
              </Link>
              <Link
                href="/login"
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors sm:hidden ${
                  pathname === "/login"
                    ? "bg-accent-hover text-white"
                    : "bg-accent text-white hover:bg-accent-hover"
                }`}
              >
                Войти
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
