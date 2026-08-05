import type { MetadataRoute } from "next";

export const dynamic = "force-static";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://new-app-chi-rosy.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/staff", "/api"]
    },
    sitemap: `${siteUrl}/sitemap.xml`
  };
}
