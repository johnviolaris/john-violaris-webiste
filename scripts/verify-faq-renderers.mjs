/** Render actual article/service templates against fixture-only metadata; no database or HTTP calls. */
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { registerHooks } from "node:module";
import { pathToFileURL } from "node:url";
import ts from "typescript";
import { renderToStaticMarkup } from "react-dom/server";
import { validateSchemaNodes } from "../lib/cms/seo/schema-validation.ts";
import { toArticle, toServiceGroups } from "../lib/cms/mappers.ts";
import { seedBlogPosts, seedServiceGroups, seedServicePages, seedServices } from "../lib/cms/seed-data.ts";
import { resolveSiteConfig } from "../lib/site-config.ts";
import { resolveFaqItems, faqAnswerText } from "../lib/cms/faq.ts";
import { serviceDetails } from "../lib/content/service-detail.ts";
import { articles } from "../lib/content/blog.ts";

const rootUrl = pathToFileURL(`${process.cwd()}/`).href;
const metadataUrl = new URL("lib/cms/seo/metadata.ts", rootUrl).href;
// The only boundary replaced is external metadata loading. JSX dependencies and
// both page renderers remain their actual source, transpiled with installed TS.
const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (["next/image", "next/link", "next/navigation"].includes(specifier)) return nextResolve(`${specifier}.js`, context);
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url === metadataUrl) return { format: "module", shortCircuit: true, source: `
      import { siteNodes } from "@/lib/cms/seo/json-ld";
      import { resolveSiteConfig } from "@/lib/site-config";
      export let calls = 0;
      export async function structuredDataFor(path, title) {
        calls++;
        return { page: { path, title, canonical: path, description: "Fixture-only page description." }, site: siteNodes({ config: resolveSiteConfig({}), practiceAreas: [], portrait: "/portrait.webp" }) };
      }
    ` };
    if (url.startsWith(rootUrl) && url.endsWith(".tsx")) return { format: "module", shortCircuit: true, source: ts.transpileModule(readFileSync(new URL(url), "utf8"), { compilerOptions: { module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }).outputText };
    return nextLoad(url, context);
  },
});

try {
  // The long-form offence pages live one to a file and are imported by
  // `service-detail.ts`; each is compared with its own committed copy, since
  // the committed `service-detail.ts` would otherwise import today's files.
  const pageFiles = readdirSync("lib/content/service-pages").filter((file) => file.endsWith(".ts"));
  const pageModules = await Promise.all(pageFiles.map((file) => import(`../lib/content/service-pages/${file}`)));
  const contentFiles = [
    ["lib/content/service-detail.ts", "serviceDetails", serviceDetails],
    ["lib/content/blog.ts", "articles", articles],
    ...pageFiles.flatMap((file, index) =>
      Object.entries(pageModules[index]).map(([name, current]) => [`lib/content/service-pages/${file}`, name, current])),
  ];
  for (const [file, name, current] of contentFiles) {
    const original = execFileSync("git", ["show", `HEAD:${file}`], { encoding: "utf8" });
    const source = ts.transpileModule(original, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
    const baseline = await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
    assert.deepEqual(current, baseline[name], `${file}: every original public text value remains unchanged.`);
  }
  const { ArticlePageContent } = await import("../components/pages/article-page-content.tsx");
  const { ServicePageContent } = await import("../components/pages/service-page-content.tsx");
  const metadata = await import(metadataUrl);
  const config = resolveSiteConfig({});
  const groups = toServiceGroups(seedServices, seedServiceGroups);
  const page = seedServicePages[0];
  const owner = seedServices.find((service) => service.id === page.service_id);
  const service = groups.flatMap((group) => group.services).find((candidate) => candidate.href === `/services/${owner.slug}`);
  assert.ok(service, "Fixture service is present in the actual catalogue mapping.");
  const article = toArticle(seedBlogPosts[0], "Guides");
  const faqItems = [{ question: "What should I bring?", answer: "Bring **your letter** and read [contact details](/contact)." }, { question: "May I ask a question?", answer: "Explain *your circumstances* first." }];
  const renderArticle = async (items, preview) => renderToStaticMarkup(await ArticlePageContent({ article: { ...article, ...(items !== undefined ? { faqItems: items } : {}) }, articles: [], services: [], config, preview }));
  const renderService = async (items, preview) => renderToStaticMarkup(await ServicePageContent({ service, detail: { ...page.content, ...(items !== undefined ? { faqItems: items } : {}) }, groups, descriptions: {}, config, preview }));
  let checks = 0;
  for (const render of [renderArticle, renderService]) {
    for (const items of [undefined, [], null, faqItems]) {
      const publicHtml = await render(items, false);
      const previewHtml = await render(items, true);
      const scripts = [...publicHtml.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
      assert.equal(scripts.length, 1);
      assert.doesNotMatch(previewHtml, /application\/ld\+json/);
      assert.equal(publicHtml.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, ""), previewHtml, "Preview body and public body have identical saved content.");
      const nodes = JSON.parse(scripts[0][1])["@graph"];
      assert.deepEqual(validateSchemaNodes(nodes), []);
      const faqs = nodes.filter((node) => node["@type"] === "FAQPage");
      if (resolveFaqItems(items).length) {
        assert.equal(faqs.length, 1);
        assert.deepEqual(faqs[0].mainEntity.map((node) => ({ question: node.name, answer: node.acceptedAnswer.text })), faqItems.map((item) => ({ question: item.question, answer: faqAnswerText(item.answer) })));
        assert.match(publicHtml, /<summary[^>]*>What should I bring\?<\/summary>/);
        assert.match(publicHtml, /<strong>your letter<\/strong>/);
        assert.match(publicHtml, /href="#frequently-asked-questions"/);
      } else {
        assert.equal(faqs.length, 0);
        assert.doesNotMatch(publicHtml, /Frequently asked questions|<summary|href="#frequently-asked-questions"/);
      }
      checks++;
    }
  }
  assert.equal(metadata.calls, 8, "Only public renders load public metadata; previews do not.");
  console.log(`FAQ renderer parity: ${checks} article/service empty, malformed and saved cases passed; preview content, semantic FAQ markup and complete schema graphs agree. Original article and service copy equals HEAD.`);
} finally {
  hooks.deregister();
}
