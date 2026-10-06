"use client";

import { useId, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { courtCountField, courtField, courtFields, courtLimits, courtRepairField, validateCourtDetails } from "@/lib/cms/locations/structured";

const labels = { name: "Court name", details: "Verified local details", address: "Court address (optional)", officialUrl: "Court information URL (optional; verify the source)", directionsUrl: "Directions URL (optional)" };
export function LocationCourtFields({ initialItems, error }: { initialItems?: unknown; error?: string }) {
  const id = useId();
  const saved = validateCourtDetails(initialItems);
  const [replaceInvalid, setReplaceInvalid] = useState(false);
  const [rows, setRows] = useState(() => (saved.ok ? saved.items : []).map((row, index) => ({ ...row, key: `${id}-${index}` })));
  const next = useRef(rows.length);
  const move = (index: number, direction: number) => setRows((current) => {
    const result = [...current]; [result[index], result[index + direction]] = [result[index + direction], result[index]]; return result;
  });
  return <fieldset className="space-y-4 rounded-lg border border-border p-5" aria-invalid={Boolean(error) || (!saved.ok && !replaceInvalid)} tabIndex={-1} aria-describedby={`${id}-hint${error ? ` ${id}-error` : ""}${!saved.ok ? ` ${id}-invalid` : ""}`}>
    <legend className="px-1 font-display text-lg font-semibold">Optional local court details</legend>
    <p id={`${id}-hint`} className="text-sm text-muted-foreground">Add only real courts and facts verified from a current source. Court addresses describe the court, never a John Violaris office. Name and useful local details are required for each entry; links must use HTTPS. Leave empty when no details are confirmed.</p>
    <input type="hidden" name={courtCountField} value={rows.length} />
    {!saved.ok && <div className="space-y-2 rounded-md border border-destructive p-3"><p id={`${id}-invalid`} className="text-sm text-destructive">Saved court details cannot be read safely and are omitted publicly. {saved.error}</p><label className="flex gap-2 text-sm"><input type="checkbox" name={courtRepairField} checked={replaceInvalid} onChange={(event) => setReplaceInvalid(event.target.checked)} />Replace the invalid saved court details with these entries. An empty list clears them.</label></div>}
    {rows.map((row, index) => <div key={row.key} className="space-y-3 rounded-md border border-border p-4">
      <div className="flex items-center justify-between"><span className="text-sm font-medium">Court {index + 1}</span><div className="flex gap-1"><Button type="button" variant="ghost" size="icon" disabled={index === 0} aria-label={`Move court ${index + 1} up`} onClick={() => move(index, -1)}><ArrowUp className="size-4" /></Button><Button type="button" variant="ghost" size="icon" disabled={index === rows.length - 1} aria-label={`Move court ${index + 1} down`} onClick={() => move(index, 1)}><ArrowDown className="size-4" /></Button><Button type="button" variant="ghost" size="icon" aria-label={`Remove court ${index + 1}`} onClick={() => setRows((current) => current.filter((_, position) => position !== index))}><Trash2 className="size-4" /></Button></div></div>
      {courtFields.map((field) => <div key={field} className="space-y-1"><Label htmlFor={`${row.key}-${field}`}>{labels[field]}</Label>{field === "details" ? <Textarea id={`${row.key}-${field}`} name={courtField(index, field)} rows={4} maxLength={courtLimits[field]} value={row[field] ?? ""} onChange={(event) => setRows((current) => current.map((entry, position) => position === index ? { ...entry, [field]: event.target.value } : entry))} /> : <Input id={`${row.key}-${field}`} name={courtField(index, field)} type={field.endsWith("Url") ? "url" : "text"} maxLength={courtLimits[field]} value={row[field] ?? ""} onChange={(event) => setRows((current) => current.map((entry, position) => position === index ? { ...entry, [field]: event.target.value } : entry))} />}</div>)}
    </div>)}
    {error && <p id={`${id}-error`} className="text-sm text-destructive" role="alert">{error}</p>}
    <Button type="button" variant="outline" disabled={rows.length >= courtLimits.items} onClick={() => { const key = `${id}-${next.current++}`; setRows((current) => [...current, { key, name: "", details: "" }]); }}><Plus className="size-4" />Add court details</Button>
  </fieldset>;
}
