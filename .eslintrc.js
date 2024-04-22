module.exports = {
  root: true,
  extends: ["@react-native-community", "plugin:prettier/recommended"],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  rules: {
    "react/no-unstable-nested-components": ["off"],
    "react-native/no-inline-styles": ["off"],
    "@typescript-eslint/no-shadow": ["off"],
    "no-shadow": ["off"],
  },
};
