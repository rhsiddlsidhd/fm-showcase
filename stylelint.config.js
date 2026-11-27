// Rules cover slice CSS only; the lint:css script passes slice-layer CSS.
// Overrides replace a rule's options per matching block, so each
// at-rule-disallowed-list lists every at-rule that applies to its files.
const sliceAnimationAtRules = ["keyframes", "-webkit-keyframes"];
const keyframesMessage = "Animate with motion, not CSS @keyframes.";
// theme.css only redefines variables, so it may only hold .theme-<slice> and
// .theme-<slice>.dark, wrapped at most in @supports or @media (prefers-*).
const themeScopeSelector = "\\.theme-[a-z0-9]+(-[a-z0-9]+)*(\\.dark)?";
// Names in a Tailwind theme namespace are read by default utilities, so a
// page variable there silently redefines them. Slices redefine only the
// default text steps, which the token contract uses.
const tailwindNamespaces = [
  "default",
  "tw",
  "color",
  "font",
  "text",
  "font-weight",
  "tracking",
  "leading",
  "breakpoint",
  "container",
  "spacing",
  "radius",
  "shadow",
  "inset-shadow",
  "drop-shadow",
  "text-shadow",
  "blur",
  "perspective",
  "aspect",
  "ease",
  "animate",
].join("|");
const textStep = "text-(xs|sm|base|lg|xl|[2-9]xl)(--line-height)?";

/** @type {import("stylelint").Config} */
export default {
  rules: {
    "at-rule-disallowed-list": [
      sliceAnimationAtRules,
      { message: keyframesMessage },
    ],
    "property-disallowed-list": [
      ["/^(-webkit-)?(transition|animation)(-|$)/", "--spacing"],
      {
        message: (property) =>
          property === "--spacing"
            ? "Do not redefine --spacing; every numeric spacing utility scales with it."
            : `Animate with motion, not CSS ${property}.`,
      },
    ],
  },
  overrides: [
    {
      files: ["src/{pages,widgets,features,entities}/*/ui/theme.css"],
      rules: {
        "at-rule-allowed-list": [
          ["supports", "media"],
          {
            message: (atRule) =>
              `theme.css holds only variable redefinitions; remove ${atRule}.`,
          },
        ],
        "media-feature-name-allowed-list": [
          ["/^prefers-/"],
          {
            message: (feature) =>
              `Change values at a width with a Tailwind variant in the component, not ${feature} in theme.css.`,
          },
        ],
        "selector-disallowed-list": [
          [`/^(?!${themeScopeSelector}$)/`],
          {
            splitList: true,
            message: (selector) =>
              `theme.css styles only .theme-<slice> and .theme-<slice>.dark; remove ${selector}.`,
          },
        ],
        "property-allowed-list": [
          ["/^--/"],
          {
            message: (property) =>
              `theme.css only redefines variables; style ${property} with a utility in the component.`,
          },
        ],
        "custom-property-pattern": [
          `^(?!(${tailwindNamespaces})-)|^${textStep}$`,
          {
            message: (name) =>
              `${name} is in a Tailwind theme namespace; name page variables by role (docs/ui/theme.md).`,
          },
        ],
      },
    },
  ],
};
