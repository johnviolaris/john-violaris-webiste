import type { Metadata } from "next";
import { SeoIntegrationsForm } from "@/components/admin/seo-integrations-form";
import { RevisionHistory } from "@/components/admin/revision-history";
import { getIntegrationsForAdmin } from "@/lib/cms/seo/integration-queries";
import { resolvedIntegrationSettings, validateIntegrationsRevision } from "@/lib/cms/seo/integrations";

export const metadata: Metadata = { title: "Website integrations" };

export default async function IntegrationsPage() {
  const { value, available } = await getIntegrationsForAdmin();
  const invalid = value !== undefined && !validateIntegrationsRevision(value).ok;
  return <div className="mx-auto w-full max-w-3xl px-4 pt-14 pb-12 md:px-8 md:pt-10"><h1 className="font-display text-2xl font-semibold">Website integrations</h1><p className="mt-2 mb-6 text-sm text-muted-foreground">Administrators can enable or disable the two existing providers. Their addresses and loading policies are fixed. Analytics consent remains required, and no credentials or visitor details are stored in these controls.</p>
    {!available ? <p role="alert" className="rounded-lg border p-4 text-sm">These settings could not be loaded. Reload before editing them.</p> : <>{invalid && <p role="alert" className="mb-4 rounded-lg border p-4 text-sm">The saved integration settings are invalid. Both providers are disabled until corrected.</p>}<SeoIntegrationsForm settings={resolvedIntegrationSettings(value)} /><RevisionHistory entity="site_settings" id="scripts" /></>}
  </div>;
}
