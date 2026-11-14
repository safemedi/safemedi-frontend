import type { ConfigContext, ExpoConfig } from "expo/config";

interface AppConfigModule {
  readonly default: (context: ConfigContext) => ExpoConfig;
}

function createConfigContext(config: ExpoConfig): ConfigContext {
  const projectRoot = process.cwd();
  return {
    config,
    projectRoot,
    staticConfigPath: `${projectRoot}/app.json`,
    packageJsonPath: `${projectRoot}/package.json`,
  };
}

function loadAppConfigModule(): AppConfigModule {
  let loadedModule: AppConfigModule | null = null;

  jest.isolateModules(() => {
    loadedModule = require("../../app.config") as AppConfigModule;
  });

  if (!loadedModule) {
    throw new Error("app.config module could not be loaded");
  }

  return loadedModule;
}

function getPluginName(plugin: NonNullable<ExpoConfig["plugins"]>[number]): string {
  return Array.isArray(plugin) ? String(plugin[0]) : String(plugin);
}

function restoreEnvValue(key: string, Value: string | undefined): void {
  if (Value === undefined) {
    delete process.env[key];
    return;
  }
  process.env[key] = Value;
}

describe("app.config", () => {
  const originalKakaoAppKey = process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY;
  const originalApiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  const originalGoogleServicesJson = process.env.GOOGLE_SERVICES_JSON;
  const originalAppEnv = process.env.EXPO_PUBLIC_APP_ENV;
  const originalBuildProfile = process.env.EAS_BUILD_PROFILE;
  const originalSentryOrgSlug = process.env.SENTRY_ORG_SLUG;
  const originalSentryProjectSlug = process.env.SENTRY_PROJECT_SLUG;

  beforeEach(() => {
    delete process.env.EXPO_PUBLIC_APP_ENV;
    delete process.env.EAS_BUILD_PROFILE;
    process.env.SENTRY_ORG_SLUG = "test-org";
    process.env.SENTRY_PROJECT_SLUG = "test-project";
  });

  afterEach(() => {
    restoreEnvValue("EXPO_PUBLIC_APP_ENV", originalAppEnv);
    restoreEnvValue("EAS_BUILD_PROFILE", originalBuildProfile);
    restoreEnvValue("EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY", originalKakaoAppKey);
    restoreEnvValue("EXPO_PUBLIC_API_BASE_URL", originalApiBaseUrl);
    restoreEnvValue("GOOGLE_SERVICES_JSON", originalGoogleServicesJson);
    restoreEnvValue("SENTRY_ORG_SLUG", originalSentryOrgSlug);
    restoreEnvValue("SENTRY_PROJECT_SLUG", originalSentryProjectSlug);
    jest.resetModules();
  });

  it("기존 managed plugin을 제거하고 필요한 plugin을 추가한다", () => {
    process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY = "test-kakao-app-key";
    process.env.GOOGLE_SERVICES_JSON = "/tmp/google-services.json";
    const configFactory = loadAppConfigModule().default;

    const result = configFactory(
      createConfigContext({
        name: "safeMedi-dev",
        slug: "safeMedi-dev",
        plugins: [
          "expo-font",
          "@react-native-seoul/kakao-login",
          "expo-location",
          "expo-build-properties",
        ],
        ios: {
          infoPlist: {
            ExistingFlag: "keep",
          },
        },
        android: {
          package: "com.safemedi",
        },
      } as ExpoConfig),
    );

    expect(result.plugins?.[0]).toBe("./plugins/withIosNetworkSessionFix.js");
    expect(result.plugins?.[1]).toBe("./plugins/withIosKakaoAppDelegateFix.js");
    expect(result.plugins).toEqual(
      expect.arrayContaining([
        "expo-font",
        "./plugins/withAndroidR8Optimization.js",
        [
          "@react-native-seoul/kakao-login",
          { kakaoAppKey: "test-kakao-app-key", kotlinVersion: "2.1.20" },
        ],
        [
          "expo-build-properties",
          {
            ios: { useFrameworks: "static", forceStaticLinking: ["RNFBApp", "RNFBMessaging"] },
            android: {
              extraMavenRepos: ["https://devrepo.kakao.com/nexus/content/groups/public/"],
              enableMinifyInReleaseBuilds: true,
              enableShrinkResourcesInReleaseBuilds: true,
              extraProguardRules: expect.stringContaining(
                "-keep,allowobfuscation,allowshrinking interface retrofit2.Call",
              ),
            },
          },
        ],
        [
          "expo-location",
          {
            locationAlwaysAndWhenInUsePermission:
              "현재 위치를 기반으로 지도를 표시하기 위해 위치 접근 권한이 필요합니다.",
            locationWhenInUsePermission:
              "현재 위치를 기반으로 지도를 표시하기 위해 위치 접근 권한이 필요합니다.",
          },
        ],
      ]),
    );

    const buildPropertiesEntries =
      result.plugins?.filter((plugin) => getPluginName(plugin) === "expo-build-properties") ?? [];
    expect(buildPropertiesEntries).toHaveLength(1);
    expect(buildPropertiesEntries[0]).toEqual([
      "expo-build-properties",
      expect.objectContaining({
        android: expect.objectContaining({
          extraProguardRules: expect.stringContaining(
            "-keep @interface expo.modules.kotlin.records.Field { *; }",
          ),
        }),
      }),
    ]);

    expect(buildPropertiesEntries[0]).toEqual([
      "expo-build-properties",
      expect.objectContaining({
        android: expect.objectContaining({
          extraProguardRules: expect.stringContaining(
            "-keep class expo.modules.notifications.** { *; }",
          ),
        }),
      }),
    ]);

    expect(result.ios?.infoPlist).toEqual(
      expect.objectContaining({
        ExistingFlag: "keep",
      }),
    );
    expect(result.ios?.infoPlist).not.toHaveProperty("NSAppTransportSecurity");
    expect(result.android).toEqual(
      expect.objectContaining({
        package: "com.safemedi",
        googleServicesFile: "/tmp/google-services.json",
      }),
    );
  });

  it("name/slug가 없으면 기본값을 채운다", () => {
    process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY = "";
    const configFactory = loadAppConfigModule().default;

    const result = configFactory(
      createConfigContext({
        plugins: [],
      } as unknown as ExpoConfig),
    );

    expect(result.name).toBe("SafeMedi");
    expect(result.slug).toBe("safeMedi");
    expect(result.ios?.infoPlist).toEqual({});
    expect(result.plugins).toEqual(
      expect.arrayContaining([
        [
          "expo-location",
          {
            locationAlwaysAndWhenInUsePermission:
              "현재 위치를 기반으로 지도를 표시하기 위해 위치 접근 권한이 필요합니다.",
            locationWhenInUsePermission:
              "현재 위치를 기반으로 지도를 표시하기 위해 위치 접근 권한이 필요합니다.",
          },
        ],
      ]),
    );
  });

  it("HTTP ATS 예외를 주입하지 않는다", () => {
    process.env.EXPO_PUBLIC_API_BASE_URL = "https://api.example.com";
    const configFactory = loadAppConfigModule().default;

    const result = configFactory(
      createConfigContext({
        plugins: [],
      } as unknown as ExpoConfig),
    );

    expect(result.ios?.infoPlist).not.toHaveProperty("NSAppTransportSecurity");
    expect(result.plugins).toEqual(
      expect.arrayContaining([
        [
          "expo-build-properties",
          {
            ios: { useFrameworks: "static", forceStaticLinking: ["RNFBApp", "RNFBMessaging"] },
            android: {
              extraMavenRepos: ["https://devrepo.kakao.com/nexus/content/groups/public/"],
              enableMinifyInReleaseBuilds: true,
              enableShrinkResourcesInReleaseBuilds: true,
              extraProguardRules: expect.stringContaining(
                "-keep,allowobfuscation,allowshrinking interface retrofit2.Call",
              ),
            },
          },
        ],
      ]),
    );
  });

  it("Sentry organization/project plugin 옵션을 env 값으로 채운다", () => {
    const configFactory = loadAppConfigModule().default;

    const result = configFactory(
      createConfigContext({
        plugins: [],
      } as unknown as ExpoConfig),
    );

    expect(result.plugins).toEqual(
      expect.arrayContaining([
        [
          "@sentry/react-native/expo",
          {
            organization: "test-org",
            project: "test-project",
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
      ]),
    );
  });

  it.each([
    ["EXPO_PUBLIC_APP_ENV", "SENTRY_ORG_SLUG"],
    ["EAS_BUILD_PROFILE", "SENTRY_PROJECT_SLUG"],
  ])("운영 환경 %s에서 %s 값이 비어 있으면 설정 평가에 실패한다", (envKey, slugKey) => {
    process.env[envKey] = "production";
    process.env[slugKey] = "  ";
    expect(() => loadAppConfigModule()).toThrow("production 빌드에는");
  });

  it("환경변수 주입 전에도 SafeMedi 기본값으로 Sentry 플러그인을 구성한다", () => {
    delete process.env.SENTRY_ORG_SLUG;
    delete process.env.SENTRY_PROJECT_SLUG;

    const result = loadAppConfigModule().default(
      createConfigContext({ name: "SafeMedi", slug: "safeMedi" }),
    );

    expect(result.plugins).toContainEqual([
      "@sentry/react-native/expo",
      expect.objectContaining({ organization: "safemedi", project: "react-native" }),
    ]);
  });
});
