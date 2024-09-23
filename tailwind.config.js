const theme = require("./src/constants/theme/colors");
import defaultTheme from "tailwindcss/defaultTheme";

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ...theme.Colors,
      },
      fontFamily: {
        sans: [
          "Inter_400Regular",
          "Inter_500Medium",
          "Inter_600SemiBold",
          "Inter_700Bold",
          "Inter_800ExtraBold",
          ...defaultTheme.fontFamily.sans,
        ],
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
