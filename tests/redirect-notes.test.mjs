import assert from "node:assert/strict";
import test from "node:test";
import { validateRedirectNote, maxRedirectNoteLength } from "../lib/cms/redirect-notes.ts";

test("internal redirect notes preserve plain text while normalizing ordinary line breaks", () => {
  assert.deepEqual(validateRedirectNote("  Merged old guide.\r\nReviewed the destination.\rNext review: autumn.\t  "), { ok: true, notes: "Merged old guide.\nReviewed the destination.\nNext review: autumn." });
  assert.deepEqual(validateRedirectNote("<script>literal text</script>"), { ok: true, notes: "<script>literal text</script>" });
  assert.deepEqual(validateRedirectNote("  \n\t "), { ok: true, notes: "" });
});

test("redirect notes reject oversized, non-text and hidden control payloads without truncating", () => {
  assert.deepEqual(validateRedirectNote("x".repeat(maxRedirectNoteLength)), { ok: true, notes: "x".repeat(maxRedirectNoteLength) });
  assert.equal(validateRedirectNote("x".repeat(maxRedirectNoteLength + 1)).ok, false);
  for (const value of [null, undefined, {}, 42, false]) assert.equal(validateRedirectNote(value).ok, false);
  for (const value of ["A\u0000B", "A\u0007B", "A\u000bB", "A\u001fB", "A\u007fB", "\u000bTrimmed?", "\u000c"]) assert.equal(validateRedirectNote(value).ok, false);
  assert.deepEqual(validateRedirectNote("A\tB\nC"), { ok: true, notes: "A\tB\nC" });
});

test("a missing legacy form field rejects while an explicitly submitted empty note clears it", () => {
  const form = new FormData();
  const missing = validateRedirectNote(form.get("notes"));
  assert.equal(missing.ok, false);
  assert.match(missing.error, /Reload the page/);
  form.set("notes", "");
  assert.deepEqual(validateRedirectNote(form.get("notes")), { ok: true, notes: "" });
});
