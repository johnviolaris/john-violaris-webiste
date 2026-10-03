import assert from "node:assert/strict";
import test from "node:test";

import nextConfig from "../next.config.ts";

test("every application route receives the hardened response headers", async () => {
  const rules = await nextConfig.headers();
  const globalRule = rules.find((rule) => rule.source === "/:path*");

  assert.ok(globalRule, "a global header rule must exist");

  const headers = new Map(
    globalRule.headers.map(({ key, value }) => [key.toLowerCase(), value]),
  );

  for (const name of [
    "content-security-policy",
    "referrer-policy",
    "x-content-type-options",
    "x-frame-options",
    "permissions-policy",
    "strict-transport-security",
  ]) {
    assert.ok(headers.has(name), `${name} must be present in production config`);
  }

  const csp = headers.get("content-security-policy");
  assert.ok(csp);
  assert.doesNotMatch(csp, /[\r\n]/, "CSP must be safe for an HTTP header");

  for (const directive of [
    "default-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "https://www.googletagmanager.com",
    "https://www.reviewsolicitors.co.uk",
  ]) {
    assert.match(csp, new RegExp(directive.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("private routes explicitly opt out of shared caching", async () => {
  const rules = await nextConfig.headers();

  for (const source of ["/admin/:path*", "/auth/:path*"]) {
    const rule = rules.find((candidate) => candidate.source === source);
    assert.ok(rule, `${source} must have a private cache rule`);
    assert.deepEqual(rule.headers, [
      { key: "Cache-Control", value: "private, no-store" },
    ]);
  }
});
