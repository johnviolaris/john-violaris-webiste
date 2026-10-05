import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { parseLondonDateTime, londonInputValue, publicationStatus, isPubliclyVisible } from "../lib/cms/publication.ts";
import { imageUploadPath } from "../lib/cms/blog/image-path.ts";
import { hasConfirmedSlugChange, slugChangeConfirmation } from "../lib/cms/slug-confirmation.ts";

test("published URL changes require confirmation bound to the actual previous and new slugs", () => {
  assert.equal(hasConfirmedSlugChange("old", "new", true, null), false);
  assert.equal(hasConfirmedSlugChange("old", "new", true, "on"), false);
  assert.equal(hasConfirmedSlugChange("old", "new", true, slugChangeConfirmation("old", "new")), true);
  assert.equal(hasConfirmedSlugChange("changed-in-another-tab", "new", true, slugChangeConfirmation("old", "new")), false);
  assert.equal(hasConfirmedSlugChange("old", "other", true, slugChangeConfirmation("old", "new")), false);
  assert.equal(hasConfirmedSlugChange("old", "old", true, null), true);
  assert.equal(hasConfirmedSlugChange("old", "new", false, null), true);
});

test("UK schedules round-trip through GMT and BST regardless of server zone", () => {
  assert.deepEqual(parseLondonDateTime("2026-01-15T09:30"), { ok: true, value: "2026-01-15T09:30:00.000Z" });
  assert.deepEqual(parseLondonDateTime("2026-07-15T09:30"), { ok: true, value: "2026-07-15T08:30:00.000Z" });
  assert.equal(londonInputValue("2026-07-15T08:30:00.000Z"), "2026-07-15T09:30");
  assert.deepEqual(parseLondonDateTime(""), { ok: true, value: null });
});

test("nonexistent, repeated and malformed local dates cannot silently publish at another time", () => {
  for (const invalid of ["2026-03-29T01:30", "2026-10-25T01:30", "2026-02-30T09:00", "2026-01-15T25:00", "2026-01-15", "2026-01-15T09:30+01:00"]) {
    assert.equal(parseLondonDateTime(invalid).ok, false, invalid);
  }
});

test("start is inclusive and expiry exclusive, with drafts remaining private", () => {
  const row = { published: true, published_at: "2026-10-05T09:00:00Z", unpublish_at: "2026-10-05T10:00:00Z" };
  assert.equal(publicationStatus(row, new Date("2026-10-05T08:59:59Z")), "scheduled");
  assert.equal(isPubliclyVisible(row, new Date("2026-10-05T09:00:00Z")), true);
  assert.equal(isPubliclyVisible(row, new Date("2026-10-05T09:59:59Z")), true);
  assert.equal(publicationStatus(row, new Date("2026-10-05T10:00:00Z")), "expired");
  assert.equal(publicationStatus({ ...row, published: false }, new Date("2026-10-05T09:30:00Z")), "draft");
  assert.equal(isPubliclyVisible({ published: true, published_at: null }), true);
});

test("descriptive upload names remove paths and hostile characters and use the allowed MIME extension", () => {
  assert.equal(imageUploadPath("posts", "Drink Driving Guide.PNG", "image/webp", "abcdef12"), "posts/drink-driving-guide-abcdef12.webp");
  assert.equal(imageUploadPath("share", "../../Court's <photo>.jpg", "image/jpeg", "1234abcd"), "share/courts-photo-1234abcd.jpg");
  assert.equal(imageUploadPath("site", ".png", "image/png", "1234abcd"), "site/image-1234abcd.png");
  assert.throws(() => imageUploadPath("../private", "x.png", "image/png", "1234abcd"));
  assert.throws(() => imageUploadPath("posts", "x.svg", "image/svg+xml", "1234abcd"));
  assert.throws(() => imageUploadPath("posts", "x.png", "image/png", "../bad"));
});

test("draft preview is private, independently authorized, and separated from public structured data", async () => {
  const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
  const [layout, blog, service, revisions, restores, location] = await Promise.all([
    read("app/preview/layout.tsx"), read("app/preview/blog/[id]/page.tsx"),
    read("app/preview/services/[id]/page.tsx"), read("lib/cms/revisions/queries.ts"),
    read("lib/cms/revisions/actions.ts"), read("app/preview/locations/[id]/page.tsx"),
  ]);
  assert.match(layout, /await requireAdmin\(\)/);
  assert.match(layout, /dynamic = "force-dynamic"/);
  assert.match(layout, /index: false/);
  assert.match(blog, /await getBlogPost\(id\)/);
  assert.match(service, /await getService\(id\)/);
  assert.match(location, /await getLocationPageAdmin\(id\)/);
  assert.match(revisions, /await createAuthorizedAdminClient\(\)/);
  assert.match(restores, /await createAuthorizedAdminClient\(\)/);
  assert.doesNotMatch(restores, /service_role|SUPABASE_SECRET/);
  assert.equal((restores.match(/published: false/g) ?? []).length, 4);
});

test("scheduled lists, detail and sitemap have a deliberate bounded revalidation policy", async () => {
  for (const path of ["app/(site)/blog/page.tsx", "app/(site)/blog/[slug]/page.tsx", "app/sitemap.ts"]) {
    const contents = await readFile(new URL(`../${path}`, import.meta.url), "utf8");
    assert.match(contents, /export const revalidate = 60/);
  }
});
