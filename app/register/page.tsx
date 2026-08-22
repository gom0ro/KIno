import type { Metadata } from "next";
import AuthForm from "@/components/AuthForm";

export const metadata: Metadata = {
  title: "Регистрация",
  description:
    "Создайте аккаунт онлайн-кинотеатра КИНО и сохраняйте любимые фильмы.",
};

export default function RegisterPage() {
  return <AuthForm mode="register" />;
}
