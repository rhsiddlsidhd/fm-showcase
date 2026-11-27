import js from "@eslint/js";
import betterTailwindcss from "eslint-plugin-better-tailwindcss";
import checkFile from "eslint-plugin-check-file";
import jsxA11y from "eslint-plugin-jsx-a11y";
import playwright from "eslint-plugin-playwright";
import reactHooks from "eslint-plugin-react-hooks";
import testingLibrary from "eslint-plugin-testing-library";
import vitest from "@vitest/eslint-plugin";
import { defineConfig } from "eslint/config";
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
// Styles enter a slice only through ui/theme.css and @fontsource, both
// imported by the slice index. Any other CSS bypasses theme.css. Packages
// that export CSS under a path without .css (swiper/css) match only when the
// path has a css segment.
const cssSpecifier = "(\\.(css|scss|sass|less|styl|pcss)(\\?.*)?|/css(/.*)?)$";
const sliceIndexCssImport = {
  regex: `^(?!@fontsource(-variable)?/)(?!\\./ui/theme\\.css$).*${cssSpecifier}`,
  message: "A slice imports only ./ui/theme.css and @fontsource CSS.",
};
const segmentCssImport = {
  regex: `^@fontsource|^(?!.*(^|/)theme\\.css$).*${cssSpecifier}`,
  message: "Style with utilities; the slice index imports theme.css and fonts.",
};

// Colors work with dark mode and contrast checks only as theme.css tokens.
// CSS named colors, without transparent and currentcolor, which follow tokens.
const cssColorNames = [
  "aliceblue",
  "antiquewhite",
  "aqua",
  "aquamarine",
  "azure",
  "beige",
  "bisque",
  "black",
  "blanchedalmond",
  "blue",
  "blueviolet",
  "brown",
  "burlywood",
  "cadetblue",
  "chartreuse",
  "chocolate",
  "coral",
  "cornflowerblue",
  "cornsilk",
  "crimson",
  "cyan",
  "darkblue",
  "darkcyan",
  "darkgoldenrod",
  "darkgray",
  "darkgreen",
  "darkgrey",
  "darkkhaki",
  "darkmagenta",
  "darkolivegreen",
  "darkorange",
  "darkorchid",
  "darkred",
  "darksalmon",
  "darkseagreen",
  "darkslateblue",
  "darkslategray",
  "darkslategrey",
  "darkturquoise",
  "darkviolet",
  "deeppink",
  "deepskyblue",
  "dimgray",
  "dimgrey",
  "dodgerblue",
  "firebrick",
  "floralwhite",
  "forestgreen",
  "fuchsia",
  "gainsboro",
  "ghostwhite",
  "gold",
  "goldenrod",
  "gray",
  "green",
  "greenyellow",
  "grey",
  "honeydew",
  "hotpink",
  "indianred",
  "indigo",
  "ivory",
  "khaki",
  "lavender",
  "lavenderblush",
  "lawngreen",
  "lemonchiffon",
  "lightblue",
  "lightcoral",
  "lightcyan",
  "lightgoldenrodyellow",
  "lightgray",
  "lightgreen",
  "lightgrey",
  "lightpink",
  "lightsalmon",
  "lightseagreen",
  "lightskyblue",
  "lightslategray",
  "lightslategrey",
  "lightsteelblue",
  "lightyellow",
  "lime",
  "limegreen",
  "linen",
  "magenta",
  "maroon",
  "mediumaquamarine",
  "mediumblue",
  "mediumorchid",
  "mediumpurple",
  "mediumseagreen",
  "mediumslateblue",
  "mediumspringgreen",
  "mediumturquoise",
  "mediumvioletred",
  "midnightblue",
  "mintcream",
  "mistyrose",
  "moccasin",
  "navajowhite",
  "navy",
  "oldlace",
  "olive",
  "olivedrab",
  "orange",
  "orangered",
  "orchid",
  "palegoldenrod",
  "palegreen",
  "paleturquoise",
  "palevioletred",
  "papayawhip",
  "peachpuff",
  "peru",
  "pink",
  "plum",
  "powderblue",
  "purple",
  "rebeccapurple",
  "red",
  "rosybrown",
  "royalblue",
  "saddlebrown",
  "salmon",
  "sandybrown",
  "seagreen",
  "seashell",
  "sienna",
  "silver",
  "skyblue",
  "slateblue",
  "slategray",
  "slategrey",
  "snow",
  "springgreen",
  "steelblue",
  "tan",
  "teal",
  "thistle",
  "tomato",
  "turquoise",
  "violet",
  "wheat",
  "white",
  "whitesmoke",
  "yellow",
  "yellowgreen",
].join("|");
const colorFunction =
  "\\b(rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\\((?!\\s*var\\()";
