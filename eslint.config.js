import js from "@eslint/js";
import jsxA11y from "eslint-plugin-jsx-a11y";
import reactHooks from "eslint-plugin-react-hooks";
import testingLibrary from "eslint-plugin-testing-library";
import globals from "globals";
import tseslint from "typescript-eslint";

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
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              regex: "^@/shared/(ui|lib)(/index(\\.tsx?)?)?$",
              message: "Import the module path, e.g. @/shared/ui/button.",
            },
          ],
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
    },
  },
  {
    files: ["scripts/**/*.ts"],
    rules: { "@typescript-eslint/no-explicit-any": "off" },
  },
);
