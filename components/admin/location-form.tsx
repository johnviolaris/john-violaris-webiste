"use client";

import Link from "next/link";
import { useActionState, useEffect, useId, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useControlledAfterReset } from "@/hooks/use-controlled-after-reset";
import { deleteLocationPage, saveLocationPage } from "@/lib/cms/locations/actions";
import { emptyLocationValues, initialLocationFormState, locationFieldLimits, locationValuesFrom, type LocationField } from "@/lib/cms/locations/schema";
import type { LocationPageRow } from "@/lib/cms/types";
import { SlugChangeConfirmation } from "@/components/admin/slug-change-confirmation";

const fields: { key: LocationField; label: string; hint: string; rows?: number }[] = [
  { key: "location", label: "Area name", hint: "The genuine service area. This does not create an office claim." },
  { key: "slug", label: "URL slug", hint: "Published at /locations/this-slug. Use a stable address." },
  { key: "title", label: "Page heading and default search title", hint: "Describe the actual service and area clearly. A separate search title can be set after publication." },
  { key: "description", label: "Search description", hint: "A unique summary; about 155 characters is a useful guide.", rows: 3 },
  { key: "intro", label: "Introduction", hint: "Explain what help is available to people in this area, without implying an office that does not exist.", rows: 4 },
  { key: "localContext", label: "Bespoke local context", hint: "At least 80 words before publication. Use verifiable details relevant to the area and court process; never invent offices, local experience or case results. Separate paragraphs with a blank line.", rows: 8 },
  { key: "body", label: "Main content", hint: "At least 300 words in two or more paragraphs. Explain useful, accurate advice for this audience. Word count alone does not establish quality. Separate paragraphs with a blank line.", rows: 14 },
];

