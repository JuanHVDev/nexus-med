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
    // Playwright report files (generated/minified)
    "playwright-report/**",
    "test-results/**",
    // Coverage reports
    "coverage/**",
    // Load tests (k6 scenarios)
    "tests/load/**",
  ]),
]);

export default eslintConfig;
