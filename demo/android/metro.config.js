const { getDefaultConfig } = require("expo/metro-config");
const { withNativewind } = require("nativewind/metro");
const path = require("path");

const config = getDefaultConfig(__dirname);
// The isolated demo reuses dependencies installed at the repository root.
const repoRoot = path.resolve(__dirname, "../..");
config.watchFolders = [repoRoot];
config.resolver.nodeModulesPaths = [path.join(repoRoot, "node_modules")];

module.exports = withNativewind(config, { input: "./global.css" });
