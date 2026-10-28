import type { ConfigContext, ExpoConfig } from "expo/config";

const KAKAO_LOGIN_PLUGIN_NAME = "@react-native-seoul/kakao-login";
const EXPO_BUILD_PROPERTIES_PLUGIN_NAME = "expo-build-properties";
const EXPO_LOCATION_PLUGIN_NAME = "expo-location";
const SENTRY_PLUGIN_NAME = "@sentry/react-native/expo";
const KAKAO_MAVEN_REPOSITORY = "https://devrepo.kakao.com/nexus/content/groups/public/";
const DEFAULT_APP_NAME = "safeMedi";
const DEFAULT_APP_SLUG = "safeMedi";
// Kakao SDK 모델 및 Retrofit이 리플렉션으로 읽는 타입·어노테이션을 보존한다.
// https://developers.kakao.com/docs/ko/android/getting-started#proguard
const ANDROID_EXTRA_PROGUARD_RULES = `
-keep class com.kakao.sdk.**.model.* { <fields>; }

-keepattributes Signature,InnerClasses,EnclosingMethod
-keepattributes RuntimeVisibleAnnotations,RuntimeVisibleParameterAnnotations,AnnotationDefault
-keepclassmembers,allowshrinking,allowobfuscation interface * {
  @retrofit2.http.* <methods>;
}
-if interface * { @retrofit2.http.* <methods>; }
-keep,allowobfuscation interface <1>
-if interface * { @retrofit2.http.* <methods>; }
-keep,allowobfuscation interface * extends <1>
-keep,allowobfuscation,allowshrinking class kotlin.coroutines.Continuation
-if interface * { @retrofit2.http.* public *** *(...); }
-keep,allowoptimization,allowshrinking,allowobfuscation class <3>
-keep,allowobfuscation,allowshrinking interface retrofit2.Call
-keep,allowobfuscation,allowshrinking class retrofit2.Response

# Expo Record 옵션 변환에 필요한 어노테이션 이름과 멤버를 보존한다.
# https://github.com/expo/expo/pull/51206
-keep @interface expo.modules.kotlin.records.Field { *; }

# 현재 expo-notifications에서 연결이 누락된 공식 소비자 규칙을 보완한다.
# https://github.com/expo/expo/pull/45974
-keep class expo.modules.notifications.** { *; }
`;
const LOCATION_USAGE_DESCRIPTION =
  "현재 위치를 기반으로 지도를 표시하기 위해 위치 접근 권한이 필요합니다.";
const KAKAO_NATIVE_APP_KEY = process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY ?? "";
const GOOGLE_SERVICES_JSON = process.env.GOOGLE_SERVICES_JSON;
const SENTRY_ORG_SLUG = process.env.SENTRY_ORG_SLUG;
const SENTRY_PROJECT_SLUG = process.env.SENTRY_PROJECT_SLUG;

if (!SENTRY_ORG_SLUG || !SENTRY_PROJECT_SLUG) {
  throw new Error(
    "SENTRY_ORG_SLUG / SENTRY_PROJECT_SLUG 환경변수가 필요합니다. .env 또는 EAS 환경변수 설정을 확인하세요.",
  );
}

type PluginEntry = NonNullable<ExpoConfig["plugins"]>[number];

function getPluginName(plugin: PluginEntry): string {
  return Array.isArray(plugin) ? String(plugin[0]) : String(plugin);
}

function stripManagedPlugins(plugins: readonly PluginEntry[]): PluginEntry[] {
  return plugins.filter((plugin) => {
    const pluginName = getPluginName(plugin);
    return (
      pluginName !== KAKAO_LOGIN_PLUGIN_NAME &&
      pluginName !== EXPO_BUILD_PROPERTIES_PLUGIN_NAME &&
      pluginName !== EXPO_LOCATION_PLUGIN_NAME
    );
  });
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const existingPlugins = stripManagedPlugins((config.plugins ?? []) as PluginEntry[]);
  const existingInfoPlist = config.ios?.infoPlist ?? {};

  return {
    ...config,
    name: config.name ?? DEFAULT_APP_NAME,
    slug: config.slug ?? DEFAULT_APP_SLUG,
    ios: {
      ...config.ios,
      infoPlist: {
        ...existingInfoPlist,
      },
    },
    android: {
      ...config.android,
      ...(GOOGLE_SERVICES_JSON ? { googleServicesFile: GOOGLE_SERVICES_JSON } : {}),
    },
    plugins: [
      "./plugins/withIosNetworkSessionFix.js",
      "./plugins/withIosKakaoAppDelegateFix.js",
      "./plugins/withAndroidR8Optimization.js",
      ...existingPlugins,
      "./plugins/withIosPushDisabled.js",
      [
        KAKAO_LOGIN_PLUGIN_NAME,
        {
          kakaoAppKey: KAKAO_NATIVE_APP_KEY,
          kotlinVersion: "2.1.20",
        },
      ],
      [
        EXPO_BUILD_PROPERTIES_PLUGIN_NAME,
        {
          android: {
            extraMavenRepos: [KAKAO_MAVEN_REPOSITORY],
            enableMinifyInReleaseBuilds: true,
            enableShrinkResourcesInReleaseBuilds: true,
            extraProguardRules: ANDROID_EXTRA_PROGUARD_RULES,
          },
        },
      ],
      [
        EXPO_LOCATION_PLUGIN_NAME,
        {
          locationAlwaysAndWhenInUsePermission: LOCATION_USAGE_DESCRIPTION,
          locationWhenInUsePermission: LOCATION_USAGE_DESCRIPTION,
        },
      ],
      [
        SENTRY_PLUGIN_NAME,
        {
          organization: SENTRY_ORG_SLUG,
          project: SENTRY_PROJECT_SLUG,
          experimental_android: {
            enableAndroidGradlePlugin: true,
            includeProguardMapping: true,
            autoUploadProguardMapping: true,
            uploadNativeSymbols: false,
            autoUploadNativeSymbols: false,
            includeNativeSources: false,
          },
        },
      ],
    ],
  };
};
