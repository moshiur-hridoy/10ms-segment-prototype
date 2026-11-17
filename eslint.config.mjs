import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // The landing code came from a project without lint (1 Nov 2026). Its setState-in-effect animations
  // are reworked when it moves into the design system (docs/design-audit.md §4.8, phase 3).
  {
    files: ["src/components/landing/**"],
    rules: { "react-hooks/set-state-in-effect": "warn", "react-hooks/refs": "warn" },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
