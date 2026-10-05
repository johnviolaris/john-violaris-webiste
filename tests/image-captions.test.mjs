import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { parseImageCaption, safeCaptionHref, validateCaption } from "../lib/cms/media/caption.ts";
import { validateImageMetadata, mediaPresentation } from "../lib/cms/media/schema.ts";
import { ImageCaption } from "../components/ui/image-caption.ts";

const render = (caption, format) => renderToStaticMarkup(createElement(ImageCaption, { caption, format }));
const metadata = { alt_text: "A court building", is_decorative: false, title: "", caption: "" };

test("legacy image captions stay literal unless formatting is explicitly selected", () => {
  const plain = "**Original** *words* [credit](https://example.com)";
  assert.equal(render(plain), plain);
  assert.equal(render(plain, "plain"), plain);
  assert.equal(render(plain, "unsupported"), plain);
  assert.equal(render("", "markdown"), "");
  assert.equal(mediaPresentation(metadata).captionFormat, "plain");
});

test("simple image captions render semantic bold, italic and safe links", () => {
  assert.equal(render("Credit: **Court** and *photographer* [source](https://example.com/photo)", "markdown"),
    'Credit: <strong>Court</strong> and <em>photographer</em> <a href="https://example.com/photo" class="underline underline-offset-2" rel="noopener noreferrer">source</a>');
  assert.equal(render("[**Useful guide**](/blog/guide)", "markdown"), '<a href="/blog/guide" class="underline underline-offset-2" rel="noopener noreferrer"><strong>Useful guide</strong></a>');
  assert.equal(validateCaption("**Credit**", "markdown"), null);
  assert.equal(mediaPresentation({ ...metadata, caption: "**Credit**", caption_format: "markdown" }).captionFormat, "markdown");
});

test("caption URLs cannot execute scripts, use protocol-relative hosts or hide credentials", () => {
  for (const bad of ["javascript:alert(1)", "JaVaScRiPt:alert", "data:text/html,test", "vbscript:evil", "//evil.example", "/\\evil.example", "https://user:password@example.com", "https://example.com/with space", "https:example.com", "https://example.com/\nscript"]) {
    assert.equal(safeCaptionHref(bad), null, bad);
    const caption = `[credit](${bad})`;
    assert.ok(validateCaption(caption, "markdown"), bad);
    assert.ok(!render(caption, "markdown").includes("<a "), bad);
  }
  for (const good of ["https://example.com", "http://example.com/photo", "/blog/guide?from=credit", "#photograph"]) assert.ok(safeCaptionHref(good));
});

test("captions escape HTML and never render image, script or nested-anchor embeds", () => {
  const rendered = render('<img src=x onerror=alert(1)> <script>alert(1)</script> ![image](https://example.com/photo.png)', "markdown");
  assert.ok(rendered.includes("&lt;img"));
  assert.ok(rendered.includes("&lt;script&gt;"));
  assert.ok(!/<(?:img|script|iframe|svg|a)\b/.test(rendered));
  assert.ok(!render("[outer [inner](https://example.com)](https://example.org)", "markdown").includes("<a "));
});

test("caption escape markers and incomplete formatting preserve visible text", () => {
  assert.equal(render("\\*literal\\* and \\[label\\]", "markdown"), "*literal* and [label]");
  assert.equal(render("Credit **incomplete and [missing](target", "markdown"), "Credit **incomplete and [missing](target");
  assert.deepEqual(parseImageCaption("Plain credit"), { nodes: [{ type: "text", text: "Plain credit" }], invalidLinks: false });
});

test("upload, metadata edits and restores share format, link and length validation", () => {
  assert.ok(validateImageMetadata({ ...metadata, caption_format: "html" }));
  assert.ok(validateImageMetadata({ ...metadata, caption: "[bad](javascript:alert)", caption_format: "markdown" }));
  assert.ok(validateImageMetadata({ ...metadata, caption: "x".repeat(1001), caption_format: "markdown" }));
  assert.equal(validateImageMetadata({ ...metadata, caption: "[literal](javascript:alert)", caption_format: "plain" }), null);
  assert.equal(validateImageMetadata({ ...metadata, caption: "**Credit** [source](https://example.com)", caption_format: "markdown" }), null);
});

test("article private previews use independently authorized central media presentation", async () => {
  const preview = await readFile(new URL("../app/preview/blog/[id]/page.tsx", import.meta.url), "utf8");
  const media = await readFile(new URL("../lib/cms/media/queries.ts", import.meta.url), "utf8");
  assert.ok(preview.includes("getMediaAssetForUrl(post.content.featuredImage)"));
  assert.ok(preview.includes("mediaPresentation(asset)"));
  assert.ok(preview.includes("featuredImageCaptionFormat: image.captionFormat"));
  assert.match(media, /export async function getMediaAssetForUrl\(url: string\) \{\s+const client = await createAuthorizedAdminClient\(\);/);
});
