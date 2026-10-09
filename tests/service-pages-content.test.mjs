import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import { pathToFileURL } from "node:url";
import test from "node:test";
import ts from "typescript";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFields, validateFields } from "../lib/cms/form.ts";
import { itemCountName, itemFieldName } from "../lib/cms/sections/schema.ts";
import {
  servicePageAsSection,
  servicePageContentFrom,
  servicePageFields,
  servicePageItemFields,
  servicePageRules,
  servicePageValuesFrom,
} from "../lib/cms/service-pages/schema.ts";
import { serviceDetails } from "../lib/content/service-detail.ts";

// The item readers and the renderer import TSX components; transpile those as
// the other render tests do.
const root = pathToFileURL(`${process.cwd()}/`).href;
registerHooks({
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
const { itemRowsFrom, readItems } = await import("../lib/cms/sections/values.ts");
const { ServiceMarkup } = await import("../components/pages/service-markup.tsx");

/**
 * What the offence-page editor submits for a stored page, untouched: every
 * field as it was loaded, textareas with the CRLF line endings browsers send.
 */
function submissionFor(content) {
  const form = new FormData();
  const crlf = (value) => String(value).replace(/\n/g, "\r\n");

  for (const [field, value] of Object.entries(servicePageValuesFrom(content))) {
    if (servicePageFields.includes(field)) form.set(field, crlf(value));
  }

  for (const field of servicePageItemFields) {
    const rows = itemRowsFrom(field, servicePageAsSection(content));

    form.set(itemCountName(field.key), String(rows.length));
    rows.forEach((row, index) => {
      for (const [part, value] of Object.entries(row)) {
        form.set(itemFieldName(field.key, index, part), crlf(value));
      }
    });
  }

  return form;
}

/** The save action's reading of a submission, without the database. */
function saved(form, previous) {
  const validation = validateFields(readFields(form, servicePageFields), servicePageRules);
  assert.equal(validation.ok, true, JSON.stringify(validation.fieldErrors));

  const items = {};
  for (const field of servicePageItemFields) {
    const result = readItems(field, form);
    assert.equal(result.error, undefined, `${field.key}: ${result.error}`);
    items[field.key] = result.items;
  }

  return servicePageContentFrom(validation.values, items, {
    process: previous.process,
    faqItems: previous.faqItems ?? [],
  });
}

test("saving an unchanged page in the editor stores exactly what was loaded", () => {
  for (const [path, content] of Object.entries(serviceDetails)) {
    assert.deepEqual(saved(submissionFor(content), content), content, path);
  }
});

test("an edit to one section changes that section and nothing else", () => {
  const content = serviceDetails["/services/careless-driving"];
  const form = submissionFor(content);
  const body = "A new opening paragraph.\r\n\r\n::: note\r\n#### A box\r\nIts text.\r\n:::";

  form.set(itemFieldName("sections", 0, "body"), body);

  const after = saved(form, content);
  assert.equal(after.sections[0].body, body.replace(/\r\n/g, "\n"));
  assert.deepEqual(after.sections.slice(1), content.sections.slice(1));
  assert.deepEqual({ ...after, sections: content.sections }, content);
});

test("the editor's limits leave John's pages room to grow", () => {
  // The round trip above proves nothing is trimmed today; this keeps headroom,
  // since over-long text is truncated on save rather than rejected.
  const longForm = Object.entries(serviceDetails).filter(([, content]) => content.sections?.length);

  for (const [path, content] of longForm) {
    for (const field of servicePageFields) {
      const value = content[field];
      if (typeof value === "string") {
        assert.ok(value.length <= servicePageRules[field].maxLength, `${path}: ${field}`);
      }
    }
    for (const field of servicePageItemFields) {
      const rows = content[field.key] ?? [];
      assert.ok(rows.length <= field.item.max, `${path}: too many ${field.key}`);
      for (const row of rows) {
        for (const sub of field.item.fields) {
          const value = row[sub.key];
          if (typeof value === "string" && sub.maxLength) {
            assert.ok(value.length <= sub.maxLength / 2, `${path}: ${field.key}.${sub.key} is near its limit`);
          }
        }
      }
    }
  }
});

// ---------------------------------------------------------------------------
// The renderer
// ---------------------------------------------------------------------------

const render = (source) =>
  renderToStaticMarkup(createElement(ServiceMarkup, { source, label: "Section" }));
const headingLevels = (html) => [...html.matchAll(/<h([1-6])\b/g)].map((match) => Number(match[1]));

test("headings inside a section never skip a level below its h2", () => {
  // A card title before any sub-heading is an h3; after one, an h4.
  assert.deepEqual(
    headingLevels(render("::: cards\n#### Card\nText.\n:::\n\n### Sub-heading\n\n#### Smaller\n\n::: steps\n#### Stage\n:::")),
    [3, 3, 4, 4],
  );

  for (const [path, content] of Object.entries(serviceDetails)) {
    for (const section of content.sections ?? []) {
      const levels = headingLevels(render(section.body));
      levels.forEach((level, index) => {
        const previous = index === 0 ? 2 : levels[index - 1];
        assert.ok(level >= 3 && level <= previous + 1, `${path}: "${section.heading}" skips to h${level}`);
      });
    }
  }
});

test("the renderer escapes text and keeps only safe links", () => {
  const html = render("A <script>alert(1)</script> and [bad](javascript:alert(1)) and [good](/fees).");

  assert.doesNotMatch(html, /<script/);
  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(html, /javascript:/);
  assert.match(html, /<a class="sp-link" href="\/fees">good<\/a>/);
});

test("tables, boxes, cards and steps render as accessible structures", () => {
  const html = render("| A | B |\n| --- | --- |\n| 1 | 2<br>3 |\n\n::: warning\n#### Careful\nText.\n:::\n\n::: steps\n#### One\n---\n#### Two\n:::");

  assert.match(html, /<div class="sp-table-wrap" role="region" aria-label="Section — table" tabindex="0">/);
  assert.match(html, /<th scope="col">A<\/th>/);
  assert.match(html, /<td>2<br\/>3<\/td>/);
  assert.match(html, /<div class="sp-box sp-box--warning" role="note">/);
  assert.match(html, /<ol class="sp-steps" role="list">/);
  assert.equal((html.match(/class="sp-step"/g) ?? []).length, 2);
});
