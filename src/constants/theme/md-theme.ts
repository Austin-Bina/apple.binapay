import { MD3Theme, MD3LightTheme } from "react-native-paper";

export const defaultTheme: MD3Theme = {
  ...MD3LightTheme,
  dark: false,
  colors: {
    primary: "rgb(0, 83, 219)",
    onPrimary: "rgb(255, 255, 255)",
    primaryContainer: "rgb(219, 225, 255)",
    onPrimaryContainer: "rgb(0, 23, 75)",
    secondary: "rgb(167, 58, 0)",
    onSecondary: "rgb(255, 255, 255)",
    secondaryContainer: "rgb(255, 219, 206)",
    onSecondaryContainer: "rgb(55, 14, 0)",
    tertiary: "rgb(6, 97, 164)",
    onTertiary: "rgb(255, 255, 255)",
    tertiaryContainer: "rgb(210, 228, 255)",
    onTertiaryContainer: "rgb(0, 29, 54)",
    error: "rgb(186, 26, 26)",
    onError: "rgb(255, 255, 255)",
    errorContainer: "rgb(255, 218, 214)",
    onErrorContainer: "rgb(65, 0, 2)",
    background: "rgb(254, 251, 255)",
    onBackground: "rgb(27, 27, 31)",
    surface: "rgb(254, 251, 255)",
    onSurface: "rgb(27, 27, 31)",
    surfaceVariant: "rgb(226, 226, 236)",
    onSurfaceVariant: "rgb(69, 70, 79)",
    outline: "rgb(117, 118, 128)",
    outlineVariant: "rgb(197, 198, 208)",
    shadow: "rgb(0, 0, 0)",
    scrim: "rgb(0, 0, 0)",
    inverseSurface: "rgb(48, 48, 52)",
    inverseOnSurface: "rgb(242, 240, 244)",
    inversePrimary: "rgb(180, 197, 255)",
    elevation: {
      level0: "transparent",
      level1: "rgb(241, 243, 253)",
      level2: "rgb(234, 238, 252)",
      level3: "rgb(226, 233, 251)",
      level4: "rgb(224, 231, 251)",
      level5: "rgb(218, 228, 250)",
    },
    surfaceDisabled: "rgba(27, 27, 31, 0.12)",
    onSurfaceDisabled: "rgba(27, 27, 31, 0.38)",
    backdrop: "rgba(46, 48, 56, 0.4)",
  },
  fonts: {
    ...MD3LightTheme.fonts,
    displayLarge: {
      ...MD3LightTheme.fonts.displayLarge,
      fontFamily: "Inter_800ExtraBold",
    },
    displayMedium: {
      ...MD3LightTheme.fonts.displayMedium,
      fontFamily: "Inter_700Bold",
    },
    displaySmall: {
      ...MD3LightTheme.fonts.displaySmall,
      fontFamily: "Inter_600SemiBold",
    },
    headlineLarge: {
      ...MD3LightTheme.fonts.headlineLarge,
      fontFamily: "Inter_800ExtraBold",
    },
    headlineMedium: {
      ...MD3LightTheme.fonts.headlineMedium,
      fontFamily: "Inter_700Bold",
    },
    headlineSmall: {
      ...MD3LightTheme.fonts.headlineSmall,
      fontFamily: "Inter_600SemiBold",
    },
    titleLarge: {
      ...MD3LightTheme.fonts.titleLarge,
      fontFamily: "Inter_800ExtraBold",
    },
    titleMedium: {
      ...MD3LightTheme.fonts.titleMedium,
      fontFamily: "Inter_700Bold",
    },
    titleSmall: {
      ...MD3LightTheme.fonts.titleSmall,
      fontFamily: "Inter_600SemiBold",
    },
    labelLarge: {
      ...MD3LightTheme.fonts.labelLarge,
      fontFamily: "Inter_800ExtraBold",
    },
    labelMedium: {
      ...MD3LightTheme.fonts.labelMedium,
      fontFamily: "Inter_700Bold",
    },
    labelSmall: {
      ...MD3LightTheme.fonts.labelSmall,
      fontFamily: "Inter_600SemiBold",
    },
    bodyLarge: {
      ...MD3LightTheme.fonts.bodyLarge,
      fontFamily: "Inter_500Medium",
    },
    bodyMedium: {
      ...MD3LightTheme.fonts.bodyMedium,
      fontFamily: "Inter_400Regular",
    },
    bodySmall: {
      ...MD3LightTheme.fonts.bodySmall,
      fontFamily: "Inter_400Regular",
    },
  },
};
