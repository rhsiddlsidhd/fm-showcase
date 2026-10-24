import fsd from "@feature-sliced/steiger-plugin";
import { defineConfig } from "steiger";

export default defineConfig([
  ...fsd.configs.recommended,
  {
    // shadcn CLI writes flat files into the ui segment and never creates index
    // files. The FSD docs' own config example turns this rule off for the
    // Shared layer for the same reason.
    files: ["./src/shared/**"],
    rules: {
      "fsd/public-api": "off",
    },
  },
]);
