import type { NextConfig } from "next";

// Note: local dev does not proxy live Cloudflare bindings (D1/R2). getDb()
// falls back to a local SQLite file when the D1 binding isn't present, and
// R2 uploads go through R2's S3-compatible API with explicit credentials
// (see src/app/api/upload/route.ts) — neither depends on a dev-platform
// binding proxy, so none is set up here.

const isDev = process.env.NODE_ENV === "development";

// Sent as Report-Only for now: the policy below is tight enough that a
// mistake would break rendering, so collect violations against real traffic
// first, then switch the header key to Content-Security-Policy.
//
// 'unsafe-inline' in script-src is required because pages are rendered
// without a nonce; moving to nonces means making every route dynamic (see
// the Next.js CSP guide) and is tracked separately.
// 'unsafe-inline' in style-src is required because the UI styles elements
// with inline `style` attributes throughout.
const csp = `
  default-src 'self';
  script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""};
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' data: https://fonts.gstatic.com;
  img-src 'self' blob: data: https:;
  media-src 'self' https:;
  frame-src https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com;
  connect-src 'self' https://*.r2.cloudflarestorage.com;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'self';
  upgrade-insecure-requests;
`
  .replace(/\s{2,}/g, " ")
  .trim();

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
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains",
          },
          { key: "Content-Security-Policy-Report-Only", value: csp },
        ],
      },
    ];
  },
};

export default nextConfig;
