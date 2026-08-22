import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";

const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

export interface StoredFile {
  url: string;
}

async function diskSave(
  dir: string,
  name: string,
  data: Buffer
): Promise<StoredFile> {
  const target = path.join(process.cwd(), "public", "uploads", dir);
  await mkdir(target, { recursive: true });
  await writeFile(path.join(target, name), data);
  return { url: `/uploads/${dir}/${name}` };
}

function safeDiskPath(url: string): string | null {
  const prefix = "/uploads/";
  if (!url.startsWith(prefix)) return null;
  const rest = url.slice(prefix.length);
  if (rest.includes("..") || rest.includes("\\")) return null;
  return path.join(process.cwd(), "public", "uploads", rest);
}

/** Сохраняет файл в Vercel Blob (если задан токен) или на диск в dev-режиме. */
export async function saveUpload(
  dir: "avatars" | "videos",
  name: string,
  data: Buffer,
  contentType: string
): Promise<StoredFile> {
  if (BLOB_TOKEN) {
    const { put } = await import("@vercel/blob");
    const { url } = await put(`uploads/${dir}/${name}`, data, {
      access: "public",
      contentType,
      token: BLOB_TOKEN,
    });
    return { url };
  }
  return diskSave(dir, name, data);
}

/** Удаляет ранее сохранённый файл (игнорирует внешние/чужие URL). */
export async function deleteStored(url: string): Promise<void> {
  try {
    if (/^https?:\/\//i.test(url)) {
      if (!BLOB_TOKEN) return;
      const { del } = await import("@vercel/blob");
      await del(url, { token: BLOB_TOKEN });
      return;
    }
    const file = safeDiskPath(url);
    if (file) await unlink(file);
  } catch {
    /* файла могло не быть */
  }
}
