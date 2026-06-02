import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AnalyticsTracker } from "@/components/analytics-tracker";
import { AppFooter } from "@/components/app-footer";
import { AppHeader } from "@/components/app-header";
import { PwaRegister } from "@/components/pwa-register";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

export const metadata: Metadata = {
  ...(siteUrl ? { metadataBase: new URL(siteUrl) } : {}),
  title: "ユニバフード制覇",
  description: "USJで今日食べるものを探せる非公式フード制覇アプリ",
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "ユニバフード制覇",
    description: "USJで今日食べるものを探せる非公式フード制覇アプリ",
    type: "website",
    ...(siteUrl ? { images: [{ url: "/icons/app-icon-1024.png", width: 1024, height: 1024, alt: "ユニバフード制覇" }] } : {})
  },
  twitter: {
    card: "summary",
    title: "ユニバフード制覇",
    description: "USJで今日食べるものを探せる非公式フード制覇アプリ",
    ...(siteUrl ? { images: ["/icons/app-icon-1024.png"] } : {})
  },
  icons: {
    icon: [
      { url: "/icons/app-icon.svg", type: "image/svg+xml" },
      { url: "/icons/app-icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/app-icon-512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: "/icons/apple-touch-icon.png"
  },
  appleWebApp: {
    capable: true,
    title: "ユニバフード",
    statusBarStyle: "default"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#18212f"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="flex min-h-dvh flex-col">
        <AppHeader />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-44 pt-6 sm:px-6 md:pb-8 md:pt-8 lg:px-8">{children}</main>
        <AppFooter />
        <AnalyticsTracker />
        <PwaRegister />
      </body>
    </html>
  );
}
