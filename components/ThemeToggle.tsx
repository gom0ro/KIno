"use client";

import { useEffect, useState } from "react";
import { MoonIcon, SunIcon } from "@/components/icons";

export default function ThemeToggle() {
  const [light, setLight] = useState(false);

  useEffect(() => {
    setLight(document.documentElement.classList.contains("light"));
  }, []);

  const toggle = () => {
    const next = !light;
    document.documentElement.classList.toggle("light", next);
    try {
      localStorage.setItem("kino:theme", next ? "light" : "dark");
    } catch {}
    setLight(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={light ? "Тёмная тема" : "Светлая тема"}
      title={light ? "Тёмная тема" : "Светлая тема"}
      className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-fg/10 hover:text-fg"
    >
      {light ? (
        <MoonIcon className="h-5 w-5" />
      ) : (
        <SunIcon className="h-5 w-5" />
      )}
    </button>
  );
}
