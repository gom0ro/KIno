"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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

  return (
    <nav
      aria-label="Мобильная навигация"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-fg/5 bg-base-950/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
    >
      <ul className="flex h-16 items-stretch">
        {ITEMS.map(({ href, label, Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`relative flex h-full flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors ${
                  active ? "text-accent" : "text-zinc-500 active:text-zinc-300"
                }`}
              >
                <span className="relative">
                  <Icon className="h-5 w-5" />
                </span>
                {label}
                {active && (
                  <span
                    aria-hidden
                    className="absolute inset-x-6 top-0 h-0.5 rounded-full bg-accent"
                  />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
