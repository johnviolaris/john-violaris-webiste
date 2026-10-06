import { faqAnswerText, readFaqItems, validateFaqItems, type FaqItem } from "@/lib/cms/faq";
import { parseImageCaption, safeCaptionHref } from "@/lib/cms/media/caption";
import { readParagraphs } from "@/lib/cms/form";

/** Court facts belong to the court, never to the solicitor's office/practice. */
export type CourtDetail = { name: string; details: string; address?: string; officialUrl?: string; directionsUrl?: string };
export type LocationStructuredContent = { courts: CourtDetail[]; faqItems: FaqItem[]; parentService: string; relatedLocations: string[]; localContextRich?: string };
export type LocationStructuredField = keyof LocationStructuredContent;
export type LocationStructuredResult = { ok: true; content: LocationStructuredContent } | { ok: false; errors: Partial<Record<LocationStructuredField, string>> };
export const courtFields = ["name", "details", "address", "officialUrl", "directionsUrl"] as const;
export const courtLimits = { items: 12, name: 180, details: 4000, address: 500, officialUrl: 2000, directionsUrl: 2000 } as const;
export const courtCountField = "courtCount";
export const courtRepairField = "replaceInvalidCourts";
export const relationRepairField = "replaceInvalidLocationRelations";
export const contextRepairField = "replaceInvalidLocalContext";
export const localContextRichLimit = 8000;
export const courtField = (index: number, field: (typeof courtFields)[number]) => `court.${index}.${field}`;
type CourtResult = { ok: true; items: CourtDetail[] } | { ok: false; error: string };
type RichContextResult = { ok: true; content?: string } | { ok: false; error: string };

/** Paragraphs, emphasis and safe links only. HTML remains escaped text. */
export function validateLocationRichContext(value: unknown): RichContextResult {
  if (value === undefined) return { ok: true };
  if (typeof value !== "string") return { ok: false, error: "Rich local context must be ordinary Markdown text." };
  if (value.length > localContextRichLimit) return { ok: false, error: `Keep rich local context within ${localContextRichLimit.toLocaleString("en-GB")} characters.` };
  const content = value.trim();
  if (!content) return { ok: true };
  if (parseImageCaption(content, "markdown").invalidLinks) return { ok: false, error: "Rich local-context links must use an ordinary http/https URL, site path or anchor without credentials, spaces or script content." };
  if (!faqAnswerText(content).trim()) return { ok: false, error: "Rich local context needs visible text beyond formatting." };
  return { ok: true, content };
}

export function readLocationRichContext(form: FormData, previous?: unknown): RichContextResult {
  const saved = validateLocationRichContext(previous);
  if (!saved.ok && form.get(contextRepairField) !== "on") return { ok: false, error: "Saved rich local context is invalid. Confirm replacement before repairing or clearing it." };
  return form.has("localContextRich") ? validateLocationRichContext(form.get("localContextRich")) : saved;
}

/** Quality and duplicate checks use exactly the visible rich text, or legacy paragraphs. */
export function locationContextText(content: { localContext: string[]; localContextRich?: unknown }): string {
  const rich = validateLocationRichContext(content.localContextRich);
  return rich.ok && rich.content ? readParagraphs(rich.content).map(faqAnswerText).join("\n\n") : content.localContext.join("\n\n");
}

/** No protocol-relative, credentialled, insecure or script links. No URL is fetched. */
export function safeCourtUrl(value: string): string | null {
  if (!/^https:\/\//i.test(value)) return null;
  return safeCaptionHref(value);
}

export function validateCourtDetails(value: unknown): CourtResult {
  if (value === undefined) return { ok: true, items: [] };
  if (!Array.isArray(value) || value.length > courtLimits.items) return { ok: false, error: `Use a court list of up to ${courtLimits.items} entries.` };
  const names = new Set<string>();
  const items: CourtDetail[] = [];
  for (const [index, entry] of value.entries()) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry) || Object.keys(entry).some((key) => !courtFields.includes(key as (typeof courtFields)[number]))) return { ok: false, error: `Court ${index + 1} contains unreadable fields.` };
    const row = entry as Record<string, unknown>;
    if (typeof row.name !== "string" || typeof row.details !== "string") return { ok: false, error: `Court ${index + 1} needs a name and local details.` };
    const clean: Record<string, string> = {};
    for (const key of courtFields) {
      if (row[key] !== undefined && typeof row[key] !== "string") return { ok: false, error: `Court ${index + 1}: ${key} must be ordinary text.` };
      const text = typeof row[key] === "string" ? row[key].trim() : "";
      if (text.length > courtLimits[key]) return { ok: false, error: `Court ${index + 1}: keep ${key} within ${courtLimits[key].toLocaleString("en-GB")} characters.` };
      if (text) clean[key] = text;
    }
    if (!clean.name || !clean.details) return { ok: false, error: `Complete the name and useful local details for court ${index + 1}, or remove the entry.` };
    for (const key of ["officialUrl", "directionsUrl"] as const) if (clean[key]) {
      const url = safeCourtUrl(clean[key]);
      if (!url) return { ok: false, error: `Court ${index + 1}: use an HTTPS ${key === "officialUrl" ? "information" : "directions"} URL without credentials, spaces or script content.` };
      clean[key] = url;
    }
    const name = clean.name.replace(/\s+/g, " ").toLocaleLowerCase("en-GB");
    if (names.has(name)) return { ok: false, error: `Court ${index + 1} repeats a name. Keep each court once.` };
    names.add(name);
    items.push({ name: clean.name, details: clean.details, ...(clean.address ? { address: clean.address } : {}), ...(clean.officialUrl ? { officialUrl: clean.officialUrl } : {}), ...(clean.directionsUrl ? { directionsUrl: clean.directionsUrl } : {}) });
  }
  return { ok: true, items };
}

