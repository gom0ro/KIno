"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AUTH_CHANGED_EVENT } from "@/lib/events";
import PasswordInput from "@/components/PasswordInput";

export { AUTH_CHANGED_EVENT };

interface Props {
  mode: "login" | "register";
}

const inputClass =
  "w-full rounded-lg border border-fg/10 bg-base-800 px-4 py-3 text-sm text-zinc-200 outline-none transition-colors placeholder:text-zinc-500 focus:border-accent";

export default function AuthForm({ mode }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isRegister = mode === "register";

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isRegister ? { name, email, password } : { email, password }
        ),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Что-то пошло не так");
        return;
      }
      window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
      router.push("/");
      router.refresh();
    } catch {
      setError("Ошибка сети. Попробуйте ещё раз");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md animate-fade-in">
      <div className="rounded-2xl border border-fg/5 bg-base-900/70 p-8 shadow-xl">
        <h1 className="text-center text-2xl font-black text-fg">
          {isRegister ? "Создать аккаунт" : "Вход"}
        </h1>
        <p className="mt-2 text-center text-sm text-zinc-500">
          {isRegister
            ? "Зарегистрируйтесь, чтобы сохранять любимые фильмы"
            : "С возвращением! Войдите в свой аккаунт"}
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          {isRegister && (
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Имя"
              autoComplete="name"
              required
              minLength={2}
              className={inputClass}
            />
          )}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            autoComplete="email"
            required
            className={inputClass}
          />
          <PasswordInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Пароль"
            autoComplete={isRegister ? "new-password" : "current-password"}
            required
            minLength={6}
            className={inputClass}
          />

          {error && (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-accent py-3 font-semibold text-white transition-all hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? "Подождите…"
              : isRegister
                ? "Зарегистрироваться"
                : "Войти"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-400">
          {isRegister ? (
            <>
              Уже есть аккаунт?{" "}
              <Link href="/login" className="font-medium text-accent hover:underline">
                Войти
              </Link>
            </>
          ) : (
            <>
              Нет аккаунта?{" "}
              <Link
                href="/register"
                className="font-medium text-accent hover:underline"
              >
                Регистрация
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
