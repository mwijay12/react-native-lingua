// Apply our reviewed, version-specific fixes without adding a patching library.
// Never patch an unfamiliar or partially modified dependency silently.
const { createHash } = require("node:crypto");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const patch = path.resolve(__dirname, "../patches/async-storage-2.2.0.patch");
const files = {
  "android/build.gradle": [
    "826031d60840ad58b5d8fda29aa7c6f8c1906afb9aace90fd0c33870c07c8d2f",
    "5bb588f46053a6e3e4bd817d1acd76248ee2588038903cc722de91a729b38a7a",
  ],
  "android/src/main/java/com/reactnativecommunity/asyncstorage/AsyncStorageExpoMigration.java": [
    "e8c19725db04d7eb2490e01edec33b077f6b64c449a25e5eaa9487f115963b7a",
    "a1ddbddf7f20150468d5e609e7dc2ee8d49d0ad8aa88665e30f2fdb1c7b53703",
  ],
  "android/src/main/java/com/reactnativecommunity/asyncstorage/AsyncStorageModule.java": [
    "dfc723f39ada68609b75168bc0c0452d7eeeb13bb1578e1d8b948bab5d47c4e1",
    "5bcb79c125fbdd94ed10ff488ad27d5543354256949a2ce2c575992d7a50de71",
  ],
  "android/src/main/java/com/reactnativecommunity/asyncstorage/ReactDatabaseSupplier.java": [
    "532da53a2921284fdc575c582efb8d6a0bb0752364218459e81f4abf82c09d8e",
    "92394f8070dd03f6a5b6f785942f1ff6cc6a24484271795356a6e98d5efabfae",
  ],
  "ios/RNCAsyncStorage.mm": [
    "d6572b20a7e3405db4ceb43b39c28e4d2f3fef65ea7e5ffeea30e06651865c8d",
    "abf155116675f857f83821f7a52949d43efb63e78e2e5c7da9acb31c3a48b15a",
  ],
};

function digest(filename) {
  return createHash("sha256").update(fs.readFileSync(filename)).digest("hex");
}

function applySafeStoragePatch(directory) {
  const packageDirectory = fs.realpathSync(directory || path.dirname(require.resolve(
    "@react-native-async-storage/async-storage/package.json",
    { paths: [path.resolve(__dirname, "..")] },
  )));
  const manifest = JSON.parse(fs.readFileSync(path.join(packageDirectory, "package.json"), "utf8"));
  if (manifest.version !== "2.2.0") {
    throw new Error(`AsyncStorage ${manifest.version} has not been reviewed; expected 2.2.0.`);
  }

  const hashes = Object.entries(files).map(([filename, expected]) => [
    filename, digest(path.join(packageDirectory, filename)), expected,
  ]);
  if (hashes.every(([, actual, expected]) => actual === expected[1])) return false;
  if (!hashes.every(([, actual, expected]) => actual === expected[0])) {
    throw new Error("AsyncStorage source differs from both the reviewed original and patch. Reinstall the locked dependencies and review before building.");
  }

  // Do not let a parent Git checkout cause `git apply` to ignore node_modules.
  // Hash verification before and after also catches an empty or partial apply.
  const options = {
    cwd: packageDirectory,
    env: { ...process.env, GIT_CEILING_DIRECTORIES: path.dirname(packageDirectory) },
    stdio: "pipe",
  };
  execFileSync("git", ["apply", "--check", "--whitespace=nowarn", patch], options);
  execFileSync("git", ["apply", "--whitespace=nowarn", patch], options);
  for (const [filename, , expected] of hashes) {
    if (digest(path.join(packageDirectory, filename)) !== expected[1]) {
      throw new Error(`AsyncStorage patch verification failed for ${filename}.`);
    }
  }
  return true;
}

module.exports = { applySafeStoragePatch, files, patch };

if (require.main === module) {
  try {
    const changed = applySafeStoragePatch();
    console.log(changed ? "Applied the reviewed AsyncStorage safety patch." : "AsyncStorage safety patch is already applied.");
  } catch (error) {
    console.error("Could not verify or apply the AsyncStorage safety patch:", error.message);
    process.exitCode = 1;
  }
}
