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

      if (podfile.includes("withFmtFix")) {
        console.log("[withFmtFix] Already patched, skipping.");
        return config;
      }

      const fmtPatch = `
  # withFmtFix: Patch fmt source for Xcode 26 compatibility
  fmt_core = File.join(__dir__, 'Pods/fmt/include/fmt/core.h')
  if File.exist?(fmt_core)
    content = File.read(fmt_core)
    unless content.include?('FMT_USE_CONSTEVAL 0 // patched')
      patched = content.sub(
        /#ifndef FMT_USE_CONSTEVAL/,
        "#define FMT_USE_CONSTEVAL 0 // patched\\n#ifndef FMT_USE_CONSTEVAL"
      )
      File.write(fmt_core, patched)
      puts '[withFmtFix] Patched Pods/fmt/include/fmt/core.h'
    end
  end
`;

      const patched = podfile.replace(
        /(post_install do \|installer\|)/,
        `$1\n${fmtPatch}`
      );

      if (patched === podfile) {
        console.error("[withFmtFix] Could not find post_install block!");
        return config;
      }

      fs.writeFileSync(podfilePath, patched);
      console.log("[withFmtFix] Successfully injected fmt source patch into post_install.");
      return config;
    },
  ]);
};
