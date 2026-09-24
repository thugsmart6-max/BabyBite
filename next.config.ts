import type { NextConfig } from "next";
import path from "path";

function vercelAuthUrl(): string | undefined {
  if (!process.env.VERCEL) return undefined;
  const fromEnv = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.AUTH_URL,
    process.env.NEXTAUTH_URL,
  ]
    .filter(Boolean)
    .map((v) => v!.replace(/\/$/, ""))
    .find((v) => !/localhost|127\.0\.0\.1/i.test(v));

  if (fromEnv) return fromEnv;
  if (process.env.VERCEL_ENV === "production") {
    const host = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? "baby-bite.vercel.app";
    return host.startsWith("http") ? host.replace(/\/$/, "") : `https://${host}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  }
  return undefined;
}

const onVercel = Boolean(process.env.VERCEL);
const authUrl = vercelAuthUrl();

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  // On Vercel, never bake localhost from dashboard mistakes into the client bundle.
  env:
    onVercel && authUrl
      ? {
          AUTH_URL: authUrl,
          NEXTAUTH_URL: authUrl,
          NEXT_PUBLIC_APP_URL: authUrl,
        }
      : {},
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
