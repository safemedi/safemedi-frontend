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
  const originalSentryOrgSlug = process.env.SENTRY_ORG_SLUG;
  const originalSentryProjectSlug = process.env.SENTRY_PROJECT_SLUG;

  beforeEach(() => {
    process.env.SENTRY_ORG_SLUG = "test-org";
    process.env.SENTRY_PROJECT_SLUG = "test-project";
  });

  afterEach(() => {
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
        [
          "@react-native-seoul/kakao-login",
          { kakaoAppKey: "test-kakao-app-key", kotlinVersion: "2.1.20" },
        ],
        [
          "expo-build-properties",
          {
            android: {
              extraMavenRepos: ["https://devrepo.kakao.com/nexus/content/groups/public/"],
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

    expect(result.name).toBe("safeMedi");
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
            android: {
              extraMavenRepos: ["https://devrepo.kakao.com/nexus/content/groups/public/"],
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
        ["@sentry/react-native/expo", { organization: "test-org", project: "test-project" }],
      ]),
    );
  });

  it("SENTRY_ORG_SLUG/SENTRY_PROJECT_SLUG가 없으면 config 평가 시 에러를 던진다", () => {
    delete process.env.SENTRY_ORG_SLUG;

    expect(() => loadAppConfigModule()).toThrow(
      "SENTRY_ORG_SLUG / SENTRY_PROJECT_SLUG 환경변수가 필요합니다",
    );
  });
});
