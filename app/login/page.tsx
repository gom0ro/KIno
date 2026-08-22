import type { Metadata } from "next";
import AuthForm from "@/components/AuthForm";

export const metadata: Metadata = {
  title: "Вход",
  description: "Войдите в аккаунт онлайн-кинотеатра КИНО.",
};

export default function LoginPage() {
  return <AuthForm mode="login" />;
}