// A color literal inside an arbitrary value or property. A url fragment
// (url(/a.svg#add)) and a function over a token (rgb(var(--c))) are not.
const arbitraryColor = `(^|:)!?([a-z-]+-)?\\[[^\\]]*((?<![a-zA-Z0-9/.])#[0-9a-fA-F]{3,8}\\b|${colorFunction}|(?<=[\\[:_,(])(${cssColorNames})(?=[\\]_,)]))`;
const paletteColor =
  "(^|:)!?([a-z-]+-(slate|gray|zinc|neutral|stone|mauve|olive|mist|taupe|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(50|[1-9]00|950)|(bg|text|border(-[xytrblse])?|ring|ring-offset|outline|fill|stroke|from|via|to|shadow|inset-shadow|drop-shadow|text-shadow|decoration|divide|accent|caret|placeholder)-(white|black))(/.+)?!?$";
// A hex or color function in any string, wherever a value is kept (motion
// constants included). Named colors are words in ordinary text, so only DOM
// color attributes check them.
// Hex only in valid lengths and not as an id ("#add-item") or url(#id); a
// color function only with a numeric argument, so "color(s)" in text passes.
const stringColor =
  "(^|[\\s,]|(?<!url)\\()#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})(?![\\w-])|\\b(rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\\((?!\\s*var\\()[^)]*\\d";
const classStringCall =
  "CallExpression[callee.name=/^(cn|clsx|cva|cx|tv|twMerge|twJoin)$/]";
const cssImportSource = `/${cssSpecifier.replaceAll("/", "\\/")}/`;

// Element styles go through utilities, so values enter through theme.css.
// The style attribute, <style> elements, writes to element.style and dynamic
// CSS imports skip both. A write through a variable (const s = el.style) and
// a color in a template literal are not traced.
const styleOutsideUtilities = [
  {
    selector: "JSXAttribute[name.name='style']",
    message: "Style with utilities, not the style attribute.",
  },
  {
    selector: "JSXOpeningElement[name.name='style']",
    message: "Style with utilities, not a <style> element.",
  },
  {
    selector:
      "CallExpression[callee.property.name='createElement'][arguments.0.value='style']",
    message: "Style with utilities, not a <style> element.",
  },
  {
    selector:
      "CallExpression[callee.property.name='setAttribute'][arguments.0.value='style']",
    message: "Style with utilities, not a style attribute.",
  },
  {
    selector:
      "CallExpression[callee.object.name='Object'][callee.property.name='assign'][arguments.0.property.name='style']",
    message: "Style with utilities, not element.style.",
  },
  {
    selector: `ImportExpression > Literal[value=${cssImportSource}]`,
    message: "A slice imports only ./ui/theme.css and @fontsource CSS.",
  },
  {
    selector:
      "AssignmentExpression > MemberExpression.left[property.name='style']",
    message: "Style with utilities, not element.style.",
  },
  {
    selector:
      "AssignmentExpression > MemberExpression.left > MemberExpression.object[property.name='style']",
    message: "Style with utilities, not element.style.",
  },
  {
    selector:
      "CallExpression > MemberExpression.callee[property.name='setProperty'] > MemberExpression.object[property.name='style']",
    message: "Style with utilities, not element.style.setProperty.",
  },
  {
    // DOM elements only: a component's color prop (color="primary") is not CSS.
    selector: `JSXOpeningElement[name.name=/^[a-z]/] > JSXAttribute[name.name=/^(fill|stroke|color|stopColor|floodColor|lightingColor)$/] Literal[value=/^(${cssColorNames})$/i]`,
    message: "Put colors in theme.css and read them as tokens.",
  },
  {
    // Class strings are checked by better-tailwindcss.
    selector: `Literal:not(JSXAttribute[name.name='className'] Literal):not(${classStringCall} Literal)[value=/${stringColor}/i]`,
    message: "Put colors in theme.css and read them as tokens.",
  },
];

