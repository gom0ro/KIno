"use client";

import { useEffect, useState } from "react";
import { AUTH_CHANGED_EVENT } from "@/lib/events";
import type { PublicUser } from "@/lib/auth";

export function useMe() {
  const [me, setMe] = useState<PublicUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const data = (await res.json()) as { user: PublicUser | null };
        if (!alive) return;
        setMe(data.user);
      } catch {
        if (alive) setMe(null);
      } finally {
        if (alive) setReady(true);
      }
    }
    void load();
    window.addEventListener(AUTH_CHANGED_EVENT, load);
    return () => {
      alive = false;
      window.removeEventListener(AUTH_CHANGED_EVENT, load);
    };
  }, []);

  return { me, ready };
}
