const { withAppDelegate } = require("@expo/config-plugins");

const BROKEN_KAKAO_LINKING_PATTERN =
  /\s*if kakao_login\.RNKakaoLogins\.isKakaoTalkLoginUrl\(url\) \{ return kakao_login\.RNKakaoLogins\.handleOpen\(url\) \}\n?/g;

const CORRECT_KAKAO_LINKING = `if RNKakaoLogins.isKakaoTalkLoginUrl(url) {
      return RNKakaoLogins.handleOpen(url)
    }`;

const SUPER_OPEN_URL_ANCHOR = "return super.application(app, open: url, options: options)";

function withIosKakaoAppDelegateFix(config) {
  return withAppDelegate(config, (config) => {
    if (config.modResults.language !== "swift") {
      return config;
    }

    let contents = config.modResults.contents;
    contents = contents.replace(BROKEN_KAKAO_LINKING_PATTERN, "\n");
    contents = contents.replace(
      "return RNKakaoLogins.handleOpenUrl(url)",
      "return RNKakaoLogins.handleOpen(url)",
    );

    if (!contents.includes("RNKakaoLogins.isKakaoTalkLoginUrl(url)")) {
      const nextContents = contents.replace(
        SUPER_OPEN_URL_ANCHOR,
        `${CORRECT_KAKAO_LINKING}
        ${SUPER_OPEN_URL_ANCHOR}`,
      );
      if (nextContents === contents) {
        throw new Error(
          "[withIosKakaoAppDelegateFix] Failed to inject Kakao URL handling block into AppDelegate.swift",
        );
      }
      contents = nextContents;
    }

    config.modResults.contents = contents;
    return config;
  });
}

module.exports = withIosKakaoAppDelegateFix;
