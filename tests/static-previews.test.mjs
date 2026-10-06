import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";

test("static preview, restore, publication and read-only Contact use the actual application modules", () => {
  // Isolate fixture hooks from the main suite's production module imports.
  const output = execFileSync(process.execPath, ["--import", "./scripts/alias-hook.mjs", "--test", "scripts/verify-static-previews.mjs"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  assert.match(output, /pass 9/);
  assert.match(output, /fail 0/);
});
