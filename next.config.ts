import type { NextConfig } from "next";

// Note: `next dev` does not proxy Cloudflare bindings. getDb() falls back to
// a local SQLite file without D1, and uploads (which use the R2 binding) are
// unavailable there — run the built Worker with `wrangler dev` to test them.

const isDev = process.env.NODE_ENV === "development";

// Report-Only until CSP_ENFORCE=true. The policy below is tight enough that a
// mistake breaks rendering for everyone, so it collects violations against
// real traffic first; flipping the variable then enforces it without a code
// change (see DEPLOY.md).
//
// 'unsafe-inline' in script-src is required because pages are rendered
// without a nonce; moving to nonces means making every route dynamic (see
// the Next.js CSP guide) and is tracked separately.
// 'unsafe-inline' in style-src is required because the UI styles elements
// with inline `style` attributes throughout.
const csp = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com${isDev ? " 'unsafe-eval'" : ""};
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' data: https://fonts.gstatic.com;
  img-src 'self' blob: data: https:;
  media-src 'self' https:;
  frame-src https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com https://challenges.cloudflare.com;
  connect-src 'self' https://challenges.cloudflare.com;
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
          {
            key:
              process.env.CSP_ENFORCE === "true"
                ? "Content-Security-Policy"
                : "Content-Security-Policy-Report-Only",
            value: csp,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
