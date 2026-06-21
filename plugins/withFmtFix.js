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
        console.log("[withFmtFix] Already patched.");
        return config;
      }

      const patch = `
  # withFmtFix: patch fmt for Xcode 26 c++20 consteval bug
  fmt_files = [
    File.expand_path('../Pods/fmt/include/fmt/core.h', __FILE__),
    File.expand_path('../Pods/fmt/include/fmt/format.h', __FILE__),
    File.expand_path('../Pods/fmt/include/fmt/format-inl.h', __FILE__),
    File.expand_path('../Pods/fmt/src/format.cc', __FILE__),
  ]
  fmt_files.each do |fmt_file|
    next unless File.exist?(fmt_file)
    content = File.read(fmt_file)
    next if content.include?('xcode26fix')
    new_content = "#ifndef FMT_USE_CONSTEVAL\\n#define FMT_USE_CONSTEVAL 0 // xcode26fix\\n#endif\\n" + content
    File.write(fmt_file, new_content)
    puts "[withFmtFix] Prepended FMT_USE_CONSTEVAL=0 to \#{File.basename(fmt_file)}"
  end
`;

      const patched = podfile.replace(
        /(post_install do \|installer\|)/,
        `$1\n${patch}`
      );

      if (patched === podfile) {
        console.error("[withFmtFix] Could not find post_install block!");
        return config;
      }

      fs.writeFileSync(podfilePath, patched);
      console.log("[withFmtFix] Patched Podfile.");
      return config;
    },
  ]);
};
