const { withAppDelegate } = require("@expo/config-plugins");

const NETWORK_SESSION_FIX_MARKER = "RCTSetCustomNSURLSessionConfigurationProvider";
const NETWORK_SESSION_FIX = `#if os(iOS)
    RCTSetCustomNSURLSessionConfigurationProvider {
      return URLSessionConfiguration.ephemeral
    }
#endif
`;

const DID_FINISH_LAUNCHING_ANCHOR = "  ) -> Bool {\n    let delegate = ReactNativeDelegate()";

function withIosNetworkSessionFix(config) {
  return withAppDelegate(config, (config) => {
    if (config.modResults.language !== "swift") {
      return config;
    }

    const contents = config.modResults.contents;
    if (contents.includes(NETWORK_SESSION_FIX_MARKER)) {
      return config;
    }

    const nextContents = contents.replace(
      DID_FINISH_LAUNCHING_ANCHOR,
      `  ) -> Bool {\n${NETWORK_SESSION_FIX}    let delegate = ReactNativeDelegate()`,
    );

    if (nextContents === contents) {
      throw new Error(
        "[withIosNetworkSessionFix] Failed to inject ephemeral URLSession configuration into AppDelegate.swift",
      );
    }

    config.modResults.contents = nextContents;
    return config;
  });
}

module.exports = withIosNetworkSessionFix;
