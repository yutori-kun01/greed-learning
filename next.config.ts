import type { NextConfig } from "next";

// Note: local dev does not proxy live Cloudflare bindings (D1/R2). getDb()
// falls back to a local SQLite file when the D1 binding isn't present, and
// R2 uploads go through R2's S3-compatible API with explicit credentials
// (see src/app/api/upload/route.ts) — neither depends on a dev-platform
// binding proxy, so none is set up here.

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
