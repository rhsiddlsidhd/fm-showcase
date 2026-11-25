import fsd from "@feature-sliced/steiger-plugin";
import { defineConfig } from "steiger";

export default defineConfig([
  ...fsd.configs.recommended,
  {
    // A slice index names what it exposes (docs/architecture/segments.md#public-api).
    rules: {
      "fsd/no-wildcard-exports": "error",
    },
  },
]);
