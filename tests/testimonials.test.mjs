import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { registerHooks, createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import test from "node:test";
import ts from "typescript";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const root = pathToFileURL(`${process.cwd()}/`).href;
const hook = registerHooks({
  resolve(specifier, context, next) {
    if (specifier === "next/link") return next("next/link.js", context);
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url.startsWith(root) && url.endsWith(".tsx")) {
      return { format: "module", shortCircuit: true, source: ts.transpileModule(readFileSync(new URL(url), "utf8"), { compilerOptions: { module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }).outputText };
    }
    return next(url, context);
  },
});
const { TestimonialColumn } = await import("../components/ui/testimonial-column.tsx");
const { Testimonials } = await import("../components/sections/testimonials.tsx");
const { testimonials } = await import("../lib/content/home.ts");
hook.deregister();
const { parse } = createRequire(import.meta.url)("next/dist/compiled/node-html-parser");
const render = (component, props) => parse(renderToStaticMarkup(createElement(component, props)));
const exposedCards = column => column.getAttribute("aria-hidden") === "true" ? [] : column.querySelectorAll("figure:not([aria-hidden=true])");

test("marquee keeps enough visual cards but exposes each source review only once", () => {
  for (const count of [0, 1, 2, 3, 4, 5, 8]) {
    const reviews = Array.from({ length: count }, (_, i) => ({ name: `Reviewer ${i}`, quote: `Unique quote ${i}`, rating: 5 }));
    const column = render(TestimonialColumn, { testimonials: reviews }).querySelector(".voices-column");
    const visibleCopies = count ? Math.ceil(4 / count) * count * 2 : 0;
    assert.equal(column.querySelectorAll("figure").length, visibleCopies, "The existing visual loop is preserved.");
    assert.deepEqual(exposedCards(column).map(card => card.querySelector("blockquote").text), reviews.map(review => review.quote));
  }
});

test("decorative repeated columns retain their markup while exposing no duplicate reviews", () => {
  const visible = render(TestimonialColumn, { testimonials });
  const decorative = render(TestimonialColumn, { testimonials, ariaHidden: true });
  assert.equal(decorative.toString().replace(' aria-hidden="true"', ""), visible.toString());
  assert.equal(exposedCards(decorative.querySelector(".voices-column")).length, 0);
});

test("current mobile and desktop arrangements expose all real reviews once", () => {
  const tree = render(Testimonials);
  const mobile = tree.querySelectorAll(".voices-column-stacked");
  const desktop = tree.querySelectorAll(".voices-column-split");
  for (const columns of [mobile, desktop]) {
    assert.deepEqual(columns.flatMap(exposedCards).map(card => card.querySelector("blockquote").text).sort(), testimonials.map(review => review.quote).sort());
  }
  assert.equal(tree.querySelectorAll(".voice-card").length, 48, "All four current visual tracks keep twelve cards.");
});
