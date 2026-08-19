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
  ]),
  {
    rules: {
      // Async data-loading fire-and-forget in effects is an intentional
      // pattern used throughout this codebase (await -> setState happens
      // after the first await, not synchronously).
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);

export default eslintConfig;