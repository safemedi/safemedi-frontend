const {
  withPlugins,
  withPodfile,
  withEntitlementsPlist,
  withInfoPlist,
} = require("@expo/config-plugins");
const path = require("node:path");
const firebaseRoot = path.dirname(require.resolve("@react-native-firebase/app/package.json"));
const { withFirebaseAppDelegate, withIosGoogleServicesFile } = require(
  path.join(firebaseRoot, "plugin/build/ios"),
);

// 23.8.8의 공식 iOS mods만 적용해 Android Google Services 설정은 유지한다.
function withIosFirebase(config) {
  config = withPlugins(config, [withFirebaseAppDelegate, withIosGoogleServicesFile]);
  config = withPodfile(config, (config) => {
    const flag = "$RNFirebaseAsStaticFramework = true";
    if (!config.modResults.contents.includes(flag)) {
      config.modResults.contents = `${flag}\n${config.modResults.contents}`;
    }
    return config;
  });
  config = withEntitlementsPlist(config, (config) => {
    config.modResults["aps-environment"] = "development";
    return config;
  });
  return withInfoPlist(config, (config) => {
    const modes = config.modResults.UIBackgroundModes ?? [];
    config.modResults.UIBackgroundModes = [...new Set([...modes, "remote-notification"])];
    return config;
  });
}

module.exports = withIosFirebase;
