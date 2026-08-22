import type { Metadata } from "next";
import { getSessionUser } from "@/lib/auth";
import AuthRequired from "@/components/AuthRequired";
import ListsView from "@/components/ListsView";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Мои списки",
  description:
    "Личные списки фильмов: смотрю, буду смотреть, просмотрено, а также резервное копирование данных.",
};

export default async function ListsPage() {
  const me = await getSessionUser();
  if (!me) return <AuthRequired />;
  return <ListsView />;
}
