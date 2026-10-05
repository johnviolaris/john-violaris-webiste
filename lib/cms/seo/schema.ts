import {
  initialCmsFormState,
  type CmsFormState,
  type FieldRule,
} from "@/lib/cms/form";
import type { SeoContent } from "@/lib/cms/types";
import { customJsonLdMaxLength } from "@/lib/cms/seo/custom-json-ld";

/**
 * The SEO editor's field list, rules and encoding.
 *
 * Every field is optional, because every field is an override: left blank, the
 * page keeps what it says by default — its heading, its standfirst — and the
 * editor shows that default in the empty field so John can see what he would
 * be replacing.
 *
 * Deliberately not here:
 *
 *  - A separate on-page heading. The visible headings are edited where they
 *    live, under Website Content and Service Pages; SEO requirement REQ-003 is
 *    met by the search title and the heading already being independent.
 * No server-only imports: the editor is a client component.
 */

export const seoFields = [
  "title",
  "description",
  "canonical",
  "ogTitle",
  "ogDescription",
  "ogImage",
  "ogImageAlt",
  "ogType",
  "twitterTitle",
  "twitterDescription",
  "twitterImage",
  "twitterImageAlt",
  "twitterCard",
  "customJsonLd",
] as const;

export type SeoField = (typeof seoFields)[number];

export type SeoValues = Record<SeoField, string>;

export const emptySeoValues: SeoValues = {
  title: "",
  description: "",
  canonical: "",
  ogTitle: "",
  ogDescription: "",
  ogImage: "",
  ogImageAlt: "",
  ogType: "",
  twitterTitle: "",
  twitterDescription: "",
  twitterImage: "",
  twitterImageAlt: "",
  twitterCard: "",
  customJsonLd: "",
};

/**
 * Search-field limits follow the requirements and reject over-length input rather than silently
 * changing search copy or breaking JSON. The lengths that matter for search are
 * the advisory ones below, which the editor counts against as you type.
 */
export const seoRules: Record<SeoField, FieldRule> = {
  title: { label: "Search title", maxLength: 70 },
  description: { label: "Search description", maxLength: 160 },
  canonical: { label: "Canonical address", maxLength: 300 },
  ogTitle: { label: "Share title", maxLength: 120 },
  ogDescription: { label: "Share description", maxLength: 320 },
  ogImage: { label: "Share image", maxLength: 500 },
  ogImageAlt: { label: "Image description", maxLength: 200 },
  ogType: { label: "Open Graph type", maxLength: 16 },
  twitterTitle: { label: "X title", maxLength: 120 },
  twitterDescription: { label: "X description", maxLength: 320 },
  twitterImage: { label: "X image", maxLength: 500 },
  twitterImageAlt: { label: "X image description", maxLength: 200 },
  twitterCard: { label: "X card format", maxLength: 24 },
  customJsonLd: { label: "Custom JSON-LD", maxLength: customJsonLdMaxLength },
};

/**
 * Where Google starts cutting a result short, near enough. The title count
 * includes " | John Violaris", because that is what Google shows.
 */
export const titleWarnAt = 60;
export const descriptionWarnAt = 155;

/**
 * The editor's state. `reset` marks the answer to "Reset to defaults", which
 * the editor needs to know apart from an ordinary save: its own fields still
 * hold the override that was just removed, and have to be emptied.
 */
export type SeoFormState = CmsFormState<SeoField> & { reset?: boolean; warnings?: string[] };

/**
 * The editor's starting state.
 *
 * Here rather than beside the action: every export of a `"use server"` module
 * has to be an async function.
 */
export const initialSeoFormState: SeoFormState =
  initialCmsFormState(emptySeoValues);

/** Stored override -> editor values. */
export function seoValuesFrom(content: SeoContent | null): SeoValues {
  const values = { ...emptySeoValues };
  for (const field of seoFields) {
    const value = content?.[field];
    if (typeof value === "string") values[field] = value;
  }
  return values;
}

/** Never silently truncate metadata or a JSON document pasted into the editor. */
export function validateSeoLengths(values: SeoValues): Partial<Record<SeoField, string>> {
  const errors: Partial<Record<SeoField, string>> = {};
  for (const field of seoFields) {
    const maximum = seoRules[field].maxLength;
    if (maximum && values[field].length > maximum) {
      errors[field] = `${seoRules[field].label} must be ${maximum.toLocaleString("en-GB")} characters or fewer.`;
    }
  }
  return errors;
}
