const { withAppBuildGradle } = require("@expo/config-plugins");

const DEFAULT_RULES = /getDefaultProguardFile\(\s*(["'])proguard-android\.txt\1\s*\)/g;
const OPTIMIZED_RULES = /getDefaultProguardFile\(\s*(["'])proguard-android-optimize\.txt\1\s*\)/;

function withAndroidR8Optimization(config) {
  return withAppBuildGradle(config, (config) => {
    const contents = config.modResults.contents;
    const nextContents = contents.replace(
      DEFAULT_RULES,
      'getDefaultProguardFile("proguard-android-optimize.txt")',
    );

    if (!OPTIMIZED_RULES.test(nextContents)) {
      throw new Error(
        "[withAndroidR8Optimization] Could not find the default ProGuard configuration in app build.gradle",
      );
    }

    config.modResults.contents = nextContents;
    return config;
  });
}

module.exports = withAndroidR8Optimization;
