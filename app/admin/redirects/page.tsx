import type { Metadata } from "next";
import { RedirectForm } from "@/components/admin/redirect-form";
import { listAdminRedirects } from "@/lib/cms/redirect-admin";

export const metadata: Metadata = { title: "Redirects" };
export default async function RedirectsPage() {
  const { rows, error, notesAvailable, notesError } = await listAdminRedirects();
  return <div className="mx-auto max-w-5xl space-y-6 px-4 pt-14 pb-12 md:px-8 md:pt-10">
    <header><h1 className="font-display text-2xl font-semibold">Redirects</h1><p className="mt-2 text-sm text-muted-foreground">Send visitors from a former URL to an existing published page. Renaming a published article or service also saves its former URL automatically. Chains are flattened and loops rejected.</p></header>
    {notesError && <p role="alert" className="rounded-lg border p-3 text-sm">{notesError} Redirect saving is disabled until private notes are available, so the rule and note stay together.</p>}
    {error ? <p role="alert">{error}</p> : <><section aria-labelledby="new-redirect"><h2 id="new-redirect" className="mb-3 font-medium">Add a redirect</h2><RedirectForm notesAvailable={notesAvailable} /></section><section aria-labelledby="existing-redirects"><h2 id="existing-redirects" className="mb-3 font-medium">Saved redirects ({rows.length})</h2><div className="space-y-3">{rows.map((row) => <details key={row.source_path} className="rounded-xl border"><summary className="cursor-pointer px-4 py-3 text-sm"><span className="font-mono">{row.source_path} → {row.destination_path}</span><span className="ml-3 text-muted-foreground">{row.active ? row.permanent ? "308" : "307" : "Disabled"}</span></summary><RedirectForm row={row} notesAvailable={notesAvailable} /></details>)}{!rows.length && <p className="text-sm text-muted-foreground">No former URLs have been saved yet.</p>}</div></section></>}
  </div>;
}