export function LocationForm({ row, services }: { row: LocationPageRow | null; services: { href: string; name: string }[] }) {
  const values = row ? locationValuesFrom(row) : emptyLocationValues;
  const [state, action] = useActionState(saveLocationPage, { ...initialLocationFormState, values });
  const [published, setPublished] = useState(row?.published ?? false);
  const [slug, setSlug] = useState(values.slug);
  const [selectedServices, setSelectedServices] = useState(values.relatedServices.split("\n").filter(Boolean));
  const ref = useRef<HTMLFormElement>(null);
  const alert = useRef<HTMLParagraphElement>(null);
  const formId = useId();
  useControlledAfterReset(ref);
  useEffect(() => {
    if (state.status === "error") (ref.current?.querySelector<HTMLElement>('[aria-invalid="true"]') ?? alert.current)?.focus();
  }, [state]);

  return <>
    <form ref={ref} action={action} className="space-y-6">
      {row ? <input type="hidden" name="id" value={row.id} /> : null}
      <input type="hidden" name="relatedServices" value={selectedServices.join("\n")} />
      {state.message ? <p ref={alert} tabIndex={-1} role={state.status === "error" ? "alert" : "status"} className={`rounded-xl border p-4 text-sm ${state.status === "error" ? "text-destructive" : ""}`}>{state.message}</p> : null}
      {fields.map(({ key, label, hint, rows }) => <div key={key} className="space-y-2">
        <Label htmlFor={`${formId}-${key}`}>{label}</Label>
        {rows ? <Textarea id={`${formId}-${key}`} name={key} defaultValue={state.values[key]} rows={rows} maxLength={locationFieldLimits[key]} aria-invalid={Boolean(state.fieldErrors[key]) || undefined} aria-describedby={`${formId}-${key}-hint ${state.fieldErrors[key] ? `${formId}-${key}-error` : ""}`} /> : key === "slug" ? <Input id={`${formId}-${key}`} name={key} value={slug} onChange={(event) => setSlug(event.target.value)} maxLength={locationFieldLimits[key]} required aria-invalid={Boolean(state.fieldErrors[key]) || undefined} aria-describedby={`${formId}-${key}-hint ${state.fieldErrors[key] ? `${formId}-${key}-error` : ""}`} /> : <Input id={`${formId}-${key}`} name={key} defaultValue={state.values[key]} maxLength={locationFieldLimits[key]} required aria-invalid={Boolean(state.fieldErrors[key]) || undefined} aria-describedby={`${formId}-${key}-hint ${state.fieldErrors[key] ? `${formId}-${key}-error` : ""}`} />}
        <p id={`${formId}-${key}-hint`} className="text-xs text-muted-foreground">{hint}</p>
        {state.fieldErrors[key] ? <p id={`${formId}-${key}-error`} className="text-sm text-destructive" role="alert">{state.fieldErrors[key]}</p> : null}
      </div>)}
      <div className="space-y-2">
        <Label htmlFor={`${formId}-services`}>Relevant services</Label>
        <select id={`${formId}-services`} multiple value={selectedServices} onChange={(event) => setSelectedServices([...event.target.selectedOptions].map((option) => option.value))} className="min-h-40 w-full rounded-md border border-input bg-background p-3 text-sm" aria-invalid={Boolean(state.fieldErrors.relatedServices) || undefined} aria-describedby={`${formId}-services-hint ${state.fieldErrors.relatedServices ? `${formId}-services-error` : ""}`}>
          {services.map((service) => <option key={service.href} value={service.href}>{service.name}</option>)}
        </select>
        <p id={`${formId}-services-hint`} className="text-xs text-muted-foreground">Select at least one before publication. Hold Ctrl or Command to select several.</p>
        {state.fieldErrors.relatedServices ? <p id={`${formId}-services-error`} role="alert" className="text-sm text-destructive">{state.fieldErrors.relatedServices}</p> : null}
      </div>
      {row && <SlugChangeConfirmation prefix="/locations/" previous={row.slug} next={slug} wasPublished={row.published} />}
      <div className="space-y-3 rounded-xl border p-4">
        <p className="text-sm text-muted-foreground">Scheduling uses Europe/London, including BST. Leave the start blank to publish now. The enabled publication checkbox and review gates still apply. Expired pages return 404.</p>
        {(["publishedAt", "unpublishAt"] as const).map((key) => <label key={key} htmlFor={`${formId}-${key}`} className="block text-sm">{key === "publishedAt" ? "Publish at (UK time)" : "Unpublish at (UK time)"}<Input id={`${formId}-${key}`} type="datetime-local" name={key} defaultValue={state.values[key]} aria-invalid={Boolean(state.fieldErrors[key]) || undefined} />{state.fieldErrors[key] && <span className="text-destructive" role="alert">{state.fieldErrors[key]}</span>}</label>)}
        <label className="flex gap-3 text-sm"><input name="published" type="checkbox" checked={published} onChange={(event) => setPublished(event.target.checked)} className="mt-0.5 size-4" /><span>Publish this location page. Drafts remain private and outside the sitemap.</span></label>
        <label className="flex gap-3 text-sm"><input name="legalReviewed" type="checkbox" className="mt-0.5 size-4" /><span>I have reviewed the current text for legal accuracy and verified the local facts and service claims. Every published save requires this confirmation.</span></label>
      </div>
      <div className="flex flex-wrap items-center gap-4"><SaveButton /><Link href="/admin/location-pages" className="text-sm underline underline-offset-4">All location drafts</Link>{row ? <Link href={`/preview/locations/${row.id}`} target="_blank" className="text-sm underline underline-offset-4">Preview saved page</Link> : null}{row?.published ? <Link href={`/locations/${row.slug}`} target="_blank" className="text-sm underline underline-offset-4">View public URL</Link> : null}</div>
    </form>
    {row ? <DeleteForm id={row.id} /> : null}
  </>;
}

function SaveButton() {
  const { pending } = useFormStatus();
  return <Button disabled={pending} type="submit">{pending ? "Saving…" : "Save location page"}</Button>;
}
function DeleteForm({ id }: { id: string }) {
  const [state, action, pending] = useActionState(deleteLocationPage, { message: null });
  return <form action={action} className="mt-8 border-t pt-5"><input type="hidden" name="id" value={id} />{state.message ? <p role="alert" className="mb-3 text-sm text-destructive">{state.message}</p> : null}<Button variant="destructive" disabled={pending} onClick={(event) => { if (!window.confirm("Delete this location page and its SEO settings? This cannot be undone.")) event.preventDefault(); }}>{pending ? "Deleting…" : "Delete location page"}</Button></form>;
}
