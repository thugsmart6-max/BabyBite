import type { NextConfig } from "next";
import path from "path";
import { LIVE_SITE } from "./src/lib/auth-url";

const authUrl =
  process.env.VERCEL_ENV === "production"
    ? LIVE_SITE
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.AUTH_URL;

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  env: authUrl ? { AUTH_URL: authUrl } : {},
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
