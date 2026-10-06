import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import test from "node:test";
import { blockUnverifiedBackend, parseLocationAcceptanceOptions } from "../scripts/lib/location-acceptance.mjs";

const isolatedUrl = "https://abcdefghijklmnopqrst.supabase.co";
const backend = { mode: "backend", envFile: "private-fixture.env", supabaseUrl: isolatedUrl, appUrl: "http://127.0.0.1:3999" };
const env = { NEXT_PUBLIC_SUPABASE_URL: isolatedUrl, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_fixture_public_123456789", SUPABASE_SECRET_KEY: "sb_secret_fixture_secret_123456789", ENQUIRY_IP_SALT: "separate_fixture_salt_0123456789abcdef" };

test("location acceptance modes require an explicit scope and reject token/backend options in fixtures", () => {
  assert.deepEqual(parseLocationAcceptanceOptions(["--mode", "fixtures"]), { mode: "fixtures" });
  for (const args of [[], ["--mode", "production"], ["--mode", "fixtures", "--app-url", "http://localhost:3999"], ["--mode", "backend"], ["--mode", "fixtures", "--token", "private-token"], ["--mode", "fixtures", "--mode", "backend"]]) assert.throws(() => parseLocationAcceptanceOptions(args));
});

test("offline preflight cannot enable backend writes even with valid-looking isolated credentials", () => {
  const result = blockUnverifiedBackend(backend, env);
  assert.equal(result.ok, false); assert.equal(result.code, "BACKEND_ACCEPTANCE_UNAVAILABLE");
  assert.match(result.errors[0], /server-side backend identity/);
  assert.equal(blockUnverifiedBackend({ ...backend, supabaseUrl: "https://mxvdjkuejumskbpessgo.supabase.co" }, { ...env, NEXT_PUBLIC_SUPABASE_URL: "https://mxvdjkuejumskbpessgo.supabase.co" }).code, "STAGING_PREFLIGHT_FAILED");
  for (const appUrl of ["https://johnviolaris.com", "https://johnviolaris.com.", "https://www.drivingjustice.co.uk", "https://user:private-secret@staging.fixture.test", "http://staging.fixture.test", "https://staging.fixture.test?token=private-secret"]) assert.equal(blockUnverifiedBackend({ ...backend, appUrl }, env).code, "APP_TARGET_REJECTED");
});

test("backend CLI exits blocked without network/token/write acceptance or secret output", () => {
  const directory = mkdtempSync(join(tmpdir(), "location-acceptance-"));
  try {
    const file = join(directory, "isolated.env");
    writeFileSync(file, Object.entries(env).map(([key, value]) => `${key}=${value}`).join("\n"));
    const result = spawnSync(process.execPath, ["scripts/verify-location-acceptance.mjs", "--mode", "backend", "--env-file", file, "--supabase-url", isolatedUrl, "--app-url", backend.appUrl], { encoding: "utf8", timeout: 10000 });
    assert.equal(result.status, 1);
    const report = JSON.parse(result.stderr.trim());
    assert.equal(report.completed, false); assert.equal(report.code, "BACKEND_ACCEPTANCE_UNAVAILABLE");
    assert.equal(report.networkCalls, 0); assert.equal(report.hostedWrites, 0); assert.equal(report.tokensSubmitted, 0);
    assert.equal(`${result.stdout}${result.stderr}`.includes(env.SUPABASE_SECRET_KEY), false);
  } finally {
    const target = resolve(directory);
    assert.equal(dirname(target), resolve(tmpdir()));
    assert.ok(basename(target).startsWith("location-acceptance-"));
    rmSync(target, { recursive: true, force: true });
  }
});

test("actual location workflow modules pass only locally, with network guards and explicit evidence limits", () => {
  const result = spawnSync(process.execPath, ["scripts/verify-location-acceptance.mjs", "--mode", "fixtures"], { encoding: "utf8", timeout: 30000 });
  assert.equal(result.status, 0, result.stderr);
  const report = JSON.parse(result.stdout.trim());
  assert.equal(report.completed, true); assert.equal(report.mode, "fixtures");
  assert.equal(report.networkCalls, 0); assert.equal(report.applicationNetworkAttempts, 0); assert.ok(report.networkGuardProbes >= 11);
  assert.equal(report.hostedWrites, 0); assert.equal(report.actualBackendAcceptance, "not run");
  for (const scenario of ["draft save", "private preview", "history restore as draft", "London scheduling", "scheduled hidden", "start boundary visible", "end boundary hidden", "withdrawal", "owned fixture cleanup"]) assert.ok(report.scenarios.includes(scenario));
  assert.ok(report.limitations.some((value) => value.includes("filtering are simulated")));
});
