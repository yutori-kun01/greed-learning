import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // A globalIgnores() call replaces the flat-config defaults entirely, so
    // these — normally implicit — need to be listed explicitly too, or a
    // local/CI build (which generates all three) makes `npm run lint`
    // report tens of thousands of problems from bundled/vendored output.
    "node_modules/**",
    ".wrangler/**",
    ".open-next/**",
  ]),
  {
    rules: {
      // ~70 pre-existing uses, mostly untyped drizzle rows. Kept visible as a
      // warning so the rest of the ruleset can block a build on real errors
      // instead of the whole lint step being skipped.
      "@typescript-eslint/no-explicit-any": "warn",
      // Every occurrence is the canonical "read a client-only value once on
      // mount" idiom (next-themes hydration guards, reading a query string).
      // Warn so the rest of the ruleset can gate the build.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]);

export default eslintConfig;
