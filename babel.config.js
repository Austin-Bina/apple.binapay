module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        "module-resolver",
        {
          root: ['./src'],
          alias: {
            "@navigators": "./src/navigators",
            "@components": "./src/components",
            "@screens": "./src/screens",
            "@utils": "./src/utils",
            "@lib": "./src/lib",
            "@constants": "./src/constants",
            "@assets": "./src/assets",
            "@redux": "./src/redux",
            "@types": "./src/types",
            "@enum": "./src/enum",
            "@context": "./src/context",
            "@hooks": "./src/hooks",
          },
        },
      ],
    ],
    env: {
      production: {
        plugins: ["transform-remove-console", "react-native-paper/babel"],
      },
    },
  };
};
