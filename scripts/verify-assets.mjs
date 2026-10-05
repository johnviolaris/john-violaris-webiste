/**
 * First-party asset regression budget on rendered public routes of a build.
 *   npm run assets:verify -- http://127.0.0.1:3000
 *   node scripts/verify-assets.mjs http://127.0.0.1:3000 --measure [report.json]
 *
 * Gzip sizes use actual build files (once per unique asset) and inline styles.
 * They are repeatable size estimates, not simulated loading time or field CWV.
 */
import { readFile, stat, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { resolve, sep } from "node:path";
import { gzipSync } from "node:zlib";

const require = createRequire(import.meta.url);
const { parse } = require("next/dist/compiled/node-html-parser");
const base = new URL(process.argv[2] ?? "http://localhost:3000");
const measureOnly = process.argv.includes("--measure");
const reportPath = process.argv.find((argument, index) => index > 2 && argument !== "--measure");
const staticRoot = resolve(".next/static");
const measured = new Map();
const buildId = (await readFile(".next/BUILD_ID", "utf8")).trim();

async function fetchText(path) {
  const response = await fetch(new URL(path, base), { signal: AbortSignal.timeout(20_000) });
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
  return response.text();
}

async function assetBytes(url) {
  if (!measured.has(url.pathname)) {
    const file = resolve(staticRoot, decodeURIComponent(url.pathname.slice("/_next/static/".length)));
    if (!file.startsWith(staticRoot + sep)) throw new Error(`Asset escaped .next/static: ${url.pathname}`);
    const source = await readFile(file);
    measured.set(url.pathname, { rawBytes: source.length, gzipBytes: gzipSync(source, { level: 9 }).length });
  }
  return measured.get(url.pathname).gzipBytes;
}

const sitemap = await fetchText("/sitemap.xml");
const paths = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => new URL(match[1]).pathname);
if (!paths.length) throw new Error("No public sitemap routes to measure");
const pages = [];
for (const path of paths) {
  const root = parse(await fetchText(path));
  const scriptNodes = root.querySelectorAll("script[src]");
  const legacy = (node) => Object.keys(node.attributes).some((name) => name.toLowerCase() === "nomodule");
  const scripts = scriptNodes.filter((node) => !legacy(node)).map((node) => node.getAttribute("src"));
  const legacyScripts = scriptNodes.filter(legacy).map((node) => node.getAttribute("src"));
  const styles = root.querySelectorAll("link").filter((node) => node.getAttribute("rel") === "stylesheet")
    .map((node) => node.getAttribute("href"));
  const urls = (values) => [...new Set(values)].map((value) => new URL(value, base))
    .filter((url) => url.origin === base.origin && url.pathname.startsWith("/_next/static/"));
  const js = urls(scripts);
  const legacyJs = urls(legacyScripts);
  const css = urls(styles);
  // Embedded styles must not make the CSS budget appear to be zero if a
  // future build inlines CSS. Separate gzip streams are a conservative size
  // estimate; this is not the full HTML/RSC payload or a network benchmark.
  const inlineStyles = root.querySelectorAll("style").map((node) => node.innerHTML);
  const externalCssGzipBytes = (await Promise.all(css.map(assetBytes))).reduce((total, bytes) => total + bytes, 0);
  const inlineCssGzipBytes = inlineStyles.reduce((total, source) => total + gzipSync(source, { level: 9 }).length, 0);
  if (!js.length) throw new Error(`${path}: no initial first-party scripts found`);
  pages.push({
    path,
    initialJsGzipBytes: (await Promise.all(js.map(assetBytes))).reduce((total, bytes) => total + bytes, 0),
    legacyJsGzipBytes: (await Promise.all(legacyJs.map(assetBytes))).reduce((total, bytes) => total + bytes, 0),
    initialCssGzipBytes: externalCssGzipBytes + inlineCssGzipBytes,
    externalCssGzipBytes,
    inlineCssGzipBytes,
    scriptCount: js.length,
    stylesheetCount: css.length,
    inlineStyleCount: inlineStyles.length,
  });
}
const portraitBytes = (await stat("public/john-violaris-portrait.webp")).size;
const summary = {
  pagesMeasured: pages.length,
  maxInitialJsGzipBytes: Math.max(...pages.map((page) => page.initialJsGzipBytes)),
  maxLegacyJsGzipBytes: Math.max(...pages.map((page) => page.legacyJsGzipBytes)),
  maxInitialCssGzipBytes: Math.max(...pages.map((page) => page.initialCssGzipBytes)),
  portraitBytes,
};
const report = { measuredAt: new Date().toISOString(), buildId, summary, pages };
console.log(JSON.stringify(summary, null, 2));
console.log("Largest initial JS routes:");
for (const page of [...pages].sort((a, b) => b.initialJsGzipBytes - a.initialJsGzipBytes).slice(0, 5)) {
  console.log(`  ${page.path}: ${(page.initialJsGzipBytes / 1024).toFixed(1)} KiB gzip JS; ${(page.initialCssGzipBytes / 1024).toFixed(1)} KiB gzip CSS`);
}
if (reportPath) await writeFile(reportPath, JSON.stringify(report, null, 2) + "\n");

if (!measureOnly) {
  const budget = JSON.parse(await readFile("performance-budgets.json", "utf8"));
  const failures = [];
  for (const [metric, actual] of Object.entries(summary)) {
    const limit = budget.limits[metric];
    if (limit !== undefined && actual > limit) failures.push(`${metric}: ${actual} bytes exceeds ${limit}`);
  }
  if (failures.length) {
    for (const failure of failures) console.error(`FAIL ${failure}`);
    process.exitCode = 1;
  } else {
    console.log("Asset budgets passed. External widgets and field LCP/INP are separate measurements.");
  }
}
