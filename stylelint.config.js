// Rules cover slice CSS only; the lint:css script passes slice-layer CSS.
// Overrides replace a rule's options per matching block, so each
// at-rule-disallowed-list lists every at-rule that applies to its files.
const sliceAnimationAtRules = ["keyframes", "-webkit-keyframes"];
const keyframesMessage = "Animate with motion, not CSS @keyframes.";
// theme.css also rejects @import: it may not depend on index.css.
const tailwindDirectives = [
  "import",
  "theme",
  "apply",
  "reference",
  "utility",
  "variant",
  "custom-variant",
  "source",
  "plugin",
  "config",
  "tailwind",
];

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
      files: ["src/pages/*/ui/theme.css"],
      rules: {
        "at-rule-disallowed-list": [
          [...sliceAnimationAtRules, ...tailwindDirectives],
          {
            message: (atRule) =>
              atRule.endsWith("keyframes")
                ? keyframesMessage
                : `theme.css holds only variable redefinitions; remove ${atRule}.`,
          },
        ],
      },
    },
    {
      files: ["src/{pages,widgets,features,entities}/**/*.module.css"],
      rules: {
        "at-rule-disallowed-list": [
          [...sliceAnimationAtRules, "reference", "apply"],
          {
            message: (atRule) =>
              atRule.endsWith("keyframes")
                ? keyframesMessage
                : `CSS Modules read tokens with var(); remove ${atRule}.`,
          },
        ],
      },
    },
  ],
};
