"use client";
import { useActionState, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { saveIntegrations, type IntegrationFormState } from "@/lib/cms/seo/integration-actions";
import { integrationDefinitions, type IntegrationSettings } from "@/lib/cms/seo/integrations";

export function SeoIntegrationsForm({ settings }: { settings: IntegrationSettings }) {
  const id = useId();
  const initial: IntegrationFormState = { status: "idle", message: "", settings };
  const [state, action, pending] = useActionState(saveIntegrations, initial);
  const [values, setValues] = useState(settings);
  const [seen, setSeen] = useState(state);
  if (state !== seen) { setSeen(state); if (state.status === "success") setValues(state.settings); }
  return <form action={action} className="space-y-5">
    {state.message && <p role={state.status === "error" ? "alert" : "status"} className="rounded-lg border p-3 text-sm">{state.message}</p>}
    <fieldset disabled={pending} className="space-y-4">
      <legend className="sr-only">Existing website integrations</legend>
      {integrationDefinitions.map((definition) => <label key={definition.id} htmlFor={`${id}-${definition.id}`} className="flex items-start gap-3 rounded-lg border p-4">
        <input id={`${id}-${definition.id}`} type="checkbox" name={definition.id} checked={values[definition.id]} onChange={(event) => setValues({ ...values, [definition.id]: event.target.checked })} className="mt-1 size-4 accent-primary" />
        <span className="min-w-0 text-sm"><span className="block font-medium">{definition.name}</span><span className="mt-1 block break-all text-xs text-muted-foreground">{definition.src}</span><span className="mt-2 block text-muted-foreground">{definition.id === "ga4" ? "Loads after the page becomes interactive, only when a measurement ID is configured and the visitor has accepted analytics. Disabling also stops an already-loaded tag from sending website events after refreshed settings arrive." : "Controls both review widgets. The side widget waits for idle time; the Reviews page retains its existing loading behavior. Verified review text is unchanged."}</span></span>
      </label>)}
    </fieldset>
    <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save integrations"}</Button>
  </form>;
}
