import { isAddress, validateFields } from "@/lib/cms/form";
import { validateCustomJsonLd } from "@/lib/cms/seo/custom-json-ld";
import { emptySeoValues, seoFields, seoRules, validateSeoLengths, type SeoField, type SeoValues } from "@/lib/cms/seo/schema";
import type { SeoContent } from "@/lib/cms/types";

type ContentValidation = { ok: true; content: SeoContent; values: SeoValues } | { ok: false; error: string; fieldErrors: Partial<Record<SeoField, string>> };

/** One current field/URL/custom-JSON policy for ordinary saves and history restores. */
export function validateSeoContent(input: unknown, path: string, siteUrl: string): ContentValidation {
  const fail = (error: string, fieldErrors: Partial<Record<SeoField, string>> = {}): ContentValidation => ({ ok: false, error, fieldErrors });
  if (!input || typeof input !== "object" || Array.isArray(input)) return fail("SEO settings must be a metadata object.");
  const fields = input as Record<string, unknown>;
  const known = new Set<string>([...seoFields, "noIndex", "noFollow"]);
  if (Object.keys(fields).some((key) => !known.has(key))) return fail("This version includes SEO fields the current editor does not support. Review it before saving.");
  for (const key of ["noIndex", "noFollow"] as const) if (fields[key] !== undefined && typeof fields[key] !== "boolean") return fail(`${key} must be a true or false setting.`);
  const values = { ...emptySeoValues };
  for (const field of seoFields) {
    if (fields[field] === undefined) continue;
    if (typeof fields[field] !== "string") return fail(`${seoRules[field].label} must be text.`, { [field]: "Enter a text value." });
    values[field] = (fields[field] as string).trim();
  }
  const fieldErrors = validateSeoLengths(values);
  if (Object.keys(fieldErrors).length) return fail(Object.values(fieldErrors).join(" "), fieldErrors);
  const checked = validateFields(values, seoRules);
  if (!checked.ok) return fail(Object.values(checked.fieldErrors).join(" "), checked.fieldErrors);
  for (const field of ["canonical", "ogImage", "twitterImage"] as const) if (values[field] && (!isAddress(values[field]) || /[\u0000-\u001f\u007f\\]/.test(values[field]))) fieldErrors[field] = "Use a safe path starting with / or a full https:// address.";
  if (values.ogImage && !values.ogImageAlt) fieldErrors.ogImageAlt = "Describe the shared image for anyone who cannot see it.";
  if (values.twitterImage && !values.twitterImageAlt) fieldErrors.twitterImageAlt = "Describe the X image for anyone who cannot see it.";
  if (values.ogType && !["website", "article"].includes(values.ogType)) fieldErrors.ogType = "Choose website or article, or the page default.";
  if (values.twitterCard && !["summary", "summary_large_image"].includes(values.twitterCard)) fieldErrors.twitterCard = "Choose a supported X card format.";
  const schema = validateCustomJsonLd(values.customJsonLd, path, siteUrl);
  if (!schema.ok) fieldErrors.customJsonLd = schema.error;
  if (Object.keys(fieldErrors).length) return fail(Object.values(fieldErrors).join(" "), fieldErrors);
  const content: SeoContent = {};
  for (const field of seoFields) if (values[field] && !["ogImageAlt", "twitterImageAlt"].includes(field)) Object.assign(content, { [field]: values[field] });
  if (values.ogImage) content.ogImageAlt = values.ogImageAlt;
  if (values.twitterImage) content.twitterImageAlt = values.twitterImageAlt;
  if (fields.noIndex === true) content.noIndex = true;
  if (fields.noFollow === true) content.noFollow = true;
  return { ok: true, content, values };
}
