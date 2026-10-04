import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { safeNextPath } from "../lib/auth-redirect.ts";

const root = new URL("../", import.meta.url);
const source = (path) => readFile(new URL(path, root), "utf8");

test("a verified reset link only continues to a plain path on this site", () => {
  const fallback = "/auth/update-password";

  for (const allowed of ["/auth/update-password", "/admin", "/admin/enquiries", "/"]) {
    assert.equal(safeNextPath(allowed, fallback), allowed);
  }

  for (const refused of [
    null,
    undefined,
    "",
    "admin",
    "https://evil.example/",
    "//evil.example/",
    "/\\evil.example",
    "/\t/evil.example",
    "/%2F%2Fevil.example",
    "/admin?next=https://evil.example",
    "/admin#top",
    "javascript:alert(1)",
    "/auth/update-password\n",
  ]) {
    assert.equal(safeNextPath(refused, fallback), fallback, String(refused));
  }
});

test("the next-path check runs in linear time on hostile input", () => {
  const started = performance.now();

  safeNextPath(`/${"a/".repeat(50_000)}!`, "/");
  safeNextPath(`/${"a".repeat(100_000)}!`, "/");

  assert.ok(performance.now() - started < 200, "safeNextPath must not backtrack");
});

test("a reset request answers the same whether or not the account exists", async () => {
  const actions = await source("app/auth/actions.ts");
  const start = actions.indexOf("export async function requestPasswordReset");
  const end = actions.indexOf("export async function updatePassword");
  const body = actions.slice(start, end);

  assert.ok(start !== -1 && end > start, "requestPasswordReset must exist");
  // One refusal for a malformed address, decided before Supabase is asked,
  // and one answer for everything after it.
  assert.deepEqual(body.match(/return \{[^}]*\}/g), [
    'return { status: "invalid", email }',
    'return { status: "sent", email }',
  ]);
  assert.match(body, /resetPasswordForEmail\(/);
});

test("the confirm route accepts only recovery links and sanitises next", async () => {
  const route = await source("app/auth/confirm/route.ts");

  assert.match(route, /const recoveryTypes: EmailOtpType\[\] = \["recovery"\];/);
  assert.match(route, /safeNextPath\(searchParams\.get\("next"\)/);
  assert.doesNotMatch(route, /redirect\(searchParams/);
});
