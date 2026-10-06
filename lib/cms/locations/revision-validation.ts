import type { LocationPageContent } from "@/lib/cms/types";
import { emptyLocationValues, locationContentFrom, validateLocation } from "@/lib/cms/locations/schema";
import { validateLocationStructuredContent } from "@/lib/cms/locations/structured";

/** A restore uses current validation and current slug, and still creates a private draft. */
export function validateLocationRevision(snapshot: unknown, currentSlug: string, servicePaths: Set<string>, locationPaths: Set<string>): { ok: true; title: string; location: string; content: LocationPageContent } | { ok: false; error: string } {
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) return { ok: false, error: "This location revision cannot be read." };
  const saved = snapshot as Record<string, unknown>;
  if (typeof saved.title !== "string" || typeof saved.location !== "string" || !saved.content || typeof saved.content !== "object" || Array.isArray(saved.content)) return { ok: false, error: "This location revision needs a title, area and readable content." };
  const content = saved.content as Record<string, unknown>;
  if (!["description", "intro"].every((key) => typeof content[key] === "string") || !["localContext", "body", "relatedServices"].every((key) => Array.isArray(content[key]) && (content[key] as unknown[]).every((item) => typeof item === "string"))) return { ok: false, error: "This location revision has malformed paragraph or service fields." };
  const optional = validateLocationStructuredContent(content);
  if (!optional.ok) return { ok: false, error: Object.values(optional.errors).join(" ") };
  const values = { ...emptyLocationValues, slug: currentSlug, location: saved.location, title: saved.title, description: content.description as string, intro: content.intro as string, localContext: (content.localContext as string[]).join("\n\n"), body: (content.body as string[]).join("\n\n"), relatedServices: (content.relatedServices as string[]).join("\n"), parentService: optional.content.parentService, relatedLocations: optional.content.relatedLocations.join("\n") };
  values.localContextRich = optional.content.localContextRich ?? "";
  const errors = validateLocation(values, false, false, servicePaths, locationPaths, optional.content);
  if (Object.keys(errors).length) return { ok: false, error: Object.values(errors).join(" ") };
  return { ok: true, title: saved.title, location: saved.location, content: locationContentFrom(values, optional.content, content as LocationPageContent) };
}
