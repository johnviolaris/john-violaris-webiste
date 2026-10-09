import {
  initialCmsFormState,
  type CmsFormState,
  type FieldRule,
} from "@/lib/cms/form";
import type { FaqItem } from "@/lib/cms/faq";
import type {
  ItemField,
  SectionContent,
  SectionField,
  SectionItem,
} from "@/lib/cms/sections/schema";
import type { ServicePageContent } from "@/lib/cms/types";
import type {
  PenaltyCard,
  ServiceLink,
  ServiceSection,
  TableRow,
} from "@/lib/content/service-detail";

/**
 * The offence-page editor's fields, rules and encoding.
 *
 * Two kinds of field, and they are handled by what already exists for each:
 *
 *  - The single-value fields run through `validateFields`, as every editor's
 *    do.
 *  - The repeating groups — the at-a-glance cards, the long-form sections and
 *    related pages, the points examined, the two tables — are described as
 *    `SectionField`s, so the editor renders them with the same `ItemsField` as
 *    Website Content and the action reads them back with the same `readItems`.
 *
 * A page is one of two kinds. A long-form page has sections, each written in
 * the markup described in `lib/content/service-markup.ts`, and they replace
 * the shorter template; a page without sections keeps that template — the
 * eyebrow, introduction and points under "Clarity first", and the tables.
 *
 * What is deliberately not editable here:
 *
 *  - `process`. It is stored on some pages but no page renders it, so a field
 *    for it would be a field that changes nothing. The save carries it over.
 *  - The copy every offence page shares — "Clarity first", the checklist of
 *    what to bring, the contact card. It is template text rather than any one
 *    page's, and belongs with the shared sections if it becomes editable.
 *
 * No server-only imports: the editor is a client component.
 */

export const servicePageFields = [
  "headline",
  "emphasis",
  "intro",
  "lead",
  "alertTitle",
  "alertBody",
  "quote",
  "quoteCite",
  "ctaHeading",
  "ctaEmphasis",
  "issuesHeading",
  "issuesIntro",
] as const;

export type ServicePageScalarField = (typeof servicePageFields)[number];

/**
 * Limits sit at about twice the longest entry the site shipped with. Over-long
 * text is truncated rather than rejected, so a limit close to today's copy
 * would quietly trim it on the next save.
 *
 * Only the heading is always required: it is what names the draft in the
 * list. The rest is required to publish rather than to save — see
 * `saveServicePage` — so a page can be written over several sittings.
 */
export const servicePageRules: Record<ServicePageScalarField, FieldRule> = {
  headline: { label: "Heading", required: true, maxLength: 120 },
  emphasis: { label: "Heading, emphasised part", maxLength: 120 },
  intro: { label: "Standfirst", maxLength: 800 },
  lead: { label: "Opening statement", maxLength: 1200 },
  alertTitle: { label: "Highlighted box, title", maxLength: 120 },
  alertBody: { label: "Highlighted box, text", maxLength: 1200 },
  quote: { label: "Quote", maxLength: 1000 },
  quoteCite: { label: "Quote, attributed to", maxLength: 80 },
  ctaHeading: { label: "Closing banner, heading", maxLength: 120 },
  ctaEmphasis: { label: "Closing banner, emphasised part", maxLength: 160 },
  issuesHeading: { label: "Eyebrow", maxLength: 80 },
  issuesIntro: { label: "Introduction", maxLength: 600 },
};

/** Needed before any page can be published, beyond the heading. */
export const requiredToPublish: ServicePageScalarField[] = ["emphasis", "intro"];

/**
 * Needed as well by a page without long-form sections, whose shorter template
 * would otherwise print an eyebrow and a list with nothing in them.
 */
export const requiredWithoutSections: ServicePageScalarField[] = [
  "issuesHeading",
  "issuesIntro",
];

export const penaltiesField: SectionField = {
  key: "penalties",
  label: "At a glance",
  kind: "items",
  hint: "The cards beneath the heading, up to six. On a page without long-form sections, they also fill the outcomes table when it is empty.",
  seo: "Short, exact consequences, such as “12-month minimum ban”, are what people search for after a charge. Keep each one accurate to current law: Google holds legal pages to a high standard, and so do readers.",
  item: {
    label: "Card",
    max: 6,
    fields: [
      {
        key: "kicker",
        label: "Label above (optional)",
        kind: "text",
        maxLength: 60,
        hint: "Small capitals over the headline, e.g. “Mandatory on conviction”.",
      },
      {
        key: "label",
        label: "Headline",
        kind: "text",
        required: true,
        maxLength: 80,
        hint: "e.g. “12-month minimum ban”.",
      },
      {
        key: "note",
        label: "Note",
        kind: "text",
        required: true,
        maxLength: 160,
        hint: "e.g. “Mandatory on conviction”.",
      },
      {
        key: "tone",
        label: "Colour",
        kind: "select",
        required: true,
        options: [
          { value: "risk", label: "Red — a consequence for the client" },
          { value: "note", label: "Gold — a qualification or an opportunity" },
        ],
      },
    ],
  },
};

