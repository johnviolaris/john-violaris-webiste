import type { RedirectRow } from "@/lib/cms/redirect-rules";

/** Admin-only view; private notes never belong to public routing rows. */
export type AdminRedirectRow = RedirectRow & { notes: string; created_at: string };
export const maxRedirectNoteLength = 1000;
export const redirectNotesUnavailable = "Private redirect notes could not be loaded. Check the database connection and apply the pending redirect-notes migration before saving. Nothing has been changed.";

export function validateRedirectNote(value: unknown): { ok: true; notes: string } | { ok: false; error: string } {
  if (value === null) return { ok: false, error: "This redirect form is out of date. Reload the page before saving; the internal note has not been cleared." };
  if (typeof value !== "string") return { ok: false, error: "Use plain text for this internal note." };
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)) return { ok: false, error: "Remove control characters from the internal note. Ordinary line breaks and tabs are allowed." };
  const notes = value.replace(/\r\n?/g, "\n").trim();
  if (notes.length > maxRedirectNoteLength) return { ok: false, error: "Keep the internal note within 1,000 characters." };
  return { ok: true, notes };
}
