import assert from "node:assert/strict";
import test from "node:test";
import { execFileSync } from "node:child_process";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { faqAnswerText, faqCountField, faqField, faqLimits, faqRepairField, faqSectionId, readFaqItems, resolveFaqItems, validateFaqItems } from "../lib/cms/faq.ts";
import { FaqBlock } from "../components/ui/faq-block.ts";
import { absoluteUrl, articleId, blogPostingNode, breadcrumbNode, faqPageNode, graph, serializeJsonLd, serviceId, serviceNode, webPageNode } from "../lib/cms/seo/json-ld.ts";
import { automaticSchemaIds, validateSchemaNodes } from "../lib/cms/seo/schema-validation.ts";
import { validateCustomJsonLd } from "../lib/cms/seo/custom-json-ld.ts";
import { publicationSeoWarnings } from "../lib/cms/seo/publication-warnings.ts";
import { seedBlogPosts, seedServicePages } from "../lib/cms/seed-data.ts";
import { toArticle } from "../lib/cms/mappers.ts";

const items = [
  { question: "What should I bring?", answer: "Bring **the letter** and read the [contact information](/contact)." },
  { question: "Can I ask a question?", answer: "Yes.\n*Explain your circumstances* first." },
];
const markup = (value) => renderToStaticMarkup(createElement(FaqBlock, { items: value }));

test("legacy and seeded pages acquire no FAQ content, markup or schema", () => {
  assert.deepEqual(validateFaqItems(undefined), { ok: true, items: [] });
  for (const row of [...seedBlogPosts, ...seedServicePages]) {
    assert.equal(Object.hasOwn(row.content, "faqItems"), false);
    assert.equal(markup(row.content.faqItems), "");
    assert.equal(faqPageNode({ path: "/blog/example", items: row.content.faqItems }), null);
  }
});

test("saved FAQ ordering survives JSONB-shaped mapping, form reordering and removal", () => {
  const row = { ...seedBlogPosts[0], content: { ...seedBlogPosts[0].content, faqItems: items } };
  assert.deepEqual(toArticle(JSON.parse(JSON.stringify(row)), "Guides").faqItems, items);
  const form = new FormData();
  form.set(faqCountField, "3");
  for (const [index, item] of [items[1], items[0], { question: "", answer: "" }].entries()) {
    for (const part of ["question", "answer"]) form.set(faqField(index, part), item[part]);
  }
  assert.deepEqual(readFaqItems(form), { ok: true, items: [items[1], items[0]] });
  assert.deepEqual(readFaqItems(new FormData(), items), { ok: true, items });
  form.set(faqCountField, "0");
  assert.deepEqual(readFaqItems(form, items), { ok: true, items: [] });
});

test("explicit invalid FAQ data cannot be saved/published/restored and is omitted publicly", () => {
  const malformed = [null, {}, "questions", [{ question: "", answer: "Text" }], [{ question: "Question?", answer: "" }], [{ question: "Question?", answer: "** **" }], [{ question: "Question?", answer: "Text", script: "code" }], [{ question: "Q?", answer: "Text" }, { question: " q? ", answer: "Another answer" }], [{ question: "x".repeat(faqLimits.question + 1), answer: "Text" }], [{ question: "Q?", answer: "x".repeat(faqLimits.answer + 1) }], Array.from({ length: faqLimits.items + 1 }, (_, index) => ({ question: `${index}?`, answer: "Text" }))];
  for (const value of malformed) {
    assert.equal(validateFaqItems(value).ok, false);
    assert.deepEqual(resolveFaqItems(value), []);
    assert.equal(markup(value), "");
    assert.equal(faqPageNode({ path: "/services/example", items: value }), null);
    assert.equal(readFaqItems(new FormData(), value).ok, false);
  }
  for (const count of ["-1", "1.5", "21", "Infinity", "2e1"]) {
    const form = new FormData(); form.set(faqCountField, count);
    assert.equal(readFaqItems(form).ok, false);
  }
  const form = new FormData(); form.set(faqCountField, "1");
  assert.equal(readFaqItems(form).ok, false);
  form.set(faqCountField, "0");
  assert.equal(readFaqItems(form, null).ok, false, "An unrelated save cannot silently clear malformed saved FAQs.");
  form.set(faqRepairField, "on");
  assert.deepEqual(readFaqItems(form, null), { ok: true, items: [] });
});

