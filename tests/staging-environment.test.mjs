import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { checkStagingEnvironment, productionProjectRef } from "../scripts/lib/staging-environment.mjs";

const stagingRef = "abcdefghijklmnopqrst";
const url = `https://${stagingRef}.supabase.co`;
const jwt = (role, ref) => `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify({ role, ref })).toString("base64url")}.dummy`;
const config = () => ({
  NEXT_PUBLIC_SUPABASE_URL: url,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: jwt("anon", stagingRef),
  SUPABASE_SECRET_KEY: jwt("service_role", stagingRef),
  ENQUIRY_IP_SALT: "test_fixture_separate_salt_0123456789",
});

test("staging preflight accepts selected separate backends, including loopback", () => {
  assert.equal(checkStagingEnvironment(config(), `${url}/`).ok, true);
  const local = { ...config(), NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: jwt("anon", "supabase-demo"), SUPABASE_SECRET_KEY: jwt("service_role", "supabase-demo") };
  assert.equal(checkStagingEnvironment(local, "http://127.0.0.1:54321").ok, true);
  assert.equal(checkStagingEnvironment({ ...config(), NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test_fixture_12345", SUPABASE_SECRET_KEY: "sb_secret_test_fixture_123456789" }, url).ok, true);
});

test("production references, mixed credentials and a mismatched backend fail closed", () => {
  assert.equal(checkStagingEnvironment({ ...config(), NEXT_PUBLIC_SUPABASE_URL: `https://${productionProjectRef}.supabase.co` }, `https://${productionProjectRef}.supabase.co`).ok, false);
  for (const key of ["NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "SUPABASE_SECRET_KEY"]) {
    assert.equal(checkStagingEnvironment({ ...config(), [key]: jwt(key.startsWith("NEXT") ? "anon" : "service_role", productionProjectRef) }, url).ok, false);
  }
  assert.equal(checkStagingEnvironment(config(), "https://zyxwvutsrqponmlkjihg.supabase.co").ok, false);
  assert.equal(checkStagingEnvironment({ ...config(), SUPABASE_SECRET_KEY: jwt("anon", stagingRef) }, url).ok, false);
  assert.equal(checkStagingEnvironment({ ...config(), SUPABASE_SECRET_KEY: jwt("service_role", "zyxwvutsrqponmlkjihg") }, url).ok, false);
});

test("unsafe endpoints, active outbound services and missing salt are rejected without echoing secrets", () => {
  for (const unsafe of ["http://example.com", `${url}/rest/v1`, `${url}?api_key=private-secret`, "https://user:private-secret@abcdefghijklmnopqrst.supabase.co", "http://127.0.0.1.evil.example:54321"]) {
    const result = checkStagingEnvironment({ ...config(), NEXT_PUBLIC_SUPABASE_URL: unsafe }, url);
    assert.equal(result.ok, false);
    assert.equal(JSON.stringify(result).includes("private-secret"), false);
  }
  for (const extra of [{ RESEND_API_KEY: "re_private-secret" }, { NEXT_PUBLIC_GA_MEASUREMENT_ID: "G-PRODUCTION" }, { ENQUIRY_IP_SALT: "" }, { SUPABASE_SECRET_KEY: "eyJ.bad.jwt" }]) {
    assert.equal(checkStagingEnvironment({ ...config(), ...extra }, url).ok, false);
  }
});

test("CLI does not fill missing staging credentials from a developer's production environment", () => {
  const directory = mkdtempSync(join(tmpdir(), "john-staging-preflight-"));
  try {
    const file = join(directory, "staging.env");
    writeFileSync(file, `NEXT_PUBLIC_SUPABASE_URL=${url}\nENQUIRY_IP_SALT=test_fixture_separate_salt_0123456789\n`);
    const result = spawnSync(process.execPath, ["scripts/staging-preflight.mjs", "--env-file", file, "--supabase-url", url], { encoding: "utf8", env: { ...process.env, ...config(), SUPABASE_SECRET_KEY: "sb_secret_private-secret-do-not-print", RESEND_API_KEY: "re_private-secret" } });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /SUPABASE_SECRET_KEY needs a key/);
    assert.equal(`${result.stdout}${result.stderr}`.includes("private-secret"), false);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
