"use client";

import { useId, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { faqCountField, faqField, faqLimits, faqRepairField, resolveFaqItems, validateFaqItems, type FaqItem } from "@/lib/cms/faq";

export function FaqFields({ initialItems, error }: { initialItems?: unknown; error?: string }) {
  const id = useId();
  const saved = validateFaqItems(initialItems);
  const invalidSaved = !saved.ok;
  const [replaceInvalid, setReplaceInvalid] = useState(false);
  const [rows, setRows] = useState(() => resolveFaqItems(initialItems).map((item, index) => ({ ...item, key: `${id}-${index}` })));
  const nextKey = useRef(rows.length);
  const update = (index: number, part: keyof FaqItem, value: string) => setRows((current) => current.map((row, position) => position === index ? { ...row, [part]: value } : row));
  const move = (index: number, direction: number) => setRows((current) => {
    const moved = [...current];
    [moved[index], moved[index + direction]] = [moved[index + direction], moved[index]];
    return moved;
  });
  return (
    <fieldset className="space-y-4 rounded-lg border border-border p-5" aria-describedby={`${id}-hint${error ? ` ${id}-error` : ""}${invalidSaved ? ` ${id}-invalid` : ""}`} aria-invalid={Boolean(error) || (invalidSaved && !replaceInvalid)} tabIndex={-1}>
      <legend className="px-1 font-display text-lg font-semibold">Optional FAQs</legend>
      <p id={`${id}-hint`} className="text-sm text-muted-foreground">Only saved questions appear on this page and in its FAQ schema. Leave empty for no FAQ section. Answers support **bold**, *italic* and [link text](https://example.com). This helps search engines and AI understand visible content; it does not promise a search-result dropdown. Check legal answers before publishing.</p>
      <input type="hidden" name={faqCountField} value={rows.length} />
      {invalidSaved && <div className="space-y-2 rounded-md border border-destructive p-3">
        <p id={`${id}-invalid`} className="text-sm text-destructive">Saved FAQ data cannot be read safely and is omitted from the public page. {saved.error} Explicitly replace or clear it before this page can be saved.</p>
        <label className="flex items-start gap-2 text-sm"><input type="checkbox" name={faqRepairField} checked={replaceInvalid} onChange={(event) => setReplaceInvalid(event.target.checked)} className="mt-1" />Replace the invalid saved FAQs with the rows below. An empty list clears them.</label>
      </div>}
      {rows.map((row, index) => (
        <div key={row.key} className="space-y-3 rounded-md border border-border p-4">
          <div className="flex items-center justify-between gap-2"><span className="text-sm font-medium">FAQ {index + 1}</span><div className="flex gap-1">
            <Button type="button" variant="ghost" size="icon" disabled={index === 0} aria-label={`Move FAQ ${index + 1} up`} onClick={() => move(index, -1)}><ArrowUp className="size-4" /></Button>
            <Button type="button" variant="ghost" size="icon" disabled={index === rows.length - 1} aria-label={`Move FAQ ${index + 1} down`} onClick={() => move(index, 1)}><ArrowDown className="size-4" /></Button>
            <Button type="button" variant="ghost" size="icon" aria-label={`Remove FAQ ${index + 1}`} onClick={() => setRows((current) => current.filter((_, position) => position !== index))}><Trash2 className="size-4" /></Button>
          </div></div>
          <div className="space-y-1"><Label htmlFor={`${row.key}-question`}>Question</Label><Input id={`${row.key}-question`} name={faqField(index, "question")} value={row.question} onChange={(event) => update(index, "question", event.target.value)} maxLength={faqLimits.question} aria-invalid={Boolean(error)} /></div>
          <div className="space-y-1"><Label htmlFor={`${row.key}-answer`}>Answer</Label><Textarea id={`${row.key}-answer`} name={faqField(index, "answer")} value={row.answer} onChange={(event) => update(index, "answer", event.target.value)} maxLength={faqLimits.answer} rows={4} /></div>
        </div>
      ))}
      {error && <p id={`${id}-error`} className="text-sm text-destructive">{error}</p>}
      <Button type="button" variant="outline" disabled={rows.length >= faqLimits.items} onClick={() => { const key = `${id}-${nextKey.current++}`; setRows((current) => [...current, { question: "", answer: "", key }]); }}><Plus className="size-4" /> Add FAQ</Button>
    </fieldset>
  );
}
