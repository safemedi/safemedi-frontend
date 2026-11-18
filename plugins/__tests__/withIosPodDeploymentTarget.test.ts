interface PodfileConfig {
  modResults: { contents: string };
}

jest.mock("@expo/config-plugins", () => ({
  withPodfile: (config: PodfileConfig, action: (value: PodfileConfig) => PodfileConfig) =>
    action(config),
}));

const withIosPodDeploymentTarget = require("../withIosPodDeploymentTarget") as (
  config: PodfileConfig,
) => PodfileConfig;

describe("iOS Pod 최소 버전 보정", () => {
  it("기존 post_install을 보존하고 재적용해도 보정을 중복 삽입하지 않는다", () => {
    const original =
      "  post_install do |installer|\n    react_native_post_install(installer)\n  end";
    const config = { modResults: { contents: original } };
    withIosPodDeploymentTarget(config);
    const patched = config.modResults.contents;

    expect(patched).toContain("react_native_post_install(installer)");
    expect(patched).toContain("Gem::Version.new('15.1')");
    expect(patched).toContain("Gem::Version.new(current_target) < minimum_target");
    withIosPodDeploymentTarget(config);
    expect(config.modResults.contents).toBe(patched);
  });

  it("삽입 위치가 없으면 잘못된 Podfile을 만들지 않고 실패한다", () => {
    expect(() =>
      withIosPodDeploymentTarget({ modResults: { contents: "target 'app' do\nend" } }),
    ).toThrow("Podfile post_install hook was not found");
  });
});
