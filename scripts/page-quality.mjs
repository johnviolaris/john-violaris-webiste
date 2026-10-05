/**
 * HTML checks shared by the rendered-site verifier and its regression tests.
 * Next is pinned and already ships this parser; no browser or extra install is
 * needed in CI. It parses elements rather than matching tags in script strings.
 */
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { parse } = require("next/dist/compiled/node-html-parser");
const clean = (value) => String(value ?? "").replace(/\s+/g, " ").trim();

function isHidden(node) {
  for (let element = node; element; element = element.parentNode) {
    if (element.hasAttribute?.("hidden") || element.getAttribute?.("aria-hidden") === "true") {
      return true;
    }
  }
  return false;
}

function httpUrl(value, currentUrl, errors, label) {
  if (!value || value.startsWith("data:")) return null;
  try {
    const url = new URL(value, currentUrl);
    return ["http:", "https:"].includes(url.protocol) ? url : null;
  } catch {
    errors.push(`${label} has an invalid URL: ${value}`);
    return null;
  }
}

export function checkRenderedPage(html, currentUrl) {
  const root = parse(html);
  const errors = [];
  const advisories = [];
  const titles = root.querySelectorAll("title");
  const descriptionTags = root.querySelectorAll("meta").filter((node) =>
    node.getAttribute("name")?.toLowerCase() === "description");
  const canonicalTags = root.querySelectorAll("link").filter((node) =>
    node.getAttribute("rel")?.toLowerCase().split(/\s+/).includes("canonical"));
  const title = clean(titles[0]?.text);
  const description = clean(descriptionTags[0]?.getAttribute("content"));
  const canonical = httpUrl(canonicalTags[0]?.getAttribute("href"), currentUrl, errors, "canonical");

  if (titles.length !== 1 || !title) errors.push("must have exactly one nonempty title");
  if (descriptionTags.length !== 1 || !description) errors.push("must have exactly one nonempty description");
  if (canonicalTags.length !== 1 || !canonical) errors.push("must have exactly one valid canonical");
  const expected = new URL(currentUrl);
  if (canonical && (canonical.origin !== expected.origin || canonical.search || canonical.hash ||
    canonical.pathname.replace(/\/$/, "") !== expected.pathname.replace(/\/$/, ""))) {
    errors.push(`sitemap page canonical points elsewhere: ${canonical.href}`);
  }
  // Character counts are editorial guides, not Google ranking or display rules.
  if (title.length > 60) advisories.push(`search title is ${title.length} characters (guide: 60)`);
  if (description.length > 160) advisories.push(`description is ${description.length} characters (guide: 160)`);
  if (!root.querySelector("html")?.getAttribute("lang")) errors.push("html language is missing");

  const mains = root.querySelectorAll("main");
  if (mains.length !== 1) errors.push("must have exactly one main landmark");
  const headings = (mains[0] ?? root).querySelectorAll("h1,h2,h3,h4,h5,h6").filter((node) => !isHidden(node));
  if (headings.filter((node) => node.tagName === "H1").length !== 1) {
    errors.push("main content must have exactly one visible H1");
  }
  let previousLevel = 0;
  for (const heading of headings) {
    const level = Number(heading.tagName.slice(1));
    if (!clean(heading.text)) errors.push(`empty ${heading.tagName.toLowerCase()}`);
    if (previousLevel && level > previousLevel + 1) {
      errors.push(`heading skips H${previousLevel} to H${level}: ${clean(heading.text)}`);
    }
    previousLevel = level;
  }

  const ids = new Set();
  for (const node of root.querySelectorAll("[id]")) {
    const id = node.getAttribute("id");
    if (ids.has(id)) errors.push(`duplicate element id: ${id}`);
    ids.add(id);
  }
  const links = root.querySelectorAll("a[href]").map((node) =>
    httpUrl(node.getAttribute("href"), currentUrl, errors, "link")).filter(Boolean);
  const images = root.querySelectorAll("img").map((node) => {
    const src = node.getAttribute("src");
    if (!node.hasAttribute("alt")) errors.push(`image has no alt attribute: ${src}`);
    if (!src) errors.push("image has no source");
    if (node.getAttribute("data-nimg") === "fill" && !node.getAttribute("sizes")) {
      advisories.push(`responsive image has no sizes hint: ${src}`);
    }
    return httpUrl(src, currentUrl, errors, "image");
  }).filter(Boolean);

  return { title, description, canonical, ids, links, images, errors, advisories };
}

export function duplicateMetadata(pages, field) {
  const seen = new Map();
  const duplicates = [];
  for (const [path, page] of pages) {
    const value = clean(page[field]).toLowerCase();
    if (!value) continue;
    if (seen.has(value)) duplicates.push([path, seen.get(value)]);
    else seen.set(value, path);
  }
  return duplicates;
}
