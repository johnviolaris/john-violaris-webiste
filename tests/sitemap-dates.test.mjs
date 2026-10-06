import assert from "node:assert/strict";
import test from "node:test";
import { datedSitemapEntries, sitemapModificationDates } from "../lib/cms/seo/sitemap-dates.ts";

const empty = () => ({ sections: [], seo: [], settings: [], media: [], services: [], articles: [] });
const routes = ["/", "/about", "/services", "/fees", "/reviews", "/contact", "/cookies", "/privacy", "/blog"].map((path) => ({ path, group: "Pages" }));
const first = "2026-10-01T09:00:00.000Z";
const second = "2026-10-02T09:00:00.000Z";
const third = "2026-10-03T09:00:00.000Z";

test("fixed pages without recorded source edits receive no invented modification date", () => {
  const dates = sitemapModificationDates(routes, empty());
  assert.equal(dates.size, 0);
  assert.deepEqual(datedSitemapEntries(routes, {}, "https://example.com", empty()), routes.map(({ path }) => ({ url: new URL(path, "https://example.com").href })));
});

test("stored section dates follow actual own and shared page dependencies", () => {
  const dates = sitemapModificationDates(routes, { ...empty(), sections: [
    { page: "about", section: "meet-john", updated_at: second, portrait: null },
    { page: "fees", section: "preview", updated_at: first, portrait: null },
    { page: "fees", section: "body", updated_at: third, portrait: null },
    { page: "unknown", section: "not-rendered", updated_at: third, portrait: null },
  ] });
  assert.equal(dates.get("/"), second);
  assert.equal(dates.get("/about"), second);
  assert.equal(dates.get("/fees"), third);
  assert.equal(dates.has("/reviews"), false);
  assert.equal(dates.has("/contact"), false);
});

test("edited shared CTA dates only the renderers which actually pass its CMS copy", () => {
  const mixed = [...routes, { path: "/blog/article", group: "Articles", lastModified: first }, { path: "/services/drink-driving", group: "Services", lastModified: first }];
  const dates = sitemapModificationDates(mixed, { ...empty(), sections: [{ page: "shared", section: "cta", updated_at: second, portrait: null }] });
  assert.equal(dates.get("/"), second);
  assert.equal(dates.get("/about"), second);
  assert.equal(dates.get("/privacy"), second);
  assert.equal(dates.has("/contact"), false);
  assert.equal(dates.has("/blog"), false);
  assert.equal(dates.get("/blog/article"), first);
  assert.equal(dates.get("/services/drink-driving"), first);
});

test("known shared content settings and route SEO edits count; crawl/script/unknown keys do not", () => {
  const dates = sitemapModificationDates(routes, { ...empty(),
    settings: [{ key: "name", value: "John Violaris", updated_at: first }, { key: "scripts", value: "unused", updated_at: third }, { key: "robots", value: "unused", updated_at: third }, { key: "unknown", value: "unused", updated_at: third }, { key: "roleLong", value: "Email signature only", updated_at: third }, { key: "practiceLegalName", value: "Unconfirmed fixture", updated_at: third }],
    seo: [{ path: "/privacy", updated_at: second }, { path: "/draft-secret", updated_at: third }],
  });
  assert.equal(dates.get("/privacy"), second);
  assert.equal(dates.get("/contact"), first);
  assert.equal(dates.has("/draft-secret"), false);
  assert.equal(sitemapModificationDates(routes, { ...empty(), settings: [{ key: "name", value: {}, updated_at: third }] }).size, 0);
  const approved = [{ key: "practiceLegalName", value: "Reviewed fixture", updated_at: second }, { key: "practiceDetailsReviewedAt", value: "2026-01-15", updated_at: second }];
  assert.equal(sitemapModificationDates(routes, { ...empty(), settings: approved }).get("/privacy"), second);
  assert.equal(sitemapModificationDates(routes, { ...empty(), settings: [{ ...approved[0], value: "" }, approved[1]] }).size, 0);
  assert.equal(sitemapModificationDates(routes, { ...empty(), settings: [...approved, { key: "addressStreet", value: "Incomplete address fixture", updated_at: third }] }).size, 0);
  const initials = sitemapModificationDates(routes, { ...empty(), settings: [{ key: "initials", value: "JV", updated_at: first }] });
  assert.equal(initials.get("/"), first);
  assert.equal(initials.has("/about"), false);
});

test("published collection source edits date their actual indexes without modifying article bylines", () => {
  const article = { path: "/blog/article", group: "Articles", lastModified: first };
  const dates = sitemapModificationDates([...routes, article], { ...empty(), services: [{ updated_at: second }], articles: [{ updated_at: third }] });
  assert.equal(dates.get("/services"), second);
  assert.equal(dates.get("/"), second);
  assert.equal(dates.get("/blog"), third);
  assert.equal(dates.get("/blog/article"), first);
  assert.equal(article.lastModified, first);
});

test("library description edits date only the actual portrait and matching article image uses", () => {
  const article = { path: "/blog/article", group: "Articles", lastModified: first, imageUrl: "https://example.com/image.webp" };
  const dates = sitemapModificationDates([...routes, article], { ...empty(),
    sections: [{ page: "home", section: "hero", updated_at: first, portrait: "/Profile 7.png" }],
    media: [{ url: "/john-violaris-portrait.webp", updated_at: second }, { url: "https://example.com/image.webp", updated_at: third }, { url: "/unused.webp", updated_at: third }],
  });
  assert.equal(dates.get("/"), second);
  assert.equal(dates.get("/blog/article"), third);
  assert.equal(dates.has("/about"), false);
  assert.equal(article.lastModified, first);
});

