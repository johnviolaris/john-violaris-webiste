"use client";

import { useActionState } from "react";
import { saveRedirect } from "@/app/admin/redirects/actions";
import { initialCmsFormState } from "@/lib/cms/form";
import { maxRedirectNoteLength, type AdminRedirectRow } from "@/lib/cms/redirect-notes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatUkDateTime } from "@/lib/format";

export function RedirectForm({ row, notesAvailable = true }: { row?: AdminRedirectRow; notesAvailable?: boolean }) {
  const [state, action, pending] = useActionState(saveRedirect, initialCmsFormState({
    source: row?.source_path ?? "", destination: row?.destination_path ?? "",
    permanent: String(row?.permanent ?? true), active: String(row?.active ?? true),
    notes: row?.notes ?? "",
  }));
  const id = row?.source_path ?? "new";
  return (
    <form action={action} className="space-y-4 rounded-xl border p-4">
      {state.message && <p role={state.status === "error" ? "alert" : "status"} className="text-sm">{state.message}</p>}
      <div className="grid gap-4 md:grid-cols-2">
        {(["source", "destination"] as const).map((field) => (
          <div key={field} className="space-y-2">
            <Label htmlFor={`${id}-${field}`}>{field === "source" ? "Former URL" : "Destination"}</Label>
            <Input id={`${id}-${field}`} name={field} defaultValue={state.values[field]} readOnly={field === "source" && !!row} required maxLength={512} placeholder={field === "source" ? "/old-page" : "/services/drink-driving"} aria-invalid={!!state.fieldErrors[field]} aria-describedby={state.fieldErrors[field] ? `${id}-${field}-error` : undefined} />
            {state.fieldErrors[field] && <p id={`${id}-${field}-error`} className="text-sm text-destructive">{state.fieldErrors[field]}</p>}
          </div>
        ))}
        <div className="space-y-2"><Label htmlFor={`${id}-permanent`}>Redirect type</Label><select id={`${id}-permanent`} name="permanent" defaultValue={state.values.permanent} className="h-9 w-full rounded-md border bg-background px-3 text-sm"><option value="true">Permanent (308)</option><option value="false">Temporary (307)</option></select></div>
        <div className="space-y-2"><Label htmlFor={`${id}-active`}>Status</Label><select id={`${id}-active`} name="active" defaultValue={state.values.active} className="h-9 w-full rounded-md border bg-background px-3 text-sm"><option value="true">Active</option><option value="false">Disabled</option></select></div>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${id}-notes`}>Internal note (optional)</Label>
        <Textarea id={`${id}-notes`} name="notes" defaultValue={state.values.notes} maxLength={maxRedirectNoteLength} rows={3} disabled={!notesAvailable} aria-invalid={!!state.fieldErrors.notes} aria-describedby={`${id}-notes-help${state.fieldErrors.notes ? ` ${id}-notes-error` : ""}`} />
        <p id={`${id}-notes-help`} className="text-xs text-muted-foreground">Administrator-only plain text about why this rule exists. Visitors and SEO editors cannot read it. Leave it empty to clear a saved note.</p>
        {state.fieldErrors.notes && <p id={`${id}-notes-error`} className="text-sm text-destructive">{state.fieldErrors.notes}</p>}
      </div>
      {row && <p className="text-xs text-muted-foreground">Origin: {row.source_kind === "manual" ? "Manually added" : "Automatic slug history"}. Disable to retire a rule; its history remains available here.</p>}
      {row?.created_at && <p className="text-xs text-muted-foreground">Created <time dateTime={row.created_at}>{formatUkDateTime(row.created_at)}</time> (UK time).</p>}
      <Button type="submit" disabled={pending || !notesAvailable}>{pending ? "Saving…" : row ? "Save redirect" : "Add redirect"}</Button>
    </form>
  );
}
