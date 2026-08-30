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
]);

export default eslintConfig;
