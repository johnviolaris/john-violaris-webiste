import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";

test("cookie policy server rendering follows configured, disabled, invalid and no-ID analytics states", () => {
  // Keep fixture module hooks isolated from the real analytics module used by
  // the consent tests when the main suite runs without test isolation.
  const output = execFileSync(process.execPath, ["--import", "./scripts/alias-hook.mjs", "--test", "scripts/verify-cookie-policy.mjs"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  assert.match(output, /pass 3/);
  assert.match(output, /fail 0/);
});
