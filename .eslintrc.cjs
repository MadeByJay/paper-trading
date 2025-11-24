module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: false,
    ecmaVersion: 2022,
    sourceType: "module",
  },
  plugins: ["@typescript-eslint", "react", "react-hooks", "import"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:import/recommended",
    "plugin:import/typescript",
    "prettier",
  ],
  settings: {
    react: {
      version: "detect",
    },
  },
  rules: {},
  ignorePatterns: ["dist", "build", "node_modules"],
};
