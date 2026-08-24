import Link from "next/link";
import { UserIcon } from "@/components/icons";

export default function AuthRequired() {
  return (
    <div className="flex min-h-[50vh] animate-fade-in flex-col items-center justify-center rounded-2xl border border-dashed border-fg/10 px-6 py-16 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
        <UserIcon className="h-8 w-8 text-accent" />
      </span>
      <h1 className="mt-5 text-2xl font-black text-fg sm:text-3xl">
        У вас ещё нет аккаунта
      </h1>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-zinc-500">
        Создайте бесплатный аккаунт, чтобы вести списки,
        комментировать и попадать в топ зрителей
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link
          href="/register"
          className="rounded-lg bg-accent px-6 py-3 font-semibold text-white transition-all hover:bg-accent-hover hover:shadow-[0_0_30px_rgba(229,9,20,0.4)]"
        >
          Создать аккаунт
        </Link>
        <Link
          href="/login"
          className="rounded-lg border border-fg/15 bg-fg/5 px-6 py-3 font-semibold text-fg transition-colors hover:bg-fg/10"
        >
          Войти
        </Link>
      </div>
    </div>
  );
}