export function readCourtDetails(form: FormData, previous?: unknown): CourtResult {
  const saved = validateCourtDetails(previous);
  if (!saved.ok && form.get(courtRepairField) !== "on") return { ok: false, error: "Saved court data is invalid. Confirm its replacement before repairing or clearing it." };
  if (!form.has(courtCountField)) return saved;
  const count = form.get(courtCountField);
  if (typeof count !== "string" || !/^(?:0|[1-9]\d*)$/.test(count) || Number(count) > courtLimits.items) return { ok: false, error: `Use up to ${courtLimits.items} court entries.` };
  const entries: Record<string, string>[] = [];
  for (let index = 0; index < Number(count); index++) {
    const entry: Record<string, string> = {};
    for (const key of courtFields) {
      const value = form.get(courtField(index, key));
      if (typeof value !== "string") return { ok: false, error: `Court ${index + 1} could not be read. Reload before saving.` };
      entry[key] = value;
    }
    if (Object.values(entry).some((value) => value.trim())) entries.push(entry);
  }
  return validateCourtDetails(entries);
}

export function validParentService(value: unknown): boolean {
  return value === undefined || value === "" || (typeof value === "string" && /^\/(?:services\/[a-z0-9]+(?:-[a-z0-9]+)*|police-station)$/.test(value));
}
export function validRelatedLocations(value: unknown): boolean {
  return value === undefined || (Array.isArray(value) && value.length <= 20 && value.every((path) => typeof path === "string" && /^\/locations\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(path)));
}

/** Explicit malformed JSON is rejected on save/restore; missing legacy fields are empty. */
export function validateLocationStructuredContent(value: unknown): LocationStructuredResult {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
  const errors: Partial<Record<LocationStructuredField, string>> = {};
  const courts = validateCourtDetails(source.courts);
  const faqs = validateFaqItems(source.faqItems);
  const rich = validateLocationRichContext(source.localContextRich);
  if (!courts.ok) errors.courts = courts.error;
  if (!faqs.ok) errors.faqItems = faqs.error;
  if (!rich.ok) errors.localContextRich = rich.error;
  if (!validParentService(source.parentService)) errors.parentService = "Choose a service path from the catalogue, or leave the parent service empty.";
  if (!validRelatedLocations(source.relatedLocations)) errors.relatedLocations = "Use up to 20 location paths, without external, private, query or anchor URLs.";
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, content: { courts: courts.ok ? courts.items : [], faqItems: faqs.ok ? faqs.items : [], parentService: typeof source.parentService === "string" ? source.parentService : "", relatedLocations: [...new Set((source.relatedLocations as string[] | undefined) ?? [])], ...(rich.ok && rich.content ? { localContextRich: rich.content } : {}) } };
}

/** Each optional public block fails closed independently; valid sibling blocks remain visible. */
export function resolveLocationStructuredContent(value: unknown): LocationStructuredContent {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
  const courts = validateCourtDetails(source.courts); const faqs = validateFaqItems(source.faqItems); const rich = validateLocationRichContext(source.localContextRich);
  return { courts: courts.ok ? courts.items : [], faqItems: faqs.ok ? faqs.items : [], parentService: validParentService(source.parentService) && typeof source.parentService === "string" ? source.parentService : "", relatedLocations: validRelatedLocations(source.relatedLocations) ? [...new Set((source.relatedLocations as string[] | undefined) ?? [])] : [], ...(rich.ok && rich.content ? { localContextRich: rich.content } : {}) };
}

/** Old clients preserve optional fields; repairing malformed saved relations is explicit. */
export function readLocationStructuredContent(form: FormData, previous?: unknown): LocationStructuredResult {
  const source = previous && typeof previous === "object" ? previous as Record<string, unknown> : {};
  const errors: Partial<Record<LocationStructuredField, string>> = {};
  const courts = readCourtDetails(form, source.courts); const faqs = readFaqItems(form, source.faqItems);
  const rich = readLocationRichContext(form, source.localContextRich);
  if (!courts.ok) errors.courts = courts.error;
  if (!faqs.ok) errors.faqItems = faqs.error;
  if (!rich.ok) errors.localContextRich = rich.error;
  if ((!validParentService(source.parentService) || !validRelatedLocations(source.relatedLocations)) && form.get(relationRepairField) !== "on") errors.relatedLocations = "Saved relation data is invalid. Confirm its replacement before repairing or clearing it.";
  const proposed = validateLocationStructuredContent({ courts: courts.ok ? courts.items : [], faqItems: faqs.ok ? faqs.items : [], localContextRich: rich.ok ? rich.content : undefined, parentService: form.has("parentService") ? form.get("parentService") : source.parentService, relatedLocations: form.has("relatedLocations") ? String(form.get("relatedLocations") ?? "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean) : source.relatedLocations });
  if (!proposed.ok) Object.assign(errors, proposed.errors);
  return Object.keys(errors).length ? { ok: false, errors } : proposed;
}
