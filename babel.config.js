module.exports = function (api) {
  api.cache(true);

  const plugins = [
    [
      "module-resolver",
      {
        root: ["./src"],
        alias: {
          "@navigators": "./src/navigators",
          "@components": "./src/components",
          "@screens": "./src/screens",
          "@utils": "./src/utils",
          "@lib": "./src/lib",
          "@helpers": "./src/helpers",
          "@constants": "./src/constants",
          "@assets": "./src/assets",
          "@store": "./src/store",
          "@types": "./src/types",
          "@enum": "./src/enum",
          "@context": "./src/context",
          "@hooks": "./src/hooks",
          "@env": "./src/env",
          "@contexts": "./src/contexts",
          "@providers": "./src/providers",
          "@templates": "./src/templates",
        },
      },
    ],
    "react-native-reanimated/plugin", // required by SDK 52
  ];

  if (process.env.NODE_ENV === "production") {
    // Add this only in production to remove console.* except warn and error
    plugins.push([
      "transform-remove-console",
      { exclude: ["error", "warn"] },
    ]);
  }

  return {
    presets: ["babel-preset-expo"],
    plugins,
  };
};
