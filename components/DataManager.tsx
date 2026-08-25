"use client";

import { useRef, useState, type ChangeEvent } from "react";
import {
  applyBackup,
  downloadBackup,
} from "@/lib/user-data";

interface Message {
  ok: boolean;
  text: string;
}

export default function DataManager() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMessage] = useState<Message | null>(null);

  function onExport() {
    try {
      downloadBackup();
      setMessage({ ok: true, text: "Резервная копия скачана" });
    } catch {
      setMessage({ ok: false, text: "Не удалось сформировать файл" });
    }
  }

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data: unknown = JSON.parse(await file.text());
      const res = applyBackup(data);
      const parts = [`${res.history} в истории`];
      if (res.favorites > 0) parts.unshift(`+${res.favorites} в избранное`);
      if (res.ratings > 0) parts.push(`+${res.ratings} оценок`);
      if (res.lists > 0) parts.push(`+${res.lists} в списки`);
      setMessage({ ok: true, text: `Импортировано: ${parts.join(", ")}` });
    } catch (err) {
      setMessage({
        ok: false,
        text:
          err instanceof SyntaxError
            ? "Файл повреждён или не является JSON"
            : err instanceof Error
              ? err.message
              : "Не удалось импортировать данные",
      });
    } finally {
      e.target.value = "";
    }
  }

  return (
    <section className="rounded-2xl border border-fg/5 bg-base-900/70 p-6">
      <h2 className="text-lg font-bold text-fg">Данные</h2>
      <p className="mt-1 max-w-xl text-sm text-zinc-500">
        Избранное, история просмотров, оценки и списки хранятся только в вашем
        браузере. Сохраните резервную копию, чтобы перенести их на другое
        устройство.
      </p>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onExport}
          className="flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
            <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
          </svg>
          Экспорт
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-2 rounded-lg border border-fg/10 px-5 py-2.5 text-sm font-semibold text-zinc-600 dark:text-zinc-300 transition-colors hover:border-accent hover:text-fg"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
            <path d="M19 15h-4v6H9v-6H5l7-7 7 7zM5 4v2h14V4H5z" />
          </svg>
          Импорт
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          onChange={onFile}
          className="hidden"
        />
      </div>

      {msg && (
        <p
          className={`mt-4 rounded-lg border px-4 py-2.5 text-sm ${
            msg.ok
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
              : "border-red-500/30 bg-red-500/10 text-red-400"
          }`}
        >
          {msg.text}
        </p>
      )}
    </section>
  );
}
