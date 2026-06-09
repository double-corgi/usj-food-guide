import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AnalyticsTracker } from "@/components/analytics-tracker";
import { AppFooter } from "@/components/app-footer";
import { AppHeader } from "@/components/app-header";
import { PwaRegister } from "@/components/pwa-register";
import { appBrand } from "@/lib/constants";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://new-app-chi-rosy.vercel.app";
const siteOrigin = siteUrl.replace(/\/$/, "");
const appTitle = appBrand.name;
const appDescription = appBrand.description;
const ogImageUrl = `${siteOrigin}/og-image.png`;

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin),
  title: appTitle,
  description: appDescription,
  applicationName: appTitle,
  keywords: ["USJ", "ユニバ", "フード", "グルメ", "食べた記録", "非公式ガイド"],
  alternates: {
    canonical: "/"
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: appTitle,
    description: appDescription,
    type: "website",
    url: siteOrigin,
    siteName: appTitle,
    locale: "ja_JP",
    images: [{ url: ogImageUrl, width: 1200, height: 630, alt: `${appTitle} - ${appDescription}` }]
  },
  twitter: {
    card: "summary_large_image",
    title: appTitle,
    description: appDescription,
    images: [ogImageUrl]
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
    title: appBrand.shortName,
    statusBarStyle: "default"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#071b3a"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="flex min-h-dvh flex-col">
        <AppHeader />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-28 pt-6 sm:px-6 md:pb-8 md:pt-8 lg:px-8">{children}</main>
        <AppFooter />
        <AnalyticsTracker />
        <PwaRegister />
      </body>
    </html>
  );
}