test("FAQ rich answers keep safe links/emphasis, escape HTML and share schema text", () => {
  const html = markup(items);
  assert.match(html, /<summary[^>]*>What should I bring\?<\/summary>/);
  assert.match(html, /<strong>the letter<\/strong>/);
  assert.match(html, /href="\/contact"/);
  assert.match(html, /<em>Explain your circumstances<\/em>/);
  const faq = faqPageNode({ path: "/blog/fixture", items });
  assert.deepEqual(faq.mainEntity.map((question) => question.name), items.map((item) => item.question));
  assert.deepEqual(faq.mainEntity.map((question) => question.acceptedAnswer.text), items.map((item) => faqAnswerText(item.answer)));
  assert.equal(faq.mainEntity[0].acceptedAnswer.text, "Bring the letter and read the contact information.");
  const hostileText = [{ question: "<img src=x onerror=alert(1)>", answer: "</script><script>alert(1)</script>" }];
  assert.match(markup(hostileText), /&lt;script&gt;/);
  assert.doesNotMatch(markup(hostileText), /<script|<img/);
  assert.doesNotMatch(serializeJsonLd(graph([faqPageNode({ path: "/blog/fixture", items: hostileText })])), /<script|<\/script/);
  for (const target of ["javascript:alert(1)", "//evil.example", "https://user:pass@example.com", "https://example.com/a b", "data:text/html,hi"]) {
    assert.equal(validateFaqItems([{ question: "Q?", answer: `[link](${target})` }]).ok, false, target);
  }
});

test("one connected FAQPage part preserves article/service subjects and passes vocabulary checks", () => {
  for (const path of ["/blog/fixture", "/services/fixture"]) {
    const article = path.startsWith("/blog/");
    const faq = faqPageNode({ path, items });
    const page = webPageNode({ page: { path, title: "Fixture", canonical: path }, about: article ? null : serviceId(path), ...(article ? { mainEntity: { "@id": articleId(path) } } : {}), hasPart: { "@id": faq["@id"] }, hasBreadcrumb: true });
    const subject = article ? blogPostingNode({ path, headline: "Fixture", datePublished: "2026-10-05" }) : serviceNode({ path, name: "Fixture", description: "Fixture description", jurisdiction: "England and Wales" });
    const nodes = [page, subject, breadcrumbNode(path, [{ name: "Fixture", path }]), faq];
    assert.deepEqual(validateSchemaNodes(nodes, automaticSchemaIds(path, "https://johnviolaris.com", true).filter((id) => !nodes.some((node) => node["@id"] === id))), []);
    assert.equal(nodes.filter((node) => node["@type"] === "FAQPage").length, 1);
    assert.equal(faq.isPartOf["@id"], page["@id"]);
    if (article) assert.equal(page.mainEntity["@id"], subject["@id"]);
    else assert.equal(page.about["@id"], subject["@id"]);
    assert.equal(validateCustomJsonLd(JSON.stringify({ "@type": "FAQPage", "@id": "#other-faq", mainEntity: [] }), path, "https://johnviolaris.com").ok, false);
    assert.equal(validateCustomJsonLd(JSON.stringify({ "@type": "CreativeWork", "@id": "#faq", name: "Duplicate" }), path, "https://johnviolaris.com").ok, false);
  }
  assert.equal(faqSectionId(["frequently-asked-questions", "frequently-asked-questions-2"]), "frequently-asked-questions-3");
  assert.equal(faqSectionId(["frequently-asked-questions-heading", "frequently-asked-questions-2-heading"]), "frequently-asked-questions-3");
  assert.equal(faqPageNode({ path: "/blog/fixture", items, sectionId: "unique-faq" }).url, `${absoluteUrl("/blog/fixture")}#unique-faq`);
});

test("publication advisories validate pending FAQ payload through the same graph builders", () => {
  const base = { path: "/blog/fixture", defaults: { title: "Fixture guide", description: "A complete fixture description explaining the page for a reader.", ogType: "article", publishedTime: "2026-10-05" }, siteName: "John Violaris", siteUrl: "https://johnviolaris.com" };
  assert.ok(publicationSeoWarnings({ ...base, content: { faqItems: null } }).some((warning) => warning.startsWith("FAQs:")));
  assert.equal(publicationSeoWarnings({ ...base, content: { faqItems: items } }).some((warning) => /FAQs:|Structured data:/.test(warning)), false);
});

test("actual public and preview templates keep FAQ/body/schema parity without external data", () => {
  const output = execFileSync(process.execPath, ["--import", "./scripts/alias-hook.mjs", "scripts/verify-faq-renderers.mjs"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  assert.match(output, /8 article\/service empty, malformed and saved cases passed/);
  assert.match(output, /Original article and service copy equals HEAD/);
});
