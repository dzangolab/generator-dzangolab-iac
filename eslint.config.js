import js from "@eslint/js";

export default [
  js.configs.recommended,
  { 
    ignores: [
      "**/.gitignore",
      "**/templates",
      "__tests__",
      "coverage",
      "ship.config.cjs"
    ]
  }
];