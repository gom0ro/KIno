import { NextResponse } from "next/server";
import { getSessionUserId, getUserById } from "@/lib/auth";

export async function GET() {
  const uid = getSessionUserId();
  const user = uid ? await getUserById(uid) : null;
  return NextResponse.json({ user });
}