export const defenceIssuesField: SectionField = {
  key: "defenceIssues",
  label: "The points examined",
  kind: "items",
  hint: "The list under “Clarity first”. Each is a short title and a sentence or two on why it matters.",
  seo: "Name the issues the way people search for them — “procedural errors”, “special reasons” — and explain each plainly. This detail is what lets the page appear for longer, more specific searches.",
  item: {
    label: "Point",
    max: 12,
    fields: [
      { key: "title", label: "Title", kind: "text", required: true, maxLength: 120 },
      {
        key: "body",
        label: "Text",
        kind: "textarea",
        required: true,
        maxLength: 800,
        rows: 3,
      },
    ],
  },
};

/** The two columns of an outcomes or ancillary-orders table. */
function tableRowFields(label: string): ItemField[] {
  return [
    { key: "label", label, kind: "text", required: true, maxLength: 120 },
    {
      key: "note",
      label: "What this means",
      kind: "textarea",
      required: true,
      maxLength: 400,
      rows: 2,
    },
  ];
}

export const outcomesField: SectionField = {
  key: "outcomes",
  label: "Sentencing and possible outcomes",
  kind: "items",
  hint: "Rows of the outcomes table. Leave it empty and the table lists the at-a-glance cards instead.",
  seo: "Each row answers a question people search, such as “will I go to prison for…”. Keep it factual and current, and never promise an outcome.",
  item: { label: "Row", max: 24, fields: tableRowFields("Outcome") },
};

export const ancillaryOrdersField: SectionField = {
  key: "ancillaryOrders",
  label: "Ancillary orders",
  kind: "items",
  hint: "Orders the court can make alongside the sentence. Leave it empty and the section is left off the page.",
  seo: "Name each order as the court does, so the row matches what someone searches after hearing it, and explain it in plain words.",
  item: { label: "Row", max: 16, fields: tableRowFields("Order") },
};

export const sectionsField: SectionField = {
  key: "sections",
  label: "Sections",
  kind: "items",
  hint: "The body of a long-form page, in reading order. Each section is an optional eyebrow, a heading and its text, written with the formatting marks listed above. A page with sections shows them in place of the shorter template below.",
  seo: "Each heading becomes a heading on the page and an entry in its contents list, so say plainly what the section covers. Detailed, accurate sections are what let the page answer the specific questions people search after a charge.",
  item: {
    label: "Section",
    max: 30,
    fields: [
      {
        key: "eyebrow",
        label: "Eyebrow (optional)",
        kind: "text",
        maxLength: 80,
        hint: "Small capitals above the heading, e.g. “The Offence”. Leave it empty and the section carries on from the one before.",
      },
      {
        key: "heading",
        label: "Heading",
        kind: "text",
        maxLength: 160,
        hint: "Leave it empty only for an untitled opening at the top of the page.",
      },
      {
        key: "body",
        label: "Text",
        kind: "textarea",
        required: true,
        maxLength: 40000,
        rows: 18,
      },
    ],
  },
};

export const relatedLinksField: SectionField = {
  key: "relatedLinks",
  label: "Related pages",
  kind: "items",
  hint: "The pages listed at the foot of a long-form page. Leave it empty and the page lists the other services in its group instead.",
  seo: "Links between related pages help Google understand the site and help readers find the next thing they need. Name each link after the page it opens.",
  item: {
    label: "Link",
    max: 12,
    fields: [
      { key: "label", label: "Link text", kind: "text", required: true, maxLength: 80 },
      {
        key: "href",
        label: "Address",
        kind: "text",
        required: true,
        maxLength: 300,
        hint: "A page of this site, e.g. /services/speeding, /police-station or /fees.",
      },
    ],
  },
};

export const servicePageItemFields = [
  penaltiesField,
  sectionsField,
  relatedLinksField,
  defenceIssuesField,
  outcomesField,
  ancillaryOrdersField,
];

export type ServicePageItemField =
  | "penalties"
  | "sections"
  | "relatedLinks"
  | "defenceIssues"
  | "outcomes"
  | "ancillaryOrders";

/** Every field an error can be attached to. */
export type ServicePageField = ServicePageScalarField | ServicePageItemField | "faqItems";

export type ServicePageValues = Record<ServicePageField, string>;

export const emptyServicePageValues: ServicePageValues = {
  headline: "",
  emphasis: "",
  intro: "",
  lead: "",
  alertTitle: "",
  alertBody: "",
  quote: "",
  quoteCite: "",
  ctaHeading: "",
  ctaEmphasis: "",
  issuesHeading: "",
  issuesIntro: "",
  // Rows live in the editor's state, not here; these only carry errors.
  penalties: "",
  sections: "",
  relatedLinks: "",
  defenceIssues: "",
  outcomes: "",
  ancillaryOrders: "",
  faqItems: "",
};

