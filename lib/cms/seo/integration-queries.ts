import "server-only";
import { cache } from "react";
import { createAuthorizedAdminClient } from "@/lib/auth";
import { publicClient } from "@/utils/supabase/public";
import { disabledIntegrationSettings, resolvedIntegrationSettings, type IntegrationSettings } from "@/lib/cms/seo/integrations";

/** Only public-safe provider descriptors/flags are stored here, without credentials. */
export const getIntegrationSettings = cache(async function getIntegrationSettings(): Promise<IntegrationSettings> {
  try {
    const { data, error } = await publicClient().from("site_settings").select("value").eq("key", "scripts").maybeSingle<{ value: unknown }>();
    if (error) return { ...disabledIntegrationSettings };
    return resolvedIntegrationSettings(data?.value);
  } catch { return { ...disabledIntegrationSettings }; }
});

export async function getIntegrationsForAdmin() {
  const supabase = await createAuthorizedAdminClient();
  const { data, error } = await supabase.from("site_settings").select("value").eq("key", "scripts").maybeSingle<{ value: unknown }>();
  return { value: data?.value, available: !error };
}
