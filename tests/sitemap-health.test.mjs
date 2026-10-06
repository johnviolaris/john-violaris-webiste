import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { analyseSitemapDates } from "../lib/cms/seo/sitemap-health.ts";
import { datedSitemapEntries } from "../lib/cms/seo/sitemap-dates.ts";

const empty = () => ({ sections: [], seo: [], settings: [], media: [], services: [], articles: [] });
const routes = [{ path: "/", label: "Home", group: "Pages" }, { path: "/fees", label: "Fees", group: "Pages" }];
const siteUrl = "https://example.com";
const date = "2026-10-02T09:00:00.000Z";
const analyse = (sources, overrides = {}, unavailableSources = []) => analyseSitemapDates(routes, overrides, siteUrl, { sources, unavailableSources });

test("private date diagnostics distinguish no evidence from unavailable sources without changing sitemap output", () => {
  const sources = { ...empty(), seo: [{ path: "/fees", updated_at: date }] };
  const before = datedSitemapEntries(routes, {}, siteUrl, sources);
  assert.deepEqual(analyse(sources).map(({ path, code, severity }) => ({ path, code, severity })), [{ path: "/", code: "sitemap-date-unknown", severity: "info" }]);
  const failed = analyse(sources, {}, ["media", "media"]);
  assert.equal(failed.filter(({ code }) => code === "sitemap-date-source-unavailable").length, 1);
  assert.match(failed[0].message, /media-description dates/);
  assert.equal(failed[0].severity, "warning");
  assert.deepEqual(datedSitemapEntries(routes, {}, siteUrl, sources), before);
});

test("removed or reset date evidence is omitted and flagged; another surviving source still dates the page", () => {
  const section = { page: "fees", section: "body", portrait: null, updated_at: date };
  assert.ok(!analyse({ ...empty(), sections: [section] }).some(({ path }) => path === "/fees"));
  for (const sections of [[], [{ ...section, updated_at: null }], [{ ...section, updated_at: "2026-02-30T00:00:00Z" }]]) {
    const sources = { ...empty(), sections };
    assert.ok(analyse(sources).some(({ path, code }) => path === "/fees" && code === "sitemap-date-unknown"));
    assert.ok(!Object.hasOwn(datedSitemapEntries(routes, {}, siteUrl, sources)[1], "lastModified"));
  }
  const sources = { ...empty(), seo: [{ path: "/fees", updated_at: date }] };
  assert.equal(datedSitemapEntries(routes, {}, siteUrl, sources)[1].lastModified, date);
});

test("noindex and alternate canonical entries are excluded from missing-date diagnostics", () => {
  assert.deepEqual(analyse(empty(), { "/": { noIndex: true }, "/fees": { canonical: "https://other.example/fees" } }), []);
});

test("actual public source reader keeps surviving dates and distinguishes empty reads, errors and exceptions", () => {
  const worker = new URL("./sitemap-source-fixture.mjs", import.meta.url);
  const run = (mode) => JSON.parse(execFileSync(process.execPath, ["--import", "./scripts/alias-hook.mjs", fileURLToPath(worker), mode], { encoding: "utf8", timeout: 10000, stdio: ["ignore", "pipe", "pipe"] }));
  const good = run("empty");
  assert.deepEqual(good.snapshot.unavailableSources, []);
  assert.deepEqual(good.sources, good.snapshot.sources);
  for (const [mode, source] of [["failure", "media"], ["null", "seo"]]) {
    const result = run(mode);
    assert.deepEqual(result.snapshot.unavailableSources, [source]);
    assert.equal(result.sources.sections[0].updated_at, "2026-10-02T09:00:00Z");
    assert.equal(JSON.stringify(result).includes("private"), false);
  }
  const thrown = run("throws");
  assert.deepEqual(thrown.snapshot.unavailableSources, ["source-read"]);
  assert.deepEqual(thrown.sources, empty());
  const emptyCollections = run("route-empty");
  assert.deepEqual(emptyCollections.snapshot.unavailableSources, []);
  assert.deepEqual(emptyCollections.sources.services, []);
  for (const mode of ["route-failure", "route-throws"]) {
    const result = run(mode);
    assert.deepEqual(result.snapshot.unavailableSources, ["collections"]);
    assert.ok(result.sources.services.length > 0, "Legacy service fallback remains available.");
    assert.ok(result.sources.services.every((row) => row.updated_at === null), "Fallback rows never claim dates.");
    assert.deepEqual(result.sources.articles, [], "Configured article reads still fail closed.");
    assert.equal(result.sources.sections[0].updated_at, "2026-10-02T09:00:00Z");
    assert.equal(JSON.stringify(result).includes("private"), false);
  }
  assert.deepEqual(good.sources.dependencyChanges, [], "A successful empty new RPC is available, not a failure.");
  assert.deepEqual(good.rpcCalls, ["get_sitemap_dependency_dates"], "Normal coverage takes one RPC read.");
  const dated = run("rpc-dates");
  assert.deepEqual(dated.snapshot.unavailableSources, []);
  assert.equal(datedSitemapEntries(routes, {}, siteUrl, dated.sources)[1].lastModified, "2026-10-03T09:00:00.000Z");
  for (const mode of ["rpc-failure", "rpc-null", "rpc-throws", "rpc-malformed"]) {
    const result = run(mode);
    assert.deepEqual(result.snapshot.unavailableSources, ["public-changes", "dependency-changes"]);
    assert.equal(Object.hasOwn(result.sources, "publicChanges"), false);
    assert.equal(datedSitemapEntries(routes, {}, siteUrl, result.sources)[1].lastModified, "2026-10-02T09:00:00.000Z", "Legacy surviving section dates remain usable.");
    assert.equal(JSON.stringify(result).includes("private"), false);
    assert.match(analyse(result.sources, {}, result.snapshot.unavailableSources)[0].message, /durable public section\/SEO dates/);
  }
  for (const mode of ["legacy-empty", "legacy-dates"]) {
    const result = run(mode);
    assert.deepEqual(result.rpcCalls, ["get_sitemap_dependency_dates", "get_sitemap_change_dates"]);
    assert.deepEqual(result.snapshot.unavailableSources, ["dependency-changes"]);
    assert.equal(Object.hasOwn(result.sources, "dependencyChanges"), false, "An older successful RPC cannot claim new source coverage.");
    assert.ok(Array.isArray(result.sources.publicChanges));
    if (mode === "legacy-dates") assert.equal(datedSitemapEntries(routes, {}, siteUrl, result.sources)[1].lastModified, "2026-10-03T09:00:00.000Z");
    assert.match(analyse(result.sources, {}, result.snapshot.unavailableSources)[0].message, /durable shared dependency dates/);
  }
});
