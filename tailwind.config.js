const theme = require("./src/constants/theme");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ...theme.Colors,
      },
    },
    screens: {
      sm: "380px",
      md: "420px",
      lg: "680px",
      tablet: "1024px",
    },
  },
  plugins: [],
};