/**
 * The editor's starting state.
 *
 * Here rather than beside the action: every export of a `"use server"` module
 * has to be an async function.
 */
export const initialServicePageFormState: CmsFormState<ServicePageField> =
  initialCmsFormState(emptyServicePageValues);

/** Stored page -> editor values for the single-value fields. */
export function servicePageValuesFrom(
  content: ServicePageContent | null,
): ServicePageValues {
  return {
    ...emptyServicePageValues,
    headline: content?.headline ?? "",
    emphasis: content?.emphasis ?? "",
    intro: content?.intro ?? "",
    lead: content?.lead ?? "",
    alertTitle: content?.alertTitle ?? "",
    alertBody: content?.alertBody ?? "",
    quote: content?.quote ?? "",
    quoteCite: content?.quoteCite ?? "",
    ctaHeading: content?.ctaHeading ?? "",
    ctaEmphasis: content?.ctaEmphasis ?? "",
    issuesHeading: content?.issuesHeading ?? "",
    issuesIntro: content?.issuesIntro ?? "",
  };
}

/** Textareas arrive with CRLF line endings; the page markup is stored with LF. */
function normaliseText(value: string): string {
  return value.replace(/\r\n?/g, "\n").trim();
}

/**
 * A validated submission -> the stored page.
 *
 * Optional parts are stored only when they say something, the shape the
 * seeded pages have: an absent field is how the page knows to leave a box
 * out, or to fall back to the shorter template. An unchanged page therefore
 * saves back exactly as it was loaded.
 *
 * `process` has no field and is carried over from the stored page; the FAQs
 * are read and checked by `lib/cms/faq.ts` before they get here.
 */
export function servicePageContentFrom(
  values: ServicePageValues,
  items: Record<ServicePageItemField, SectionItem[]>,
  carried: { process?: ServicePageContent["process"]; faqItems: FaqItem[] },
): ServicePageContent {
  const text = (field: ServicePageScalarField) => normaliseText(values[field]);
  const optional = <K extends string>(key: K, value: string) =>
    (value ? { [key]: value } : {}) as Partial<Record<K, string>>;
  const rows = (field: ServicePageItemField) => items[field] as Record<string, string>[];

  const penalties = rows("penalties").map(
    ({ kicker, label, note, tone }): PenaltyCard => ({
      ...(kicker ? { kicker } : {}),
      label,
      note,
      tone: tone as PenaltyCard["tone"],
    }),
  );
  const sections = rows("sections").map(
    ({ eyebrow, heading, body }): ServiceSection => ({
      ...(eyebrow ? { eyebrow } : {}),
      ...(heading ? { heading } : {}),
      body: normaliseText(body ?? ""),
    }),
  );
  const relatedLinks = rows("relatedLinks").map(
    ({ label, href }): ServiceLink => ({ label, href }),
  );

  return {
    headline: values.headline,
    emphasis: values.emphasis,
    intro: values.intro,
    penalties,
    ...optional("lead", text("lead")),
    ...(sections.length > 0 ? { sections } : {}),
    ...optional("alertTitle", text("alertTitle")),
    ...optional("alertBody", text("alertBody")),
    ...optional("quote", text("quote")),
    ...optional("quoteCite", text("quoteCite")),
    ...(relatedLinks.length > 0 ? { relatedLinks } : {}),
    ...optional("ctaHeading", text("ctaHeading")),
    ...optional("ctaEmphasis", text("ctaEmphasis")),
    ...optional("issuesHeading", values.issuesHeading),
    ...optional("issuesIntro", values.issuesIntro),
    ...(items.defenceIssues.length > 0
      ? { defenceIssues: rows("defenceIssues") as NonNullable<ServicePageContent["defenceIssues"]> }
      : {}),
    ...(carried.process ? { process: carried.process } : {}),
    ...(carried.faqItems.length ? { faqItems: carried.faqItems } : {}),
    // Absent rather than empty, as the seeded pages have them: the page reads
    // an absent table as "fall back" or "leave the section out".
    ...(items.outcomes.length > 0 ? { outcomes: rows("outcomes") as TableRow[] } : {}),
    ...(items.ancillaryOrders.length > 0
      ? { ancillaryOrders: rows("ancillaryOrders") as TableRow[] }
      : {}),
  };
}

/**
 * The stored page as the shape `itemRowsFrom` reads.
 *
 * The page's arrays are arrays of string records, which is what a section item
 * is; the cast only drops the stricter element types.
 */
export function servicePageAsSection(
  content: ServicePageContent | null,
): SectionContent {
  return (content ?? {}) as unknown as SectionContent;
}
