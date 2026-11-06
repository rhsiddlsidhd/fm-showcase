import fsd from "@feature-sliced/steiger-plugin";
import { defineConfig } from "steiger";

export default defineConfig([
  ...fsd.configs.recommended,
  {
    rules: {
      "fsd/import-locality": "error",
      "fsd/no-wildcard-exports": "error",
    },
  },
  {
    files: ["./src/shared/ui/**"],
    rules: {
      "fsd/import-locality": "off",
    },
  },
  {
    files: ["./src/shared/test/**"],
    rules: {
      "fsd/public-api": "off",
    },
  },
]);
