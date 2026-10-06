/** Actual renderer against local-only fixtures; no database, network, seed or publication. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import { pathToFileURL } from "node:url";
import ts from "typescript";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { validateSchemaNodes } from "../lib/cms/seo/schema-validation.ts";
import { resolveSiteConfig } from "../lib/site-config.ts";
import { faqAnswerText, resolveFaqItems } from "../lib/cms/faq.ts";

const root = pathToFileURL(`${process.cwd()}/`).href;
const metadataUrl = new URL("lib/cms/seo/metadata.ts", root).href;
const legacyUrl = new URL("tests/location-legacy-renderer.tsx", root).href;
const legacySource = readFileSync(new URL("./fixtures/location-legacy-renderer.fixture", import.meta.url), "utf8");
const compile = (source) => ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }).outputText;
const hook = registerHooks({
  resolve(specifier, context, next) {
    if (specifier === "./location-legacy-renderer.tsx") return { url: legacyUrl, shortCircuit: true };
    if (["next/image", "next/link", "next/navigation"].includes(specifier)) return next(`${specifier}.js`, context);
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url === metadataUrl) return { format: "module", shortCircuit: true, source: `import { siteNodes } from "@/lib/cms/seo/json-ld"; import { resolveSiteConfig } from "@/lib/site-config"; export let calls=0; export async function structuredDataFor(path,title){calls++;return {page:{path,title,canonical:path,description:"Private rendering fixture."},site:siteNodes({config:resolveSiteConfig({}),practiceAreas:[],portrait:"/john-violaris-portrait.webp"})};}` };
    if (url === legacyUrl) return { format: "module", shortCircuit: true, source: compile(legacySource) };
    if (url.startsWith(root) && url.endsWith(".tsx")) return { format: "module", shortCircuit: true, source: compile(readFileSync(new URL(url), "utf8")) };
    return next(url, context);
  },
});
try {
  const { LocationPageContent } = await import("../components/pages/location-page-content.tsx");
  const { LocationPageContent: LegacyContent } = await import("./location-legacy-renderer.tsx");
  const { LocationCourtFields } = await import("../components/admin/location-courts.tsx");
  const config = resolveSiteConfig({});
  const services = [{ name: "Service rendering fixture", href: "/services/speeding" }];
  const locations = [{ slug: "neighbour-fixture", location: "Neighbour fixture", title: "Neighbour rendering fixture" }];
  const base = { slug: "location-fixture", location: "Private rendering fixture", title: "Location rendering fixture", updated_at: "2026-10-06T00:00:00Z", content: { description: "Private fixture description", intro: "Private rendering fixture; never published.", localContext: ["Local fixture paragraph."], body: ["First fixture paragraph.", "Second fixture paragraph."], relatedServices: ["/services/speeding"] } };
  const courts = [{ name: "Court rendering fixture", details: "Private fixture details, not a real court statement.", address: "Fixture address, not a real court address", officialUrl: "https://www.gov.uk/find-court-tribunal" }];
  const faqItems = [{ question: "How does this fixture work?", answer: "Read **the fixture** and [contact details](/contact)." }];
  const optional = { courts, faqItems, parentService: "/services/speeding", relatedLocations: ["/locations/neighbour-fixture", "/locations/withdrawn-fixture", "/locations/location-fixture"] };
  const variants = [undefined, {}, optional, { courts: null, faqItems: null, parentService: "javascript:bad", relatedLocations: ["/admin"] }, { courts: [{ ...courts[0], name: "<script>fixture</script>", details: "<img src=x onerror=fixture>" }], faqItems: [{ question: "<script>fixture</script>", answer: "</script><script>fixture</script>" }] }];
  let count = 0;
  for (const additions of variants) {
    const location = { ...base, content: { ...base.content, ...additions } };
    const props = { location, services, locations, config };
    const publicHtml = renderToStaticMarkup(await LocationPageContent(props));
    const previewHtml = renderToStaticMarkup(await LocationPageContent({ ...props, preview: true }));
    const scripts = [...publicHtml.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
    assert.equal(scripts.length, 1);
    assert.doesNotMatch(previewHtml, /application\/ld\+json/);
    assert.equal(publicHtml.replace(scripts[0][0], ""), previewHtml, "Public/preview display exactly the same saved fixture content.");
    const nodes = JSON.parse(scripts[0][1])["@graph"];
    assert.deepEqual(validateSchemaNodes(nodes), []);
    assert.equal(nodes.find((node) => node["@type"] === "LegalService").address, undefined, "A court address is never emitted as a business/office address.");
    const faq = nodes.find((node) => node["@type"] === "FAQPage");
    const savedFaqs = resolveFaqItems(additions?.faqItems);
    assert.equal(Boolean(faq), savedFaqs.length > 0);
    if (faq) {
      assert.deepEqual(faq.mainEntity.map((question) => ({ question: question.name, answer: question.acceptedAnswer.text })), savedFaqs.map((item) => ({ question: item.question, answer: faqAnswerText(item.answer) })));
      assert.equal(nodes.find((node) => node["@type"] === "WebPage").hasPart["@id"], faq["@id"]);
      assert.match(previewHtml, /<summary/);
    }
    if (additions === optional) {
      assert.match(previewHtml, /Court address:/);
      assert.match(previewHtml, /href="https:\/\/www.gov.uk\/find-court-tribunal"/);
      assert.match(previewHtml, /href="\/locations\/neighbour-fixture"/);
      assert.doesNotMatch(previewHtml, /href="\/locations\/(?:withdrawn|location)-fixture"/);
      assert.equal(nodes.find((node) => node["@type"] === "BreadcrumbList").itemListElement[1].item, "https://johnviolaris.com/services/speeding");
    }
    if (additions === undefined) assert.equal(previewHtml, renderToStaticMarkup(await LegacyContent({ ...props, preview: true })), "All legacy body/H1 wording and markup match the fixed a36e0b2 baseline.");
    if (count === 4) { assert.match(previewHtml, /&lt;script&gt;/); assert.doesNotMatch(previewHtml, /<script|<img src=x/); }
    count++;
  }
  const invalidEditor = renderToStaticMarkup(createElement(LocationCourtFields, { initialItems: null }));
  assert.match(invalidEditor, /name="replaceInvalidCourts"/);
  assert.match(invalidEditor, /Saved court details cannot be read safely/);
  assert.doesNotMatch(renderToStaticMarkup(createElement(LocationCourtFields)), /Saved court details cannot be read safely/);
  console.log(`Location renderer: ${count} isolated cases passed; preview/FAQ/schema/court-address/link safety agree. Legacy body equals fixed a36e0b2 baseline. No DB or HTTP calls.`);
} finally { hook.deregister(); }
