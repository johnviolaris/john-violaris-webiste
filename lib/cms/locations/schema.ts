import { initialCmsFormState, readParagraphs, type CmsFormState } from "@/lib/cms/form";
import type { LocationPageContent, LocationPageRow } from "@/lib/cms/types";
import { londonInputValue } from "@/lib/cms/publication";

export const locationFields = ["slug", "location", "title", "description", "intro", "localContext", "body", "relatedServices", "publishedAt", "unpublishAt"] as const;
export type LocationField = (typeof locationFields)[number];
export type LocationValues = Record<LocationField, string>;
export type LocationFormState = CmsFormState<LocationField>;
export const emptyLocationValues: LocationValues = { slug: "", location: "", title: "", description: "", intro: "", localContext: "", body: "", relatedServices: "", publishedAt: "", unpublishAt: "" };
export const initialLocationFormState = initialCmsFormState(emptyLocationValues);
export const locationFieldLimits: Record<LocationField, number> = { slug: 80, location: 100, title: 120, description: 320, intro: 1200, localContext: 8000, body: 20000, relatedServices: 3000, publishedAt: 16, unpublishAt: 16 };

export function locationValuesFrom(row: LocationPageRow): LocationValues {
  return { slug: row.slug, location: row.location, title: row.title, description: row.content.description, intro: row.content.intro, localContext: row.content.localContext.join("\n\n"), body: row.content.body.join("\n\n"), relatedServices: row.content.relatedServices.join("\n"), publishedAt: londonInputValue(row.published_at), unpublishAt: londonInputValue(row.unpublish_at) };
}

export function locationContentFrom(values: LocationValues): LocationPageContent {
  return { description: values.description.trim(), intro: values.intro.trim(), localContext: readParagraphs(values.localContext), body: readParagraphs(values.body), relatedServices: [...new Set(values.relatedServices.split(/\r?\n/).map((line) => line.trim()).filter(Boolean))] };
}

export function wordCount(value: string): number {
  return value.trim().match(/\S+/g)?.length ?? 0;
}

/** Reject near-identical local context with only the area name changed. */
export function duplicateLocationContext(values: LocationValues, peers: { slug: string; location: string; content: Pick<LocationPageContent, "localContext"> }[]): string | null {
  const shingles = (text: string, area: string) => {
    const words = text.toLocaleLowerCase("en-GB").split(area.toLocaleLowerCase("en-GB")).join(" ").replace(/[^\p{L}\p{N}\s]/gu, " ").match(/\S+/g) ?? [];
    return new Set(words.slice(0, -4).map((_, index) => words.slice(index, index + 5).join(" ")));
  };
  const proposed = shingles(values.localContext, values.location);
  if (proposed.size === 0) return null;
  for (const peer of peers) {
    if (peer.slug === values.slug) continue;
    const existing = shingles(peer.content.localContext.join(" "), peer.location);
    const common = [...proposed].filter((entry) => existing.has(entry)).length;
    if (common / Math.max(proposed.size, existing.size) > 0.85) return peer.slug;
  }
  return null;
}

/** Drafts can be incomplete. Publishing requires bespoke content and a fresh review. */
export function validateLocation(values: LocationValues, published: boolean, reviewed: boolean, servicePaths: Set<string>): Partial<Record<LocationField, string>> {
  const errors: Partial<Record<LocationField, string>> = {};
  for (const field of locationFields) if (values[field].length > locationFieldLimits[field]) errors[field] = `Keep this field within ${locationFieldLimits[field].toLocaleString("en-GB")} characters.`;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(values.slug)) errors.slug = "Use a stable lowercase slug with words separated by hyphens.";
  for (const field of ["location", "title"] as const) if (!values[field].trim()) errors[field] = "Fill in this field before saving.";
  const content = locationContentFrom(values);
  if (content.relatedServices.some((path) => !servicePaths.has(path))) errors.relatedServices = "Choose only services currently published on the website.";
  if (published) {
    if (!reviewed) errors.body = "Confirm a fresh legal and factual review before publishing.";
    if (values.description.trim().length < 40) errors.description = "Write a distinct search description of at least 40 characters.";
    if (values.intro.trim().length < 50) errors.intro = "Add a useful introduction of at least 50 characters.";
    if (wordCount(values.localContext) < 80 || values.localContext.length < 400) errors.localContext = "Add at least 80 words of verifiable, bespoke local context. Changing the city name in generic text is not enough.";
    if (wordCount(values.body) < 300 || values.body.length < 1800 || content.body.length < 2) errors.body = "Add at least two paragraphs and 300 words of useful body content before publishing.";
    if (content.relatedServices.length === 0) errors.relatedServices = "Link to at least one relevant published service.";
    if (/\b(?:no ban if accepted|disqualification avoided entirely|guaranteed? (?:success|acquittal|outcome))\b/i.test(`${values.intro} ${values.localContext} ${values.body}`)) errors.body = "Remove promises of a guaranteed case outcome before publishing.";
  }
  return errors;
}
