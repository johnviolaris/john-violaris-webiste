import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const proxySource = await readFile(new URL("../proxy.ts", import.meta.url), "utf8");

test("all exact production aliases remain in the canonical redirect set", () => {
  for (const aliasExpression of [
    "`www.${canonicalHost}`",
    "secondaryHost",
    "`www.${secondaryHost}`",
  ]) {
    assert.ok(
      proxySource.includes(aliasExpression),
      `${aliasExpression} must remain a canonical alias`,
    );
  }
});

test("canonical and lowercase redirects happen before session refresh", () => {
  const redirectCheck = proxySource.indexOf("canonicalAliases.has(host)");
  const lowercaseCheck = proxySource.indexOf("pathname !== lowercasePathname");
  const sessionRefresh = proxySource.indexOf("await updateSession(request)");

  assert.ok(redirectCheck !== -1 && redirectCheck < sessionRefresh);
  assert.ok(lowercaseCheck !== -1 && lowercaseCheck < sessionRefresh);
  assert.match(proxySource, /NextResponse\.redirect\(destination, 308\)/);
});

test("canonical redirects strip an inbound development or proxy port", () => {
  const canonicalBranch = proxySource.slice(
    proxySource.indexOf("if (canonicalAliases.has(host))"),
    proxySource.indexOf("destination.pathname = lowercasePathname"),
  );

  assert.match(canonicalBranch, /destination\.host = canonicalHost/);
  assert.match(canonicalBranch, /destination\.port = ""/);
});

