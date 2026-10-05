import assert from "node:assert/strict";
import test from "node:test";
import { crawlFile, crawlPreview, defaultCrawlSettings, isCrawlBlocked, noIndexCrawlConflicts, parseCrawlSettings, resolvedCrawlSettings, validateCrawlSettings } from "../lib/cms/seo/robots.ts";
import { automaticSchemaIds, validateSchemaNodes } from "../lib/cms/seo/schema-validation.ts";
import { publicationSeoWarnings } from "../lib/cms/seo/publication-warnings.ts";
import { blogPostingNode, breadcrumbNode, siteNodes, webPageNode } from "../lib/cms/seo/json-ld.ts";
import { resolveMetadata } from "../lib/cms/seo/resolve.ts";
import { resolveSiteConfig } from "../lib/site-config.ts";
import { validateSeoContent } from "../lib/cms/seo/content-validation.ts";

const siteUrl = "https://johnviolaris.com";

test("default crawl rules allow public pages, protect private routes and retain canonical sitemap", () => {
  for (const path of ["/", "/services/speeding", "/blog/a-guide"]) assert.equal(isCrawlBlocked(path, defaultCrawlSettings), false);
  for (const path of ["/admin/seo-metadata", "/auth", "/api/enquiries", "/preview/blog/private"]) assert.equal(isCrawlBlocked(path, defaultCrawlSettings), true);
  const output = crawlFile(defaultCrawlSettings, siteUrl);
  assert.equal(output.sitemap, `${siteUrl}/sitemap.xml`);
  assert.match(crawlPreview(defaultCrawlSettings, siteUrl), /Disallow: \/preview/);
  assert.deepEqual(resolvedCrawlSettings({ rules: "bad legacy value" }), defaultCrawlSettings);
});

test("crawler rules apply longest path matches, explicit Allow exceptions and end anchors", () => {
  const checked = validateCrawlSettings({ rules: [
    { userAgent: "*", allow: ["/", "/blog/approved"], disallow: ["/blog/*", "/contact$"] },
    { userAgent: "Googlebot", allow: ["/"], disallow: ["/archive"] },
  ] });
  assert.equal(checked.ok, true);
  assert.equal(isCrawlBlocked("/blog/private", checked.settings), true);
  assert.equal(isCrawlBlocked("/blog/approved", checked.settings), false);
  assert.equal(isCrawlBlocked("/contact", checked.settings), true);
  assert.equal(isCrawlBlocked("/contact/other", checked.settings), false);
  assert.equal(isCrawlBlocked("/blog/private", checked.settings, "googlebot"), false);
  assert.equal(isCrawlBlocked("/archive", checked.settings, "Googlebot"), true);
});

test("crawl-rule validation rejects directive injection, private Allows and ambiguous crawler defaults", () => {
  for (const value of [
    { rules: [] }, { rules: [{ userAgent: "Googlebot" }] },
    { rules: [{ userAgent: "*", disallow: ["/safe\nAllow: /"] }] },
    { rules: [{ userAgent: "*", allow: ["/admin/export"] }] },
    { rules: [{ userAgent: "*", allow: ["/a*dmin/*"] }] },
    { rules: [{ userAgent: "*", disallow: ["https://example.com"] }] },
    { rules: [{ userAgent: "*" }, { userAgent: "*" }] },
    { rules: [{ userAgent: "*", crawlDelay: 10 }] },
    { rules: [{ userAgent: "*" }], sitemap: "https://elsewhere.example" },
  ]) assert.equal(validateCrawlSettings(value).ok, false, JSON.stringify(value));
  assert.equal(parseCrawlSettings("{invalid").ok, false);
  assert.equal(parseCrawlSettings(" ".repeat(8001) + "{}").ok, false);
});

test("noindex conflict warnings handle wildcard blocks without falsely flagging private defaults", () => {
  const settings = validateCrawlSettings({ rules: [{ userAgent: "*", allow: ["/"], disallow: ["/blog/*"] }] }).settings;
  assert.deepEqual(noIndexCrawlConflicts(settings, ["/blog/hidden", "/services/speeding", "/admin"]), ["/blog/hidden"]);
  const hostile = { rules: [{ userAgent: "*", allow: [], disallow: [`/${"*a".repeat(100)}b$`] }] };
  const before = performance.now();
  assert.equal(isCrawlBlocked(`/${"a".repeat(240)}`, hostile), false);
  assert.ok(performance.now() - before < 1000, "wildcard matching must not backtrack exponentially");
});

test("editable Open Graph type overrides the route and preserves fallback sharing fields", () => {
  const defaults = { title: "A guide", description: "A useful guide.", ogType: "article", publishedTime: "2026-10-05T10:00:00Z" };
  const metadata = resolveMetadata("/blog/a-guide", defaults, { ogType: "website" }, "John Violaris", { url: "/share-image", alt: "John Violaris" });
  assert.equal(metadata.openGraph.type, "website");
  assert.equal(metadata.openGraph.publishedTime, undefined);
  assert.equal(metadata.twitter.title, "A guide | John Violaris");
});

test("malformed legacy metadata text fails safely to the page defaults", () => {
  const defaults = { title: "A guide", description: "A useful guide." };
  const metadata = resolveMetadata("/blog/a-guide", defaults, { title: { invalid: true }, description: ["invalid"], ogTitle: 123 }, "John Violaris");
  assert.equal(metadata.title, defaults.title);
  assert.equal(metadata.description, defaults.description);
  assert.equal(metadata.openGraph.title, "A guide | John Violaris");
});

