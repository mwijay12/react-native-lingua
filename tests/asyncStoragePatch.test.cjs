const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { applySafeStoragePatch, files, patch } = require("../scripts/harden-async-storage.cjs");

const packageDirectory = path.dirname(require.resolve("@react-native-async-storage/async-storage/package.json"));
// Like npm postinstall/Expo prebuild, this also handles installs made with
// --ignore-scripts. The tests below mutate only temporary dependency copies.
applySafeStoragePatch();

function fixture() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "lingua-storage-patch-"));
  fs.writeFileSync(path.join(directory, "package.json"), JSON.stringify({ version: "2.2.0" }));
  for (const filename of Object.keys(files)) {
    const destination = path.join(directory, filename);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(path.join(packageDirectory, filename), destination);
  }
  return directory;
}

function restoreOriginal(directory) {
  execFileSync("git", ["apply", "--reverse", "--whitespace=nowarn", patch], {
    cwd: directory,
    env: { ...process.env, GIT_CEILING_DIRECTORIES: path.dirname(directory) },
  });
}

test("reviewed native patch applies to the locked package and is idempotent", () => {
  const directory = fixture();
  try {
    restoreOriginal(directory);
    assert.equal(applySafeStoragePatch(directory), true);
    assert.equal(applySafeStoragePatch(directory), false);
    for (const filename of Object.keys(files)) {
      assert.deepEqual(fs.readFileSync(path.join(directory, filename)), fs.readFileSync(path.join(packageDirectory, filename)));
    }
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test("unknown, tampered and partially patched versions fail without modifying the fixture", () => {
  for (const type of ["version", "tampered", "partial"]) {
    const directory = fixture();
    try {
      if (type !== "partial") restoreOriginal(directory);
      if (type === "version") fs.writeFileSync(path.join(directory, "package.json"), JSON.stringify({ version: "2.2.1" }));
      if (type === "tampered") fs.appendFileSync(path.join(directory, "ios/RNCAsyncStorage.mm"), "\n// unexpected\n");
      if (type === "partial") {
        // Revert one file only, leaving a mixture of known old and new files.
        const original = fixture();
        try {
          restoreOriginal(original);
          fs.copyFileSync(path.join(original, "android/build.gradle"), path.join(directory, "android/build.gradle"));
        } finally {
          fs.rmSync(original, { recursive: true, force: true });
        }
      }
      const before = Object.fromEntries(Object.keys(files).map((filename) => [filename, fs.readFileSync(path.join(directory, filename))]));
      assert.throws(() => applySafeStoragePatch(directory), /has not been reviewed|differs from both/);
      for (const [filename, contents] of Object.entries(before)) {
        assert.deepEqual(fs.readFileSync(path.join(directory, filename)), contents);
      }
    } finally {
      fs.rmSync(directory, { recursive: true, force: true });
    }
  }
});
