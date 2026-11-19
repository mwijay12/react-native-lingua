const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const path = require("node:path");
const test = require("node:test");

test("motion smoke refuses real devices and targets only the checked synthetic emulator", (t) => {
  const result = spawnSync("python3", [path.join(__dirname, "android-motion-harness.py")], { encoding: "utf8" });
  if (result.error?.code === "ENOENT") {
    t.skip("python3 is required for the Android motion-smoke harness");
    return;
  }
  assert.ifError(result.error);
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /pins its serial/);
});
