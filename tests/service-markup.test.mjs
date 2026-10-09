import assert from "node:assert/strict";
import test from "node:test";
import {
  inlineText,
  isSafeHref,
  markupLinks,
  markupText,
  parseInline,
  parseServiceMarkup,
} from "../lib/content/service-markup.ts";
import { serviceDetails } from "../lib/content/service-detail.ts";
import { serviceGroups } from "../lib/content/services.ts";
import { internalLinkPaths } from "../lib/cms/seo/health.ts";

test("paragraphs, headings, labels and small print", () => {
  const blocks = parseServiceMarkup(
    "First line\nwrapped on.\n\n### A heading\n\n#### A title\n\n##### A label\n\n###### Small print",
  );

  assert.deepEqual(blocks, [
    { type: "paragraph", text: "First line wrapped on." },
    { type: "heading", depth: 3, text: "A heading" },
    { type: "heading", depth: 4, text: "A title" },
    { type: "label", text: "A label" },
    { type: "small", text: "Small print" },
  ]);
});

test("textarea line endings are read the same as plain ones", () => {
  assert.deepEqual(
    parseServiceMarkup("One\r\n\r\n- a\r\n- b"),
    parseServiceMarkup("One\n\n- a\n- b"),
  );
});

test("bulleted and numbered lists, with wrapped items", () => {
  assert.deepEqual(parseServiceMarkup("- one\n- two\ncontinued\n\n1. first\n2. second"), [
    { type: "list", ordered: false, items: ["one", "two continued"] },
    { type: "list", ordered: true, items: ["first", "second"] },
  ]);
});

test("tables skip the divider row, keep escaped pipes and square up short rows", () => {
  const [table] = parseServiceMarkup("| A | B | C |\n| --- | --- | --- |\n| 1 | 2 \\| 3 |\n| x | y | z |");

  assert.deepEqual(table, {
    type: "table",
    head: ["A", "B", "C"],
    rows: [
      ["1", "2 \\| 3", ""],
      ["x", "y", "z"],
    ],
  });
  assert.equal(inlineText(table.rows[0][1]), "2 | 3");
});

test("boxes, cards and steps, split on lines of ---", () => {
  const blocks = parseServiceMarkup(
    [
      "::: warning",
      "#### Careful",
      "Text.",
      ":::",
      "",
      "::: cards",
      "##### Label",
      "#### One",
      "Body one.",
      "---",
      "#### Two",
      "- a",
      ":::",
      "",
      "::: steps",
      "#### First",
      "---",
      "#### Second",
      ":::",
    ].join("\n"),
  );

  assert.equal(blocks.length, 3);
  assert.deepEqual(blocks[0], {
    type: "box",
    tone: "warning",
    blocks: [
      { type: "heading", depth: 4, text: "Careful" },
      { type: "paragraph", text: "Text." },
    ],
  });
  assert.equal(blocks[1].type, "cards");
  assert.equal(blocks[1].items.length, 2);
  assert.deepEqual(blocks[1].items[0][0], { type: "label", text: "Label" });
  assert.deepEqual(blocks[1].items[1][1], { type: "list", ordered: false, items: ["a"] });
  assert.equal(blocks[2].type, "steps");
  assert.equal(blocks[2].items.length, 2);
});

test("hand-typed mistakes still produce a readable page", () => {
  // Never closed: runs to the end rather than swallowing nothing.
  const [unclosed] = parseServiceMarkup("::: note\nStill shown.");
  assert.deepEqual(unclosed, { type: "box", tone: "note", blocks: [{ type: "paragraph", text: "Still shown." }] });

  // A stray closing fence and an unknown kind are not errors.
  assert.deepEqual(parseServiceMarkup(":::\nText"), [{ type: "paragraph", text: "Text" }]);
  assert.equal(parseServiceMarkup("::: aside\nText\n:::")[0].tone, "note");

  // A container inside a card keeps its contents and drops the fence.
  const [cards] = parseServiceMarkup("::: cards\n::: note\nInner\n:::\n:::");
  assert.equal(cards.type, "cards");
});

