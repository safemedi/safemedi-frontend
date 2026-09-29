const { withEntitlementsPlist, withInfoPlist } = require("@expo/config-plugins");

/**
 * iOS Personal Team(무료) 등 Push Provisioning이 없을 때 dev client 서명을 통과시킵니다.
 * `EXPO_PUBLIC_IOS_ENABLE_REMOTE_PUSH=true` 일 때만 aps-environment를 유지합니다.
 */
function withIosPushDisabled(config) {
  const pushEnabled = process.env.EXPO_PUBLIC_IOS_ENABLE_REMOTE_PUSH === "true";

  if (pushEnabled) {
    return config;
  }

  config = withEntitlementsPlist(config, (config) => {
    delete config.modResults["aps-environment"];
    return config;
  });

  config = withInfoPlist(config, (config) => {
    const modes = config.modResults.UIBackgroundModes;
    if (!Array.isArray(modes)) {
      return config;
    }

    config.modResults.UIBackgroundModes = modes.filter((mode) => mode !== "remote-notification");
    if (config.modResults.UIBackgroundModes.length === 0) {
      delete config.modResults.UIBackgroundModes;
    }
    return config;
  });

  return config;
}

module.exports = withIosPushDisabled;
