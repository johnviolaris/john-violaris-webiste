import {
  initialCmsFormState,
  type CmsFormState,
  type FieldRule,
} from "@/lib/cms/form";
import type {
  ItemField,
  SectionContent,
  SectionField,
} from "@/lib/cms/sections/schema";
import type { ServicePageContent } from "@/lib/cms/types";

/**
 * The offence-page editor's fields, rules and encoding.
 *
 * Two kinds of field, and they are handled by what already exists for each:
 *
 *  - The single-value fields run through `validateFields`, as every editor's
 *    do.
 *  - The four repeating groups — the at-a-glance cards, the points examined,
 *    the two tables — are described as `SectionField`s, so the editor renders
 *    them with the same `ItemsField` as Website Content and the action reads
 *    them back with the same `readItems`.
 *
 * What is deliberately not editable here:
 *
 *  - `process`. It is stored on every page but no page renders it, so a field
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
  issuesHeading: { label: "Eyebrow", maxLength: 80 },
  issuesIntro: { label: "Introduction", maxLength: 600 },
};

/** Needed before a page can be published, beyond the heading. */
export const requiredToPublish: ServicePageScalarField[] = [
  "emphasis",
  "intro",
  "issuesHeading",
  "issuesIntro",
];

export const penaltiesField: SectionField = {
  key: "penalties",
  label: "At a glance",
  kind: "items",
  hint: "The cards beside the heading, up to three. When the outcomes table below is empty, these fill it instead.",
  seo: "Short, exact consequences, such as “12-month minimum ban”, are what people search for after a charge. Keep each one accurate to current law: Google holds legal pages to a high standard, and so do readers.",
  item: {
    label: "Card",
    max: 3,
    fields: [
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

export const servicePageItemFields = [
  penaltiesField,
  defenceIssuesField,
  outcomesField,
  ancillaryOrdersField,
];

export type ServicePageItemField =
  | "penalties"
  | "defenceIssues"
  | "outcomes"
  | "ancillaryOrders";

/** Every field an error can be attached to. */
export type ServicePageField = ServicePageScalarField | ServicePageItemField;

export type ServicePageValues = Record<ServicePageField, string>;

export const emptyServicePageValues: ServicePageValues = {
  headline: "",
  emphasis: "",
  intro: "",
  issuesHeading: "",
  issuesIntro: "",
  // Rows live in the editor's state, not here; these only carry errors.
  penalties: "",
  defenceIssues: "",
  outcomes: "",
  ancillaryOrders: "",
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
    issuesHeading: content?.issuesHeading ?? "",
    issuesIntro: content?.issuesIntro ?? "",
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
