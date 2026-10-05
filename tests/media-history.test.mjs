import assert from "node:assert/strict";
import test from "node:test";
import sharp from "sharp";
import { uploadFilename, mediaPresentation, shareImageWarning, validateImageMetadata } from "../lib/cms/media/schema.ts";
import { inspectImage } from "../lib/cms/media/inspect.ts";
import { compareRevisionSnapshots } from "../lib/cms/revisions/compare.ts";
import { validateSettingRevision, validateSectionRevision } from "../lib/cms/revisions/validation.ts";

test("upload filename choices cannot smuggle paths or overwrite an existing image", () => {
  assert.equal(uploadFilename("Old.PNG", "court-building", "site", "image/webp", "1234abcd"), "site/court-building-1234abcd.webp");
  for (const bad of ["Bad Name", "../asset", "name.jpg", "double--dash", "éclair", "-leading", "trailing-"]) assert.throws(() => uploadFilename("photo.png", bad, "posts", "image/png", "1234abcd"));
});
test("restoration applies current setting validation instead of trusting historical rows", () => {
  assert.equal(validateSettingRevision("name", "John Violaris"), null);
  assert.ok(validateSettingRevision("name", {}));
  assert.ok(validateSettingRevision("name", "x".repeat(81)));
  assert.ok(validateSettingRevision("unknown", "text"));
  assert.ok(validateSettingRevision("email", "not-an-email"));
  assert.ok(validateSettingRevision("phoneE164", "+44<script>"));
  assert.ok(validateSettingRevision("qualifiedYear", "9999"));
});
test("historical static sections must still match the current shape and required fields", () => {
  const definition = { key: "intro", fields: [{ key: "title", label: "Title", kind: "text", required: true, maxLength: 10 }, { key: "body", label: "Body", kind: "prose", required: true }] };
  assert.equal(validateSectionRevision(definition, { title: "Valid", body: ["Paragraph"] }), null);
  assert.ok(validateSectionRevision(definition, { title: "Valid", body: "Wrong shape" }));
  assert.ok(validateSectionRevision(definition, { title: "", body: [] }));
  assert.ok(validateSectionRevision(definition, { title: "Too long by far", body: ["Paragraph"] }));
});
test("non-decorative media requires alt text and decorative media renders an empty alt", () => {
  const image = { alt_text: "", is_decorative: false, title: "", caption: "" };
  assert.ok(validateImageMetadata(image));
  assert.equal(validateImageMetadata({ ...image, is_decorative: true }), null);
  assert.deepEqual(mediaPresentation({ ...image, alt_text: "ignored", is_decorative: true }), { alt: "", title: undefined, caption: undefined, captionFormat: "plain" });
  assert.equal(validateImageMetadata({ ...image, alt_text: "Court entrance", title: "A title", caption: "Credit" }), null);
});
test("share dimensions warn for either short side", () => {
  assert.equal(shareImageWarning(1200, 630), null);
  assert.ok(shareImageWarning(1199, 630)); assert.ok(shareImageWarning(1200, 629));
});
test("image upload inspection verifies actual pixels and rejects mislabeled or corrupt files", async () => {
  const png = await sharp({ create: { width: 12, height: 9, channels: 3, background: "white" } }).png().toBuffer();
  assert.deepEqual(await inspectImage(png, "image/png"), { width: 12, height: 9 });
  await assert.rejects(inspectImage(png, "image/jpeg"));
  await assert.rejects(inspectImage(Buffer.from("not an image"), "image/png"));
  await assert.rejects(inspectImage(png.subarray(0, 45), "image/png"));
});
test("version comparisons expose added, removed and nested content changes without timestamp noise", () => {
  const before = { id: "one", updated_at: "old", content: { title: "Old", body: ["Retained", "Removed"], meta: "lost" } };
  const after = { id: "two", updated_at: "new", content: { title: "New", body: ["Retained"], caption: "Added" } };
  assert.deepEqual(compareRevisionSnapshots(before, after), [
    { field: "content.body.1", before: "Removed", after: "(absent)" },
    { field: "content.caption", before: "(absent)", after: "Added" },
    { field: "content.meta", before: "lost", after: "(absent)" },
    { field: "content.title", before: "Old", after: "New" },
  ]);
});
