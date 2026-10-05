"use server";

import { revalidatePath } from "next/cache";
import { createAuthorizedAdminClient, requireAdmin } from "@/lib/auth";
import { formError, formFailure, formSuccess, readFields, type CmsFormState } from "@/lib/cms/form";
import { isPublicRedirectPath, resolveRedirectTarget, type RedirectRow } from "@/lib/cms/redirect-rules";
import { listSeoRoutes } from "@/lib/cms/seo/routes";
import { redirectNotesUnavailable, validateRedirectNote } from "@/lib/cms/redirect-notes";

const fields = ["source", "destination", "permanent", "active", "notes"] as const;
type Field = typeof fields[number];

export async function saveRedirect(_previous: CmsFormState<Field>, formData: FormData): Promise<CmsFormState<Field>> {
  await requireAdmin();
  const values = readFields(formData, fields);
  const fieldErrors: Partial<Record<Field, string>> = {};
  if (values.source === "/" || !isPublicRedirectPath(values.source)) fieldErrors.source = "Use a lowercase public page path, such as /old-drink-driving-page. Queries, fragments, files and private paths are not allowed.";
  if (!isPublicRedirectPath(values.destination)) fieldErrors.destination = "Use a lowercase public page path, such as /services/drink-driving.";
  if (!["true", "false"].includes(values.permanent)) fieldErrors.permanent = "Choose a redirect type.";
  if (!["true", "false"].includes(values.active)) fieldErrors.active = "Choose a status.";
  const note = validateRedirectNote(formData.get("notes"));
  if (!note.ok) fieldErrors.notes = note.error;
  else values.notes = note.notes;
  if (Object.keys(fieldErrors).length) return formError(values, fieldErrors);

  const supabase = await createAuthorizedAdminClient();
  const [{ data, error }, notesReady, routes] = await Promise.all([
    supabase.from("redirects").select("source_path,destination_path,permanent,active,source_kind"),
    supabase.from("redirect_admin_notes").select("source_path").limit(1),
    listSeoRoutes(),
  ]);
  if (error) return formFailure(values, "Redirects could not be read. Nothing was changed.");
  if (notesReady.error) return formFailure(values, redirectNotesUnavailable);
  const rows = (data ?? []) as RedirectRow[];
  const destination = resolveRedirectTarget(values.source, values.destination, rows);
  if (!destination) return formError(values, { destination: "This would create a loop or an unsafe redirect chain." });
  if (values.active === "true" && !routes.some((route) => route.path === destination)) return formError(values, { destination: "Choose an existing published page. Redirects must end at a working public page." });
  if (values.active === "true" && routes.some((route) => route.path === values.source)) return formError(values, { source: "This page is still published. Use its CMS editor to rename or retire it first; redirects apply to former URLs." });

  // One database transaction preserves the rule if its private note fails.
  // The invoker RPC retains RLS/admin checks and existing redirect triggers.
  const result = await supabase.rpc("save_redirect_with_admin_notes", {
    p_source_path: values.source, p_destination_path: destination,
    p_permanent: values.permanent === "true", p_active: values.active === "true", p_notes: values.notes,
  }).returns<string>();
  if (result.error || result.data !== values.source) {
    if (result.error && ["PGRST202", "PGRST205", "42P01", "42883"].includes(result.error.code)) return formFailure(values, redirectNotesUnavailable);
    return formFailure(values, "Saving could not be confirmed. Reload this page before trying again. The redirect and internal note are always saved together.");
  }
  // The database also flattens aliases pointing at this source. Clear their
  // cached route responses, including any legacy multi-hop dependants.
  const affected = new Set([values.source]);
  for (let hop = 0; hop < 32; hop++) {
    const before = affected.size;
    for (const row of rows) if (affected.has(row.destination_path)) affected.add(row.source_path);
    if (affected.size === before) break;
  }
  for (const path of affected) if (isPublicRedirectPath(path)) revalidatePath(path);
  revalidatePath("/admin/redirects");
  return formSuccess({ ...values, destination }, "Redirect and internal note saved together. Active redirects apply to requests for the former URL.");
}
