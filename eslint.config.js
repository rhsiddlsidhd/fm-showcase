import js from "@eslint/js";
import betterTailwindcss from "eslint-plugin-better-tailwindcss";
import checkFile from "eslint-plugin-check-file";
import jsxA11y from "eslint-plugin-jsx-a11y";
import reactHooks from "eslint-plugin-react-hooks";
import testingLibrary from "eslint-plugin-testing-library";
import globals from "globals";
import tseslint from "typescript-eslint";

// Flat config replaces a rule's options per matching block, so each
// no-restricted-imports block lists every pattern that applies to its files.
const sharedModuleImport = {
  regex: "^@/shared/(ui|lib)(/index(\\.tsx?)?)?$",
  message: "Import the module path, e.g. @/shared/ui/button.",
};
const sliceThemeImport = {
  regex: "(^|/)theme\\.css$",
  message: "Import the slice theme.css only from the slice index.tsx.",
};
// Steiger allows same-layer cross-imports through an @x public API. Here the
// pages slices are challenges, so that path would let challenges share code.
const crossImportPublicApi = {
  regex: "(^|/)@x(/|$)",
  message: "Slices on one layer do not import each other, even through @x.",
};
const assetConstantsImport = {
  regex: "(^|/)assets$",
  message: "Verify asset paths as strings instead of importing ui/assets.",
};

export default tseslint.config(
  { ignores: ["dist", "node_modules", "_workspace", "src/shared/ui"] },
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      jsxA11y.flatConfigs.recommended,
    ],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
  {
    // Production code checks values before use. Tests may assert with "!"
    // because a missing value makes the test fail at that line.
    files: ["**/*.{ts,tsx}"],
    ignores: ["**/*.test.{ts,tsx}", "e2e/**"],
    rules: { "@typescript-eslint/no-non-null-assertion": "error" },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        { patterns: [sharedModuleImport, crossImportPublicApi] },
      ],
    },
  },
  {
    files: ["src/pages/*/*/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            sharedModuleImport,
            sliceThemeImport,
            crossImportPublicApi,
          ],
        },
      ],
    },
  },
  {
    files: ["src/{pages,widgets,features,entities}/**/*.tsx"],
    ignores: ["src/**/*.test.tsx"],
    plugins: { "better-tailwindcss": betterTailwindcss },
    rules: {
      // Patterns match the whole class, so "(^|:)" also covers variants (md:, hover:).
      "better-tailwindcss/no-restricted-classes": [
        "error",
        {
          restrict: [
            {
              pattern:
                "(^|:)!?text-\\[(length:)?([\\d.]|(calc|clamp|min|max)\\()",
              message:
                "Redefine a --text-* step in theme.css instead of an arbitrary font size.",
            },
            {
              pattern: "(^|:)dark:",
              message:
                "Change colors by redefining tokens in theme.css, not with dark:.",
            },
            {
              pattern:
                "(^|:)!?(transition(?![\\w-])|transition-(?!none!?$)|animate-|\\[(-webkit-)?(transition|animation))",
              message:
                "Animate with motion, not CSS transition or animation utilities.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: { "check-file": checkFile },
    rules: {
      "check-file/folder-naming-convention": [
        "error",
        { "src/{pages,widgets,features,entities}/*/": "KEBAB_CASE" },
      ],
    },
  },
  {
    // Only files outside the frozen segments reach this block.
    files: ["src/{pages,widgets,features,entities}/*/*/**/*.{ts,tsx}"],
    ignores: ["src/{pages,widgets,features,entities}/*/{ui,model,api,lib}/**"],
    rules: {
      "check-file/filename-blocklist": [
        "error",
        { "**/*": "*" },
        { errorMessage: "Slice segments are ui, model, api and lib only." },
      ],
    },
  },
  {
    files: ["src/pages/*/index.tsx"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "CallExpression[callee.name=/^use[A-Z]/]",
          message: "Move hooks into a ui/ component; the page only arranges.",
        },
        {
          selector: "CallExpression[callee.property.name=/^use[A-Z]/]",
          message: "Move hooks into a ui/ component; the page only arranges.",
        },
      ],
    },
  },
  {
    files: ["src/**/*.test.{ts,tsx}"],
    plugins: { "testing-library": testingLibrary },
    rules: {
      "testing-library/no-container": "error",
      "testing-library/no-node-access": "error",
      "testing-library/prefer-screen-queries": "error",
      "testing-library/prefer-user-event": "error",
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            sharedModuleImport,
            sliceThemeImport,
            crossImportPublicApi,
            assetConstantsImport,
          ],
        },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector: "CallExpression[callee.property.name='dispatchEvent']",
          message: "Use user-event instead of dispatching events directly.",
        },
      ],
    },
  },
  {
    files: ["e2e/**/*.ts"],
    rules: {
      "no-restricted-imports": ["error", { patterns: [assetConstantsImport] }],
    },
  },
  {
    files: ["scripts/**/*.ts"],
    rules: { "@typescript-eslint/no-explicit-any": "off" },
  },
);
