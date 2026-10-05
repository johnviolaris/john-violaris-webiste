import type { Metadata } from "next";

import { SiteSettingsForm } from "@/components/admin/site-settings-form";
import { listSiteSettings } from "@/lib/cms/admin-queries";
import { settingValuesFrom } from "@/lib/cms/settings/schema";
import { RevisionHistory } from "@/components/admin/revision-history";

export const metadata: Metadata = {
  title: "Site settings",
};

export default async function AdminSiteSettingsPage() {
  const rows = await listSiteSettings();

  // Key/value rows, flattened to the shape the form edits. A setting with no
  // row comes back empty and the field shows the built-in value as its
  // placeholder, so what is set and what is falling back stay distinguishable.
  const stored = Object.fromEntries(rows.map((row) => [row.key, row.value]));

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-14 pb-12 md:px-8 md:pt-10">
      <header className="mb-6">
        <h1 className="font-display text-2xl font-semibold">Site settings</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          John&rsquo;s name, contact details and SRA number. These appear
          across the whole site &mdash; the masthead, the footer, every contact
          button and the enquiry emails. Leave a field blank to fall back to the
          value shown in grey.
        </p>
      </header>

      <SiteSettingsForm values={settingValuesFrom(stored)} />
      <details className="mt-8 rounded-xl border p-4"><summary className="cursor-pointer font-medium">Settings history</summary><RevisionHistory entity="site_settings" id="" /></details>

      <p className="mt-6 text-sm text-muted-foreground">
        The website address itself is not set here. It decides every canonical
        URL on the site, so it belongs with the deployment rather than with
        something editable from a browser.
      </p>
    </div>
  );
}
