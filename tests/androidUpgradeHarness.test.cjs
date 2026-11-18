const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const path = require("node:path");
const test = require("node:test");

test("Android upgrade scenario accepts historical and P0 baselines without clearing after upgrade", () => {
  const result = spawnSync("python3", [path.join(__dirname, "android-upgrade-harness.py")], {
    encoding: "utf8",
    env: { ...process.env, PYTHONDONTWRITEBYTECODE: "1" },
  });
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /Upgrade orchestration passed/);
});
