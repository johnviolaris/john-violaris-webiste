import "server-only";
import { createAuthorizedAdminClient } from "@/lib/auth";
import type { AdminRedirectRow } from "@/lib/cms/redirect-notes";
import { redirectNotesUnavailable } from "@/lib/cms/redirect-notes";

export async function listAdminRedirects(): Promise<{ rows: AdminRedirectRow[]; error: string | null; notesAvailable: boolean; notesError: string | null }> {
  const supabase = await createAuthorizedAdminClient();
  const [redirects, privateNotes] = await Promise.all([
    supabase.from("redirects").select("source_path,destination_path,permanent,active,source_kind,created_at").order("source_path"),
    supabase.from("redirect_admin_notes").select("source_path,notes"),
  ]);
  const notes = new Map<string, string>((privateNotes.data ?? []).map((row) => [row.source_path, row.notes]));
  return {
    rows: (redirects.data ?? []).map((row) => ({ ...row, notes: notes.get(row.source_path) ?? "" })) as AdminRedirectRow[],
    error: redirects.error ? "Redirects could not be loaded. Check the database connection and redirect migration." : null,
    notesAvailable: !privateNotes.error,
    notesError: privateNotes.error ? redirectNotesUnavailable : null,
  };
}
