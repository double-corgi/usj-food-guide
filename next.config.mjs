/** @type {import('next').NextConfig} */
const nextConfig = {
  typedRoutes: false,
  allowedDevOrigins: ["*.trycloudflare.com", "127.0.0.1"],
  async headers() {
    const contentSecurityPolicy = [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "img-src 'self' https: data: blob:",
      "font-src 'self' data:",
      "style-src 'self' 'unsafe-inline'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "connect-src 'self' https: wss:",
      "manifest-src 'self'",
      "worker-src 'self' blob:",
      "upgrade-insecure-requests"
    ].join("; ");

    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" }
        ]
      }
    ];
  },
  images: {
    qualities: [75, 78],
    remotePatterns: [
      { protocol: "https", hostname: "www.usj.co.jp" },
      { protocol: "https", hostname: "usj.co.jp" },
      { protocol: "https", hostname: "s.usj.co.jp" },
      { protocol: "https", hostname: "usjfoodallergy.usj.co.jp" },
      { protocol: "https", hostname: "c01.castel.jp" },
      { protocol: "https", hostname: "c02.castel.jp" },
      { protocol: "https", hostname: "c03.castel.jp" },
      { protocol: "https", hostname: "c04.castel.jp" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "placehold.co" }
    ]
  }
};

export default nextConfig;