export default defineConfig(
  {
    ignores: [
      "dist",
      "dist-e2e",
      "test-results",
      "playwright-report",
      "node_modules",
      "_workspace",
      "src/shared/ui",
    ],
  },
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      // Type-aware rules catch unawaited promises (Playwright actions,
      // user-event calls, fetch) and any leaking into typed code.
      tseslint.configs.recommendedTypeChecked,
      reactHooks.configs.flat.recommended,
      jsxA11y.flatConfigs.recommended,
    ],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
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
    files: ["src/{pages,widgets,features,entities}/*/*/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            sharedModuleImport,
            sliceThemeImport,
            segmentCssImport,
            crossImportPublicApi,
          ],
        },
      ],
    },
  },
  {
    files: ["src/{pages,widgets,features,entities}/*/index.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            sharedModuleImport,
            sliceIndexCssImport,
            crossImportPublicApi,
          ],
        },
      ],
    },
  },
  {
    files: ["src/{pages,widgets,features,entities}/**/*.{ts,tsx}"],
    ignores: ["src/**/*.test.{ts,tsx}"],
    rules: { "no-restricted-syntax": ["error", ...styleOutsideUtilities] },
  },
  {
    files: ["src/{pages,widgets,features,entities}/**/*.tsx"],
    ignores: ["src/**/*.test.tsx"],
    plugins: { "better-tailwindcss": betterTailwindcss },
    settings: {
      "better-tailwindcss": { entryPoint: "src/app/styles/index.css" },
    },
    rules: {
      "better-tailwindcss/no-conflicting-classes": "error",
      "better-tailwindcss/no-duplicate-classes": "error",
      "better-tailwindcss/no-deprecated-classes": "error",
      // theme-* scopes a slice's tokens and dark switches its color set; neither is a utility.
      "better-tailwindcss/no-unknown-classes": [
        "error",
        { ignore: ["^theme-", "^dark$"] },
      ],
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
              pattern: arbitraryColor,
              message: "Put colors in theme.css and read them as tokens.",
            },
            {
              pattern: paletteColor,
              message: "Put colors in theme.css and read them as tokens.",
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
    // A slice has one index; its segments have none.
    files: [
      "src/{pages,widgets,features,entities}/*/{ui,model,api,lib}/index.{ts,tsx}",
    ],
    rules: {
      "check-file/filename-blocklist": [
        "error",
        { "**/index.{ts,tsx}": "*" },
        { errorMessage: "A slice has one index; segments have none." },
      ],
    },
  },
  {
    // Steiger skips folders that are not layers, so they would go unchecked.
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/{app,pages,widgets,features,entities,shared}/**"],
    rules: {
      "check-file/filename-blocklist": [
        "error",
        { "**/*": "*" },
        {
          errorMessage:
            "src/ holds only the layers app, pages, widgets, features, entities and shared.",
        },
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
        {
          selector: "JSXAttribute[name.name=/^on[A-Z]/]",
          message:
            "Move event handlers into a ui/ component; the page only arranges.",
        },
        {
          selector:
            "JSXExpressionContainer > :matches(ConditionalExpression, LogicalExpression)",
          message:
            "Move conditional display into a ui/ component; the page only arranges.",
        },
        {
          selector: "ExportDefaultDeclaration",
          message: "Export the page as a named <Slice>Page component.",
        },
        {
          selector:
            "ExportNamedDeclaration > VariableDeclaration > VariableDeclarator[id.name!=/Page$/]",
          message: "Export the page as a named <Slice>Page component.",
        },
        {
          selector:
            "ExportNamedDeclaration > FunctionDeclaration[id.name!=/Page$/]",
          message: "Export the page as a named <Slice>Page component.",
        },
        ...styleOutsideUtilities,
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
    // A test with no assertion, or a focused or skipped test, passes CI
    // without checking anything (docs/testing/test-policy.md).
    files: ["src/**/*.test.{ts,tsx}", "scripts/**/*.test.ts"],
    plugins: { vitest },
    rules: {
      "vitest/no-focused-tests": "error",
      "vitest/no-disabled-tests": "error",
      "vitest/expect-expect": [
        "error",
        { assertFunctionNames: ["expect", "expect*"] },
      ],
    },
  },
  {
    files: ["e2e/**/*.ts"],
    plugins: { playwright },
    rules: {
      "no-restricted-imports": ["error", { patterns: [assetConstantsImport] }],
      "playwright/missing-playwright-await": "error",
      "playwright/no-focused-test": "error",
      "playwright/no-skipped-test": "error",
      "playwright/expect-expect": [
        "error",
        { assertFunctionPatterns: ["^expect"] },
      ],
      "playwright/no-wait-for-timeout": "error",
    },
  },
  {
    files: ["scripts/**/*.ts"],
    rules: { "@typescript-eslint/no-explicit-any": "off" },
  },
);
