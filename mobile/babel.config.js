module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      // react-native-reanimated v4 moved its worklet transform into this package.
      // Must remain the LAST plugin in the list.
      "react-native-worklets/plugin",
    ],
  };
};
