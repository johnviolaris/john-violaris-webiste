import "server-only";

import type { PostgrestError } from "@supabase/supabase-js";
import { createAuthorizedSeoClient } from "@/lib/auth";
import { describeDatabaseError, formFailure, formSuccess } from "@/lib/cms/form";
import { revalidateFor } from "@/lib/cms/revalidate";

type SeoClient = Awaited<ReturnType<typeof createAuthorizedSeoClient>>;

/** SEO editors receive no client until authorized; RLS independently limits writes. */
export async function seoWrite<F extends string>({ values, successMessage, paths, run, allowEmpty = false }: {
  values: Record<F, string>;
  successMessage: string;
  paths: string[];
  run: (client: SeoClient) => Promise<{ data: unknown; error: PostgrestError | null }>;
  allowEmpty?: boolean;
}) {
  const client = await createAuthorizedSeoClient();
  try {
    const { data, error } = await run(client);
    if (error) return formFailure(values, describeDatabaseError(error));
    if (!allowEmpty && (!Array.isArray(data) || data.length === 0)) return formFailure(values, "Nothing was saved. Reload the page and check your access before trying again.");
  } catch { return formFailure(values, "SEO settings could not be saved. Try again when the database is available."); }
  revalidateFor("seo-metadata", paths);
  return formSuccess(values, successMessage);
}
