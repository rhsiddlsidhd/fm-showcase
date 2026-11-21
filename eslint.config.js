import js from "@eslint/js";
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
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", { patterns: [sharedModuleImport] }],
    },
  },
  {
    files: ["src/pages/*/*/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        { patterns: [sharedModuleImport, sliceThemeImport] },
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