test("ordinary metadata saves and historical payloads share current safety and field validation", () => {
  const path = "/blog/a-guide";
  for (const content of [
    { title: "a".repeat(71) }, { description: "a".repeat(161) },
    { canonical: "javascript:alert(1)" }, { ogImage: "/card.jpg" },
    { twitterCard: "unsupported" }, { ogType: "profile" },
    { noIndex: "true" }, { title: { malformed: true } },
    { customJsonLd: "<script>{}</script>" }, { extraPrivateField: "unsupported" },
  ]) assert.equal(validateSeoContent(content, path, siteUrl).ok, false, JSON.stringify(content));
  const valid = validateSeoContent({ title: " Approved title ", description: "A description.", ogType: "article", noIndex: false, noFollow: true, ogImage: "/card.jpg", ogImageAlt: "The practice name", twitterImageAlt: "Orphaned alt" }, path, siteUrl);
  assert.equal(valid.ok, true);
  assert.equal(valid.content.title, "Approved title");
  assert.equal(valid.content.noIndex, undefined);
  assert.equal(valid.content.noFollow, true);
  assert.equal(valid.content.twitterImageAlt, undefined);
});

test("automatic site/article builders validate against recorded vocabulary and stable references", () => {
  const path = "/blog/a-guide";
  const nodes = [...siteNodes({ config: resolveSiteConfig({}), practiceAreas: ["Speeding"], portrait: "/portrait.webp" }),
    webPageNode({ page: { path, title: "A guide", canonical: path }, hasBreadcrumb: true }),
    breadcrumbNode(path, [{ name: "Resources", path: "/blog" }, { name: "A guide", path }]),
    blogPostingNode({ path, headline: "A guide", datePublished: "2026-10-05T10:00:00Z", dateModified: "2026-10-05T11:00:00Z" }),
  ];
  assert.deepEqual(validateSchemaNodes(nodes), []);
});

test("schema validation flags unknown types, invalid properties, empty values, broken IDs and dates", () => {
  const problems = validateSchemaNodes([
    { "@type": "InventedLawyerType", name: "A person" },
    { "@type": "Person", "@id": `${siteUrl}/#person`, headline: "Wrong type", inventedProperty: "A value", name: "" },
    { "@type": "BlogPosting", "@id": `${siteUrl}/#person`, datePublished: "not a date", author: { "@id": `${siteUrl}/#missing` } },
  ]);
  for (const pattern of [/InventedLawyerType/, /headline does not belong/, /inventedProperty/, /is empty/, /duplicate @id/, /valid date/, /has no definition/]) assert.ok(problems.some((problem) => pattern.test(problem)), pattern);
  assert.equal(automaticSchemaIds("/services/speeding", siteUrl).includes(`${siteUrl}/services/speeding#article`), false);
});

test("publication advisories flag the actual pending metadata, links, image and invalid custom vocabulary", () => {
  const warnings = publicationSeoWarnings({ path: "/blog/draft", defaults: { title: "Draft", ogType: "article" }, content: { featuredImage: "/image.jpg", relatedService: "/services/withdrawn" }, override: { customJsonLd: '{"@type":"Person","headline":"Not a Person property"}' }, siteName: "John Violaris", siteUrl });
  for (const pattern of [/search description/, /publication date/, /withdrawn/, /alt text/, /headline does not belong/]) assert.ok(warnings.some((warning) => pattern.test(warning)), pattern);
});

test("practice schema omits unset, unreviewed or incomplete address data", () => {
  for (const values of [{}, { addressStreet: "Fixture street" }, { addressStreet: "Fixture street", practiceDetailsReviewedAt: "2026-10-01" }]) {
    const practice = siteNodes({ config: resolveSiteConfig(values), practiceAreas: [], portrait: "/portrait.webp" }).find((node) => node["@type"] === "LegalService");
    for (const key of ["address", "geo", "openingHours", "legalName", "identifier"]) assert.equal(practice[key], undefined, key);
  }
});

test("confirmed practice facts and person identifiers remain distinct in the graph", () => {
  const config = resolveSiteConfig({ practiceLegalName: "Fixture Practice", practiceSraNumber: "1234567", sraNumber: "123456", addressStreet: "Fixture street", addressLocality: "Fixture town", addressPostalCode: "AA1 1AA", addressCountry: "GB", latitude: "51.5", longitude: "-0.12", openingHours: "Mo-Fr 09:00-18:00; Sa 09:00-12:00", practiceDetailsReviewedAt: "2026-10-01" });
  const nodes = siteNodes({ config, practiceAreas: [], portrait: "/portrait.webp" });
  const practice = nodes.find((node) => node["@type"] === "LegalService");
  const person = nodes.find((node) => node["@type"] === "Person");
  assert.equal(practice.legalName, "Fixture Practice");
  assert.equal(practice.identifier.value, "1234567");
  assert.equal(person.identifier.value, "123456");
  assert.equal(practice.address.addressRegion, undefined);
  assert.deepEqual(practice.geo, { "@type": "GeoCoordinates", latitude: 51.5, longitude: -0.12 });
  assert.deepEqual(practice.openingHours, ["Mo-Fr 09:00-18:00", "Sa 09:00-12:00"]);
  assert.deepEqual(validateSchemaNodes(nodes), []);
  const unconfirmed = siteNodes({ config: { ...config, practiceDetailsReviewedAt: "" }, practiceAreas: [], portrait: "/portrait.webp" });
  assert.equal(unconfirmed.find((node) => node["@type"] === "LegalService").identifier, undefined);
  assert.equal(unconfirmed.find((node) => node["@type"] === "Person").identifier.value, "123456");
});
