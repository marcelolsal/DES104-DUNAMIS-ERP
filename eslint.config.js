import js from "@eslint/js";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import prettier from "eslint-config-prettier";
import globals from "globals";

// Flat config único para todo el monorepo. Corre con `pnpm lint`.
export default tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "**/*.config.js",
      "**/*.config.ts",
      "**/migrations/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  // Reglas del proyecto (ver docs/convenciones-codigo.md).
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      "no-var": "error",
      "prefer-const": "error",
      "func-style": ["error", "expression"], // G3: arrow functions, no `function`
      "prefer-arrow-callback": "error",
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "max-lines-per-function": ["warn", { max: 50, skipBlankLines: true, skipComments: true }], // G5
      "max-lines": ["warn", { max: 250, skipBlankLines: true, skipComments: true }], // G6
      complexity: ["warn", 12],
      "@typescript-eslint/no-explicit-any": "error", // T2
      "@typescript-eslint/no-non-null-assertion": "error", // T3
      "@typescript-eslint/consistent-type-imports": "error", // T7
      "@typescript-eslint/explicit-module-boundary-types": "warn", // T8
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/only-throw-error": "error", // F6
    },
  },

  // Frontend: React + entorno navegador.
  {
    files: ["apps/frontend/**/*.{ts,tsx}"],
    plugins: { react, "react-hooks": reactHooks },
    languageOptions: { globals: { ...globals.browser } },
    settings: { react: { version: "detect" } },
    rules: {
      ...react.configs.flat.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      "react/react-in-jsx-scope": "off", // React 19: no hace falta importar React
      "react/jsx-key": "error", // R7
    },
  },

  // Backend: entorno Node.
  {
    files: ["apps/backend/**/*.ts"],
    languageOptions: { globals: { ...globals.node } },
  },

  prettier, // desactiva reglas de formato; de eso se encarga Prettier
);
