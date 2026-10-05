import assert from "node:assert/strict";
import test from "node:test";
import { isPublicRedirectPath, isSameSitePath, resolveRedirectTarget } from "../lib/cms/redirect-rules.ts";

test("redirect paths reject external destinations, encoded escapes and protected routes", () => {
  for (const path of ["https://evil.example", "//evil.example", "/%2f%2fevil.example", "/%252fevil", "/a/../b", "/a?next=evil", "/a#b", "/a\\b", "/a\nlocation:evil", "/admin", "/%61dmin", "/pr%65view", "/bad%escape", "/auth/reset-password", "/preview/blog/draft", "/api/enquiries", "/_next/x", "/file.pdf"]) {
    assert.equal(isPublicRedirectPath(path), false, path);
  }
  for (const path of ["/", "/services/drink-driving", "/old/nested-page"]) assert.equal(isPublicRedirectPath(path), true, path);
  assert.equal(isSameSitePath("/a".repeat(300)), false);
});

const row = (source_path, destination_path, active = true) => ({ source_path, destination_path, active, permanent: true, source_kind: "manual" });
test("redirect resolution flattens chains and rejects direct, indirect and legacy cycles", () => {
  assert.equal(resolveRedirectTarget("/old", "/middle", [row("/middle", "/new")]), "/new");
  assert.equal(resolveRedirectTarget("/old", "/old", []), null);
  assert.equal(resolveRedirectTarget("/old", "/middle", [row("/middle", "/old")]), null);
  assert.equal(resolveRedirectTarget("/old", "/a", [row("/a", "/b"), row("/b", "/a")]), null);
  assert.equal(resolveRedirectTarget("/old", "/middle", [row("/middle", "/new", false)]), "/middle");
});
