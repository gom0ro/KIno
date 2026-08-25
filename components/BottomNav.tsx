"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  GridIcon,
  HomeIcon,
  ListIcon,
  TrophyIcon,
  UserIcon,
} from "@/components/icons";

const ITEMS = [
  { href: "/", label: "Главная", Icon: HomeIcon },
  { href: "/catalog", label: "Каталог", Icon: GridIcon },
  { href: "/top", label: "Топ", Icon: TrophyIcon },
  { href: "/lists", label: "Списки", Icon: ListIcon },
  { href: "/profile", label: "Профиль", Icon: UserIcon },
];

export default function BottomNav() {
  const pathname = usePathname();
  const navRef = useRef<HTMLUListElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!navRef.current || !indicatorRef.current || !mounted) return;
    const activeIndex = ITEMS.findIndex(({ href }) =>
      href === "/" ? pathname === "/" : pathname.startsWith(href)
    );
    if (activeIndex === -1) return;
    const buttons = navRef.current.querySelectorAll<HTMLAnchorElement>("a");
    const btn = buttons[activeIndex];
    if (!btn) return;
    const navRect = navRef.current.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    indicatorRef.current.style.width = `${btnRect.width}px`;
    indicatorRef.current.style.left = `${btnRect.left - navRect.left}px`;
  }, [pathname, mounted]);

  return (
    <nav
      aria-label="Мобильная навигация"
      className="fixed inset-x-0 bottom-0 z-50 flex justify-center pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <div className="pointer-events-none fixed inset-x-0 bottom-0 h-24 bg-gradient-to-t from-base-950 via-base-950/80 to-transparent sm:h-28" />
      <ul
        ref={navRef}
        className="relative mb-3 flex items-center gap-1 rounded-2xl border border-fg/[0.06] bg-base-900/80 px-2 py-1.5 shadow-[0_8px_32px_-4px_rgba(0,0,0,0.6)] backdrop-blur-xl supports-[backdrop-filter]:bg-base-900/60 sm:mb-4 sm:gap-2 sm:rounded-3xl sm:px-3 sm:py-2"
      >
        <span
          ref={indicatorRef}
          aria-hidden
          className="absolute top-1 bottom-1 rounded-xl bg-accent/15 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] sm:top-1.5 sm:bottom-1.5 sm:rounded-2xl"
        />
        {ITEMS.map(({ href, label, Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href} className="relative z-10">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`group relative flex w-12 flex-col items-center gap-0.5 rounded-xl py-1.5 transition-all duration-200 sm:w-14 sm:gap-1 sm:rounded-2xl sm:py-2 ${
                  active
                    ? "text-accent"
                    : "text-zinc-500 hover:text-zinc-300 active:scale-95"
                }`}
              >
                <span
                  className={`relative flex items-center justify-center transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    active
                      ? "scale-110"
                      : "group-hover:scale-105 group-active:scale-95"
                  }`}
                >
                  <Icon className="h-[22px] w-[22px] sm:h-6 sm:w-6" />
                  {active && (
                    <span
                      aria-hidden
                      className="absolute -bottom-1 h-1 w-1 rounded-full bg-accent shadow-[0_0_6px_1px_rgba(196,18,48,0.5)] sm:-bottom-1.5 sm:h-1 sm:w-1"
                    />
                  )}
                </span>
                <span
                  className={`text-[10px] leading-none font-medium transition-all duration-200 sm:text-xs ${
                    active ? "opacity-100" : "opacity-60 group-hover:opacity-100"
                  }`}
                >
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
