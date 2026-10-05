import assert from "node:assert/strict";
import test from "node:test";
import { validateCustomJsonLd } from "../lib/cms/seo/custom-json-ld.ts";
import { analyseSeoHealth, internalLinkPaths } from "../lib/cms/seo/health.ts";
import { graph, serializeJsonLd } from "../lib/cms/seo/json-ld.ts";
import { resolveMetadata } from "../lib/cms/seo/resolve.ts";
import { emptySeoValues, seoValuesFrom, validateSeoLengths } from "../lib/cms/seo/schema.ts";

const siteUrl = "https://johnviolaris.com";
const path = "/services/speeding";
const defaults = { title: "Speeding Solicitor", description: "Advice about a speeding charge." };

test("X overrides are independent and blank fields inherit complete Open Graph metadata", () => {
  const fallback = { url: "/share-image", alt: "John Violaris", width: 1200, height: 630 };
  const plain = resolveMetadata(path, defaults, { ogTitle: "Shared title" }, "John Violaris", fallback);
  assert.equal(plain.twitter.title, "Shared title");
  assert.equal(plain.twitter.description, defaults.description);
  assert.deepEqual(plain.twitter.images, [fallback]);
  const custom = resolveMetadata(path, defaults, { twitterTitle: "X title", twitterDescription: "X copy", twitterImage: "/x.png", twitterImageAlt: "X card", twitterCard: "summary" }, "John Violaris", fallback);
  assert.equal(custom.twitter.title, "X title");
  assert.equal(custom.openGraph.title, "Speeding Solicitor | John Violaris");
  assert.equal(custom.twitter.card, "summary");
  assert.deepEqual(custom.twitter.images, [{ url: "/x.png", alt: "X card" }]);
});

test("custom JSON-LD accepts object, array and @graph forms and preserves automatic references", () => {
  const node = { "@context": "https://schema.org", "@type": "CreativeWork", "@id": "#guide", name: "A guide", author: { "@id": `${siteUrl}/#john` } };
  for (const data of [node, [node], { "@context": "https://schema.org", "@graph": [node] }]) {
    const result = validateCustomJsonLd(JSON.stringify(data), path, siteUrl);
    assert.equal(result.ok, true);
    assert.equal(result.nodes[0]["@context"], undefined);
    assert.equal(result.nodes[0]["@id"], `${siteUrl}${path}#guide`);
    assert.deepEqual(result.nodes[0].author, { "@id": `${siteUrl}/#john` });
  }
});

test("custom schema rejects syntax errors, unsupported contexts, untyped nodes and invalid IDs", () => {
  for (const data of ["{bad json", "5", "[]", '{"@context":"https://other.example","@type":"Service"}', '{"name":"Untyped"}', '{"@type":"Service","provider":{"@id":"https://"}}', '{"@type":"Service","provider":{"@context":"https://schema.org"}}']) {
    assert.equal(validateCustomJsonLd(data, path, siteUrl).ok, false, data);
  }
  assert.equal(validateCustomJsonLd({ "@type": "Thing" }, path, siteUrl).ok, false);
});

test("custom schema cannot redefine automatic nodes or reuse custom definition IDs", () => {
  for (const id of [`${siteUrl}/#john`, `${siteUrl}${path}#webpage`, "#service", "#breadcrumb"]) {
    assert.equal(validateCustomJsonLd(JSON.stringify({ "@type": "Thing", "@id": id }), path, siteUrl).ok, false, id);
  }
  assert.equal(validateCustomJsonLd(JSON.stringify([{ "@type": "Thing", "@id": "#extra" }, { "@type": "Thing", "@id": "#extra" }]), path, siteUrl).ok, false);
});

test("custom schema rejects HTML, excessive nesting and outcome promises", () => {
  for (const name of ["</script><script>alert(1)</script>", "Guaranteed success", "Disqualification avoided entirely"]) {
    assert.equal(validateCustomJsonLd(JSON.stringify({ "@type": "Service", name }), path, siteUrl).ok, false);
  }
  let nested = { "@type": "Thing" };
  for (let i = 0; i < 20; i++) nested = { "@type": "Thing", about: nested };
  assert.equal(validateCustomJsonLd(JSON.stringify(nested), path, siteUrl).ok, false);
  assert.equal(validateCustomJsonLd(" ".repeat(20_001) + "{}", path, siteUrl).ok, false);
});

test("JSON-LD serialization cannot terminate a script even for generated content", () => {
  const encoded = serializeJsonLd(graph([{ "@type": "Thing", name: "</script>" }]));
  assert.equal(encoded.includes("</script>"), false);
  assert.equal(JSON.parse(encoded)["@graph"][0].name, "</script>");
});

test("SEO field model round trips new overrides and rejects long input without truncation", () => {
  const values = seoValuesFrom({ twitterTitle: "Hello", twitterCard: "summary", customJsonLd: '{"@type":"Thing"}' });
  assert.equal(values.twitterTitle, "Hello");
  assert.equal(values.twitterCard, "summary");
  assert.equal(values.customJsonLd, '{"@type":"Thing"}');
  const long = { ...emptySeoValues, title: "a".repeat(71), description: "b".repeat(161) };
  assert.match(validateSeoLengths(long).title, /70/);
  assert.match(validateSeoLengths(long).description, /160/);
  assert.equal(long.title.length, 71);
  assert.equal(long.description.length, 161);
});

test("health checks resolved metadata, duplicate copy and noindex exclusions", () => {
  const routes = [{ path: "/one", label: "One", defaults }, { path: "/two", label: "Two", defaults }, { path: "/hidden", label: "Hidden", defaults }];
  const issues = analyseSeoHealth({ routes, overrides: { "/hidden": { noIndex: true } }, siteName: "John Violaris", siteUrl });
  assert.equal(issues.filter((issue) => issue.code === "duplicate-title").length, 2);
  assert.equal(issues.filter((issue) => issue.code === "duplicate-description").length, 2);
  assert.equal(issues.filter((issue) => issue.path === "/hidden" && issue.code.startsWith("duplicate")).length, 0);
  assert.equal(issues.filter((issue) => issue.code === "noindex").length, 1);
});

test("health flags links to unpublished content, image alt, invalid schema and outcome wording", () => {
  const issues = analyseSeoHealth({ routes: [{ path, label: "Speeding", defaults }], overrides: { [path]: { customJsonLd: "bad json", canonical: "/gone" } }, contents: [{ path, content: { relatedService: "withdrawn", ctaHref: "/contact", featuredImage: "/image.jpg", heading: "No ban if accepted" } }], siteName: "John Violaris", siteUrl });
  for (const code of ["custom-schema", "canonical-target", "broken-internal-link", "content-image-alt", "outcome-wording"]) assert.ok(issues.some((issue) => issue.code === code), code);
});

test("content link checks ignore external links, assets and same-page anchors", () => {
  const links = internalLinkPaths({ href: "https://example.com/away", nested: [{ href: `${siteUrl}/contact?source=guide#form` }, { href: "#questions" }, { href: "/photo.jpg" }], relatedService: "speeding" }, siteUrl);
  assert.deepEqual(links.sort(), ["/contact", "/services/speeding"]);
  assert.deepEqual(internalLinkPaths({ relatedService: "/services/speeding" }, siteUrl), ["/services/speeding"]);
});
