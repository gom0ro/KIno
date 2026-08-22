import type { Metadata } from "next";
import { getSessionUser } from "@/lib/auth";
import AuthRequired from "@/components/AuthRequired";
import ProfileView from "@/components/ProfileView";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Профиль",
};

export default async function ProfilePage() {
  const me = await getSessionUser();
  if (!me) return <AuthRequired />;
  return <ProfileView />;
}
