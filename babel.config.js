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
            "@helpers": "./src/helpers",
            "@constants": "./src/constants",
            "@assets": "./src/assets",
            "@store": "./src/store",
            "@types": "./src/types",
            "@enum": "./src/enum",
            "@context": "./src/context",
            "@hooks": "./src/hooks",
            "@env": "./src/env",
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