test("inline marks: bold, italic, links and line breaks", () => {
  assert.deepEqual(parseInline("A **bold *and italic* run** then *italic*."), [
    { type: "text", value: "A " },
    {
      type: "strong",
      children: [
        { type: "text", value: "bold " },
        { type: "em", children: [{ type: "text", value: "and italic" }] },
        { type: "text", value: " run" },
      ],
    },
    { type: "text", value: " then " },
    { type: "em", children: [{ type: "text", value: "italic" }] },
    { type: "text", value: "." },
  ]);
  assert.deepEqual(parseInline("Band D fine<br>7–9 pts"), [
    { type: "text", value: "Band D fine" },
    { type: "break" },
    { type: "text", value: "7–9 pts" },
  ]);
  assert.deepEqual(parseInline("[Speeding](/services/speeding)"), [
    { type: "link", href: "/services/speeding", children: [{ type: "text", value: "Speeding" }] },
  ]);
  assert.equal(inlineText("5 \\* 3 and a lone * star"), "5 * 3 and a lone * star");
});

test("links that could run script are shown as text", () => {
  assert.equal(isSafeHref("javascript:alert(1)"), false);
  assert.equal(isSafeHref("//example.com"), false);
  assert.equal(isSafeHref("https://www.sentencingcouncil.org.uk"), true);
  assert.equal(isSafeHref("/fees"), true);
  assert.deepEqual(parseInline("[click](javascript:alert(1))"), [{ type: "text", value: "click" }]);
});

test("words and links can be read back out of a parse", () => {
  const blocks = parseServiceMarkup("Source: [Sentencing Council](https://www.sentencingcouncil.org.uk).\n\n- See [fees](/fees)");

  assert.deepEqual(markupText(blocks), ["Source: Sentencing Council.", "See fees"]);
  assert.deepEqual(markupLinks(blocks), ["https://www.sentencingcouncil.org.uk", "/fees"]);
});

test("internal links written in markup are checked like any other content link", () => {
  const content = { sections: [{ heading: "H", body: "Read [this](/services/speeding#nip) and [that](https://example.com)." }] };

  assert.deepEqual(internalLinkPaths(content, "https://johnviolaris.com"), ["/services/speeding"]);
});

// ---------------------------------------------------------------------------
// The long-form pages themselves
// ---------------------------------------------------------------------------

const longForm = Object.entries(serviceDetails).filter(([, detail]) => detail.sections?.length);
const sitePaths = new Set([
  ...serviceGroups.flatMap((group) => group.services.map((service) => service.href)),
  "/services",
  "/fees",
  "/police-station",
]);

test("John's eleven long-form pages are present", () => {
  assert.deepEqual(longForm.map(([path]) => path).sort(), [
    "/services/careless-driving",
    "/services/dangerous-driving",
    "/services/drink-driving",
    "/services/driver-details",
    "/services/drug-driving",
    "/services/failing-to-provide",
    "/services/failing-to-stop",
    "/services/mobile-phone",
    "/services/no-insurance",
    "/services/special-reasons",
    "/services/speeding",
  ]);
});

test("every long-form section parses into content, and every card and stage has a title", () => {
  for (const [path, detail] of longForm) {
    for (const section of detail.sections) {
      const blocks = parseServiceMarkup(section.body);
      assert.ok(blocks.length > 0, `${path}: "${section.heading}" is empty`);

      const containers = blocks.filter((block) => block.type === "cards" || block.type === "steps");
      for (const container of containers) {
        assert.ok(container.items.length > 0, `${path}: empty ${container.type}`);
        for (const item of container.items) {
          assert.ok(
            item.some((block) => block.type === "heading"),
            `${path}: a ${container.type} item in "${section.heading}" has no title`,
          );
        }
      }
    }
  }
});

test("long-form links point at pages the site has, or at a full web address", () => {
  for (const [path, detail] of longForm) {
    for (const link of detail.relatedLinks ?? []) {
      assert.ok(sitePaths.has(link.href), `${path}: related link to unknown ${link.href}`);
    }
    for (const section of detail.sections) {
      for (const href of markupLinks(parseServiceMarkup(section.body))) {
        assert.ok(
          href.startsWith("https://") || sitePaths.has(href),
          `${path}: link to ${href}`,
        );
      }
    }
  }
});

test("the fixed-fee boxes stayed out: no page carries the fee schedule", () => {
  // The rows of the price boxes in John's drafts. No prices are published.
  const scheduleRows = /Single hearing \(guilty plea\)|First appearance & trial|Three-hearing case|Additional \/ adjourned hearing|Police station \(if private\)|All fees fixed and inclusive/;

  for (const [path, detail] of longForm) {
    assert.doesNotMatch(JSON.stringify(detail), scheduleRows, path);
  }
});
