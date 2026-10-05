/**
 * Crawl every sitemap page on a running production build:
 *   npm run pages:verify -- http://127.0.0.1:3000 [report.json]
 *
 * Metadata, headings, IDs, internal links/anchors and local image delivery are
 * checked on rendered HTML. External services and browser accessibility remain
 * separate checks; this does not claim a Core Web Vitals or screen-reader pass.
 */
import { writeFile } from "node:fs/promises";
import { checkRenderedPage, duplicateMetadata } from "./page-quality.mjs";

const base = new URL(process.argv[2] ?? "http://localhost:3000");
const pages = new Map();
const resources = new Map();
const timeout = () => AbortSignal.timeout(20_000);

async function resource(url) {
  const key = `${url.pathname}${url.search}`;
  if (!resources.has(key)) {
    resources.set(key, fetch(new URL(key, base), { signal: timeout() }).then(async (response) => ({
      status: response.status,
      ok: response.ok,
      type: response.headers.get("content-type") ?? "",
      html: response.headers.get("content-type")?.includes("text/html") ? await response.text() : null,
    })).catch((error) => ({ ok: false, status: error.message, type: "", html: null })));
  }
  return resources.get(key);
}

const sitemapResponse = await fetch(new URL("/sitemap.xml", base), { signal: timeout() });
if (!sitemapResponse.ok) throw new Error(`Sitemap HTTP ${sitemapResponse.status}`);
const locations = [...(await sitemapResponse.text()).matchAll(/<loc>([^<]+)<\/loc>/g)]
  .map((match) => new URL(match[1].replaceAll("&amp;", "&")));
if (!locations.length) throw new Error("Sitemap has no public pages");
if (new Set(locations.map((url) => url.pathname)).size !== locations.length) {
  throw new Error("Sitemap contains duplicate routes");
}
const internalOrigins = new Set([base.origin, ...locations.map((url) => url.origin)]);

for (const location of locations) {
  const fetched = await resource(location);
  const page = fetched.ok && fetched.html
    ? checkRenderedPage(fetched.html, location)
    : { errors: [`page fetch failed: ${fetched.status} ${fetched.type}`], advisories: [], links: [], images: [], ids: new Set() };
  pages.set(location.pathname, page);
}

for (const field of ["title", "description"]) {
  for (const [path, original] of duplicateMetadata(pages, field)) {
    pages.get(path).errors.push(`duplicate ${field}, also used on ${original}`);
  }
}

for (const page of pages.values()) {
  for (const link of page.links.filter((url) => internalOrigins.has(url.origin))) {
    const fetched = await resource(link);
    if (!fetched.ok) {
      page.errors.push(`broken internal link ${link.pathname}${link.search}: ${fetched.status}`);
      continue;
    }
    if (link.hash && !link.hash.startsWith("#:~:text=")) {
      const destination = pages.get(link.pathname) ?? (fetched.html ? checkRenderedPage(fetched.html, link) : null);
      let id;
      try { id = decodeURIComponent(link.hash.slice(1)); } catch { id = link.hash.slice(1); }
      if (destination && !destination.ids.has(id)) page.errors.push(`missing link target ${link.pathname}${link.hash}`);
    }
  }
  for (const image of page.images.filter((url) => internalOrigins.has(url.origin))) {
    const fetched = await resource(image);
    if (!fetched.ok || !fetched.type.startsWith("image/")) {
      page.errors.push(`image did not return image content ${image.pathname}${image.search}: ${fetched.status} ${fetched.type}`);
    }
  }
}

const report = [...pages].map(([path, page]) => ({
  path, title: page.title, description: page.description,
  errors: [...new Set(page.errors)], advisories: [...new Set(page.advisories)],
}));
for (const page of report) {
  console.log(`  ${page.errors.length ? "FAIL" : "ok  "}  ${page.path}`);
  for (const error of page.errors) console.log(`        ${error}`);
  for (const advisory of page.advisories) console.log(`        advisory: ${advisory}`);
}
const failures = report.filter((page) => page.errors.length).length;
const advisories = report.reduce((count, page) => count + page.advisories.length, 0);
console.log(`\n${report.length} pages; ${failures} failed; ${advisories} editorial advisories; ${resources.size} internal resources checked.`);
if (process.argv[3]) await writeFile(process.argv[3], JSON.stringify({ base: base.href, pages: report }, null, 2) + "\n");
process.exitCode = failures ? 1 : 0;