test("date comparisons respect timezone instants and ignore malformed or missing CMS timestamps", () => {
  const dates = sitemapModificationDates(routes, { ...empty(), seo: [
    { path: "/about", updated_at: "2026-10-03T10:00:00+02:00" },
    { path: "/about", updated_at: "2026-10-03T09:00:00+00:00" },
    { path: "/fees", updated_at: "not a date" },
    { path: "/fees", updated_at: "2026-10-03" },
    { path: "/fees", updated_at: "2026-99-01T00:00:00Z" },
    { path: "/fees", updated_at: "2026-02-30T00:00:00Z" },
    { path: "/fees", updated_at: "2026-10-03T24:00:00Z" },
    { path: "/fees", updated_at: null },
  ] });
  assert.equal(dates.get("/about"), third);
  assert.equal(dates.has("/fees"), false);
});

test("dated sitemap preserves registry-only publication, noindex and canonical exclusions", () => {
  const sources = { ...empty(), seo: [
    { path: "/about", updated_at: first }, { path: "/contact", updated_at: second },
    { path: "/draft", updated_at: third }, { path: "/admin", updated_at: third },
  ] };
  const entries = datedSitemapEntries(routes, { "/about": { noIndex: true }, "/contact": { canonical: "https://elsewhere.test/contact" } }, "https://example.com", sources);
  assert.ok(!entries.some(({ url }) => /about|contact|draft|admin/.test(url)));
  assert.equal(entries.length, routes.length - 2);
  assert.ok(entries.every((entry) => !Object.hasOwn(entry, "lastModified")));
});

test("durable section/SEO dates survive deleted rows and ignore date-only current-row upserts", () => {
  const sources = { ...empty(), publicChanges: [{ path: "/fees", modified_at: second }],
    sections: [{ page: "fees", section: "body", portrait: null, updated_at: third }],
    seo: [{ path: "/fees", updated_at: third }],
  };
  assert.equal(sitemapModificationDates(routes, sources).get("/fees"), second);
  assert.equal(sitemapModificationDates(routes, { ...sources, sections: [], seo: [] }).get("/fees"), second);
  assert.equal(sitemapModificationDates(routes, { ...sources, settings: [{ key: "name", value: "Existing fixture name", updated_at: third }] }).get("/fees"), third, "An independently newer shared public change still wins.");
  assert.equal(sitemapModificationDates(routes, { ...sources, publicChanges: [] }).has("/fees"), false, "A successful empty durable source supplies no fabricated fallback.");
});

test("durable evidence cannot add URLs or use malformed/future change dates", () => {
  const sources = { ...empty(), publicChanges: [
    { path: "/draft-secret", modified_at: third },
    { path: "/fees", modified_at: "2026-02-30T00:00:00Z" },
    { path: "/fees", modified_at: "9999-01-01T00:00:00Z" },
    { path: "/fees", modified_at: null },
    { path: "/about", modified_at: second },
  ] };
  const entries = datedSitemapEntries(routes, { "/about": { noIndex: true } }, "https://example.com", sources);
  assert.equal(entries.some(({ url }) => url.includes("draft-secret")), false);
  assert.equal(entries.some(({ url }) => url.endsWith("/about")), false);
  assert.equal(entries.some((entry) => Object.hasOwn(entry, "lastModified")), false);
});

test("new dependency capability keeps retained dates authoritative for supported sources with a valid baseline", () => {
  const mixed = [...routes, { path: "/blog/article", group: "Articles", lastModified: first, imageUrl: "https://example.com/image.webp" }];
  const sources = { ...empty(), dependencyChanges: mixed.map(({ path }) => ({ path, modified_at: second })),
    settings: [{ key: "name", value: "Recorded fixture", updated_at: third }],
    media: [{ url: "/john-violaris-portrait.webp", updated_at: third }, { url: "https://example.com/image.webp", updated_at: third }],
    services: [{ updated_at: third }], articles: [{ updated_at: third }],
  };
  assert.ok([...sitemapModificationDates(mixed, sources).values()].every((date) => date === second));
  const olderSchema = { ...sources, dependencyChanges: undefined, publicChanges: [{ path: "/privacy", modified_at: second }] };
  assert.equal(sitemapModificationDates(mixed, olderSchema).get("/privacy"), third, "Old RPC success retains older shared-row behavior.");
  assert.equal(sitemapModificationDates(mixed, { ...sources, settings: [], media: [], services: [], articles: [] }).get("/privacy"), second, "Deleted source rows retain their dated reset.");
});

test("missing or invalid dependency baselines preserve surviving source timestamps and independent content dates", () => {
  const article = { path: "/blog/article", group: "Articles", lastModified: third, imageUrl: "https://example.com/image.webp" };
  const sources = { ...empty(), dependencyChanges: [], settings: [{ key: "name", value: "Recorded fixture", updated_at: second }], services: [{ updated_at: first }], articles: [{ updated_at: second }] };
  assert.equal(sitemapModificationDates([...routes, article], sources).get("/privacy"), second);
  assert.equal(sitemapModificationDates([...routes, article], sources).get("/blog/article"), third);
  assert.equal(sitemapModificationDates(routes, { ...sources, dependencyChanges: [{ path: "/privacy", modified_at: "9999-01-01T00:00:00Z" }] }).get("/privacy"), second, "Invalid/future coverage cannot suppress surviving row dates.");
  const rowBacked = { ...sources, dependencyChanges: [{ path: "/privacy", modified_at: first }], settings: [{ key: "phoneE164", value: "+447700900123", updated_at: third }] };
  assert.equal(sitemapModificationDates(routes, rowBacked).get("/privacy"), third, "Env-derived fields deliberately retain their previous row evidence.");
});
