const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

module.exports = function withFmtFix(config) {
  return withDangerousMod(config, [
    "ios",
    async (config) => {
      const podfilePath = path.join(
        config.modRequest.platformProjectRoot,
        "Podfile"
      );
      let podfile = fs.readFileSync(podfilePath, "utf8");

      if (podfile.includes("FMT_USE_CONSTEVAL")) {
        console.log("[withFmtFix] Already patched, skipping.");
        return config;
      }

      const fmtPatch = `
  # Fix fmt consteval error with Xcode 26
  installer.pods_project.targets.each do |target|
    if target.name == 'fmt'
      target.build_configurations.each do |build_config|
        build_config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] ||= ['$(inherited)']
        build_config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] << 'FMT_USE_CONSTEVAL=0'
        build_config.build_settings['CLANG_CXX_LANGUAGE_STANDARD'] = 'c++17'
      end
    end
  end
`;

      // Find the FIRST post_install line and insert our patch right after it
      const patched = podfile.replace(
        /(post_install do \|installer\|)/,
        `$1\n${fmtPatch}`
      );

      if (patched === podfile) {
        console.error("[withFmtFix] Could not find post_install block!");
        return config;
      }

      fs.writeFileSync(podfilePath, patched);
      console.log("[withFmtFix] Successfully injected fmt fix into existing post_install block.");
      return config;
    },
  ]);
};
