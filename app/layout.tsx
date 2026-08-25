import type { Metadata, Viewport } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import ProfileSync from "@/components/ProfileSync";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0b0f" },
    { media: "(prefers-color-scheme: light)", color: "#f6f7fa" },
  ],
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ),
  title: {
    default: "ФИЛЬМИК — смотреть фильмы онлайн",
    template: "%s — ФИЛЬМИК",
  },
  description:
    "Онлайн-кинотеатр: популярные фильмы, новинки и рекомендации. Смотрите в HD с адаптивным плеером.",
  keywords: ["кино", "фильмы", "онлайн", "смотреть", "cinema", "movies"],
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName: "ФИЛЬМИК",
    title: "ФИЛЬМИК — смотреть фильмы онлайн",
    description:
      "Онлайн-кинотеатр: популярные фильмы, новинки и рекомендации.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              'try{if(localStorage.getItem("kino:theme")==="light")document.documentElement.classList.add("light")}catch(e){}',
          }}
        />
      </head>
      <body className="flex min-h-screen flex-col">
        <Header />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-32 pt-8 sm:px-6 sm:pb-36 md:pb-8">
          {children}
        </main>
        <Footer />
        <BottomNav />
        <ServiceWorkerRegister />
        <ProfileSync />
      </body>
    </html>
  );
}
