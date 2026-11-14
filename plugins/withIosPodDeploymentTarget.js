const { withPodfile } = require("@expo/config-plugins");

const MARKER = "# safeMedi: align Pod deployment targets with the app minimum";
const ANCHOR = "  post_install do |installer|";
const POD_TARGET_FIX = `
    ${MARKER}
    minimum_target = Gem::Version.new('15.1')
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |build_config|
        current_target = build_config.build_settings['IPHONEOS_DEPLOYMENT_TARGET']
        if current_target && Gem::Version.new(current_target) < minimum_target
          build_config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = minimum_target.to_s
        end
      end
    end
`;

function withIosPodDeploymentTarget(config) {
  return withPodfile(config, (config) => {
    const contents = config.modResults.contents;
    if (contents.includes(MARKER)) {
      return config;
    }
    if (!contents.includes(ANCHOR)) {
      throw new Error("[withIosPodDeploymentTarget] Podfile post_install hook was not found");
    }
    config.modResults.contents = contents.replace(ANCHOR, `${ANCHOR}\n${POD_TARGET_FIX}`);
    return config;
  });
}

module.exports = withIosPodDeploymentTarget;
