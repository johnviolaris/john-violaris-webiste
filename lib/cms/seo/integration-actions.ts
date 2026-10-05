"use server";
import { createAuthorizedAdminClient } from "@/lib/auth";
import { describeDatabaseError, readCheckbox } from "@/lib/cms/form";
import { revalidateFor } from "@/lib/cms/revalidate";
import { integrationDescriptors, resolvedIntegrationSettings, validateIntegrationsRevision, type IntegrationSettings } from "@/lib/cms/seo/integrations";

export type IntegrationFormState = { status: "idle" | "success" | "error"; message: string; settings: IntegrationSettings };

export async function saveIntegrations(_previous: IntegrationFormState, formData: FormData): Promise<IntegrationFormState> {
  const supabase = await createAuthorizedAdminClient();
  const settings = { ga4: readCheckbox(formData, "ga4"), reviewsolicitors: readCheckbox(formData, "reviewsolicitors") };
  const checked = validateIntegrationsRevision(integrationDescriptors(settings));
  if (!checked.ok) return { status: "error", message: checked.error, settings };
  try {
    const { data, error } = await supabase.from("site_settings").upsert({ key: "scripts", value: checked.value }, { onConflict: "key" }).select("key");
    if (error || !data?.length) return { status: "error", message: error ? describeDatabaseError(error) : "Nothing was saved. Reload and check your access.", settings };
    revalidateFor("site-settings", ["/admin/seo-metadata/integrations"]);
    return { status: "success", message: "Integration settings saved. Refreshed website pages use these settings; pages already open may retain previously loaded scripts.", settings: resolvedIntegrationSettings(checked.value) };
  } catch { return { status: "error", message: "Integration settings could not be saved. Try again when the database is available.", settings }; }
}
