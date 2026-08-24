import {
  createHmac,
  randomBytes,
  scrypt as _scrypt,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const scrypt = promisify(_scrypt) as (
  password: string,
  salt: string,
  keylen: number
) => Promise<Buffer>;

export interface StoredUser {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: string;
  bio: string | null;
  avatarColor: string;
  avatarUrl: string | null;
}

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  role: string;
  bio: string | null;
  avatarColor: string;
  avatarUrl: string | null;
}

export const COOKIE_NAME = "kino_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function secret(): string {
  return process.env.AUTH_SECRET ?? "insecure-dev-secret-change-me";
}

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const key = await scrypt(password, salt, 64);
  return `${salt}:${key.toString("hex")}`;
}

async function verifyPassword(
  password: string,
  stored: string
): Promise<boolean> {
  const [salt, hex] = stored.split(":");
  if (!salt || !hex) return false;
  const key = await scrypt(password, salt, 64);
  const expected = Buffer.from(hex, "hex");
  return key.length === expected.length && timingSafeEqual(key, expected);
}

function sign(data: string): string {
  return createHmac("sha256", secret()).update(data).digest("base64url");
}

function createToken(userId: string): string {
  const payload = Buffer.from(
    JSON.stringify({ uid: userId, exp: Date.now() + SESSION_TTL_MS })
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function verifyToken(token: string | undefined): string | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const a = Buffer.from(sig);
  const b = Buffer.from(sign(payload));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as {
      uid?: string;
      exp?: number;
    };
    if (typeof data.uid !== "string" || typeof data.exp !== "number") return null;
    if (Date.now() > data.exp) return null;
    return data.uid;
  } catch {
    return null;
  }
}

type UserRecord = Awaited<ReturnType<typeof prisma.user.findFirst>>;

function publicView(u: NonNullable<UserRecord>): PublicUser {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    bio: u.bio,
    avatarColor: u.avatarColor,
    avatarUrl: u.avatarUrl,
  };
}

export async function findUserByEmail(email: string): Promise<StoredUser | null> {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });
  return user ?? null;
}

export async function getUserById(id: string): Promise<PublicUser | null> {
  const user = await prisma.user.findUnique({ where: { id } });
  return user ? publicView(user) : null;
}

export async function createUser(
  name: string,
  email: string,
  password: string
): Promise<PublicUser> {
  const exists = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true },
  });
  if (exists) {
    throw new Error("Пользователь с таким email уже существует");
  }
  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      name,
      passwordHash: await hashPassword(password),
      avatarColor: AVATAR_COLORS[
        Math.floor(Math.random() * AVATAR_COLORS.length)
      ],
    },
  });
  return publicView(user);
}

export async function updateUserProfile(
  id: string,
  data: { name?: string; bio?: string; avatarColor?: string }
): Promise<PublicUser> {
  const user = await prisma.user.update({ where: { id }, data });
  return publicView(user);
}

export async function changeUserEmail(
  id: string,
  newEmail: string
): Promise<PublicUser> {
  const user = await prisma.user.update({
    where: { id },
    data: { email: newEmail },
  });
  return publicView(user);
}

export async function changeUserPassword(
  id: string,
  newPassword: string
): Promise<void> {
  await prisma.user.update({
    where: { id },
    data: { passwordHash: await hashPassword(newPassword) },
  });
}

export async function checkCredentials(
  email: string,
  password: string
): Promise<StoredUser | null> {
  const user = await findUserByEmail(email);
  if (!user) return null;
  const ok = await verifyPassword(password, user.passwordHash);
  return ok ? user : null;
}

export function setSessionCookie(userId: string): void {
  cookies().set(COOKIE_NAME, createToken(userId), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export function clearSessionCookie(): void {
  cookies().set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export function getSessionUserId(): string | null {
  return verifyToken(cookies().get(COOKIE_NAME)?.value);
}

export async function getSessionUser(): Promise<PublicUser | null> {
  const uid = getSessionUserId();
  return uid ? getUserById(uid) : null;
}

export async function createNotification(data: {
  userId: string;
  type: string;
  message: string;
  movieId?: string | null;
}): Promise<void> {
  await prisma.notification.create({ data });
}

export const AVATAR_COLORS = [
  "#e50914",
  "#e11d48",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
];
