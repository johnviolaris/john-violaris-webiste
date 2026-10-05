import assert from "node:assert/strict";
import test from "node:test";
import { checkRenderedPage, duplicateMetadata } from "../scripts/page-quality.mjs";

const fixture = (body, head = "") => `<html lang="en-GB"><head><title>Drink Driving Solicitor</title><meta name="description" content="Advice about a drink driving charge."><link rel="canonical" href="https://johnviolaris.com/services/drink-driving">${head}</head><body><main>${body}</main></body></html>`;
const url = "https://johnviolaris.com/services/drink-driving";

test("rendered checks parse HTML, ignore script text and allow decorative image alt", () => {
  const page = checkRenderedPage(fixture('<h1>Drink driving</h1><h2 id="options">Your options</h2><img src="/portrait.webp" alt=""><script>const s="<h1>not an element</h1>";</script>'), url);
  assert.deepEqual(page.errors, []);
  assert.ok(page.ids.has("options"));
  assert.equal(page.images[0].pathname, "/portrait.webp");
});

test("rendered checks catch skipped headings, duplicate IDs and missing image alt", () => {
  const page = checkRenderedPage(fixture('<h1>Drink driving</h1><h3 id="same">Options</h3><p id="same">Duplicate</p><img src="/portrait.webp">'), url);
  assert.ok(page.errors.some((error) => error.includes("skips H1 to H3")));
  assert.ok(page.errors.some((error) => error.includes("duplicate element id")));
  assert.ok(page.errors.some((error) => error.includes("no alt attribute")));
});

test("hidden headings do not distort the visible page outline", () => {
  const page = checkRenderedPage(fixture('<h1>Drink driving</h1><div hidden><h6>Hidden panel</h6></div><h2>Advice</h2>'), url);
  assert.deepEqual(page.errors, []);
});

test("duplicate and wrong metadata fail while character counts remain advisory", () => {
  const page = checkRenderedPage(fixture('<h1>Advice</h1>', '<title>Second title</title>'), url);
  assert.ok(page.errors.some((error) => error.includes("one nonempty title")));
  const wrongCanonical = checkRenderedPage(fixture('<h1>Advice</h1>'), "https://johnviolaris.com/about");
  assert.ok(wrongCanonical.errors.some((error) => error.includes("canonical points elsewhere")));
  const longTitle = checkRenderedPage(fixture('<h1>Advice</h1>').replace("Drink Driving Solicitor", "a".repeat(80)), url);
  assert.deepEqual(longTitle.errors, []);
  assert.equal(longTitle.advisories.length, 1);
  assert.deepEqual(duplicateMetadata(new Map([["/a", { title: " Same title " }], ["/b", { title: "same TITLE" }]]), "title"), [["/b", "/a"]]);
});
