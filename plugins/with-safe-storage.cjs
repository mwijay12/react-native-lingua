// Expo prebuild must verify the patch even when npm was run with
// --ignore-scripts, as in the reproducible Android demo build.
const { applySafeStoragePatch } = require("../scripts/harden-async-storage.cjs");

module.exports = function withSafeStorage(config) {
  applySafeStoragePatch();
  return config;
};
