import { isAddress } from "@/lib/cms/form";
import { settingSpecs } from "@/lib/cms/settings/schema";
import type { SectionDefinition } from "@/lib/cms/sections/schema";

export const practiceSettingKeys = ["practiceLegalName", "practiceSraNumber", "addressStreet", "addressLocality", "addressRegion", "addressPostalCode", "addressCountry", "latitude", "longitude", "openingHours", "practiceDetailsReviewedAt"] as const;
export function validateSettingRevision(key: string, value: unknown): string | null {
  const spec = settingSpecs.find((entry) => entry.key === key);
  if (!spec || typeof value !== "string") return "This setting is no longer editable or its saved value is invalid.";
  if ((spec.required && !value.trim()) || value.length > spec.maxLength || /[\u0000-\u001f\u007f]/.test(value)) return `Review ${spec.label.toLowerCase()} in Site Settings before restoring it.`;
  if (spec.type === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "This saved email address is invalid.";
  if (spec.host && value) {
    try { const url = new URL(value); if (url.protocol !== "https:" || !(url.hostname === spec.host || url.hostname.endsWith(`.${spec.host}`))) return "This saved profile address is outside the supported website."; }
    catch { return "This saved profile address is invalid."; }
  }
  if (key === "phoneE164" && value && !/^\+\d{7,15}$/.test(value)) return "This saved dialling number is invalid.";
  if (key === "qualifiedYear" && value && (!/^\d{4}$/.test(value) || Number(value) < 1950 || Number(value) > new Date().getFullYear())) return "This saved qualification year is invalid.";
  return null;
}
export function validateSectionRevision(definition: SectionDefinition, content: unknown, isIconName?: (value: unknown) => boolean): string | null {
  if (!content || typeof content !== "object" || Array.isArray(content)) return "This saved section cannot be read by the current editor.";
  const record = content as Record<string, unknown>;
  for (const field of definition.fields) {
    const value = record[field.key];
    if (value === undefined && !field.required) continue;
    if (field.kind === "items") {
      if (!Array.isArray(value) || (field.item?.max && value.length > field.item.max)) return `Review the saved ${field.label.toLowerCase()} in the editor.`;
      for (const row of value) {
        if (!row || typeof row !== "object" || Array.isArray(row)) return "This saved list contains an invalid row.";
        for (const sub of field.item?.fields ?? []) {
          const entry = (row as Record<string, unknown>)[sub.key];
          const strings = sub.kind === "prose" ? entry : [entry];
          if (!Array.isArray(strings) || strings.some((text) => typeof text !== "string" || (sub.maxLength && text.length > sub.maxLength)) || (sub.required && !strings.some((text) => typeof text === "string" && text.trim()))) return `Review the saved ${sub.label.toLowerCase()} in the editor.`;
          if (sub.kind === "icon" && (!isIconName || !isIconName(entry))) return "Choose a supported icon in the editor before restoring this row.";
          if (sub.kind === "select" && !sub.options?.some((option) => option.value === entry)) return "Choose a supported option in the editor before restoring this row.";
        }
      }
    } else {
      const strings = field.kind === "text" || field.kind === "image" ? [value] : value;
      if (!Array.isArray(strings) || strings.some((text) => typeof text !== "string" || (field.maxLength && text.length > field.maxLength)) || (field.required && !strings.some((text) => typeof text === "string" && text.trim()))) return `Review the saved ${field.label.toLowerCase()} in the editor.`;
      if (field.kind === "image" && value && !isAddress(String(value))) return "The saved image address is invalid.";
    }
  }
  return null;
}
