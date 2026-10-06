"use client";

import { useId, useState } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageCaption } from "@/components/ui/image-caption";
import { readParagraphs } from "@/lib/cms/form";
import { contextRepairField, localContextRichLimit, validateLocationRichContext } from "@/lib/cms/locations/structured";

/** The optional alternative is explicit; blank preserves the plain paragraph presentation. */
export function LocationRichContextField({ initialValue, error }: { initialValue?: unknown; error?: string }) {
  const id = useId();
  const saved = validateLocationRichContext(initialValue);
  const [value, setValue] = useState(saved.ok ? saved.content ?? "" : "");
  const [replaceInvalid, setReplaceInvalid] = useState(false);
  const preview = validateLocationRichContext(value);
  return <fieldset className="space-y-3 rounded-lg border border-border p-5" tabIndex={-1} aria-invalid={Boolean(error) || (!saved.ok && !replaceInvalid)} aria-describedby={`${id}-hint${error ? ` ${id}-error` : ""}${!saved.ok ? ` ${id}-invalid` : ""}`}>
    <legend className="px-1 font-display text-lg font-semibold">Optional rich local context</legend>
    <p id={`${id}-hint`} className="text-sm text-muted-foreground">When filled in, this replaces the plain local context above on the saved page. Leave blank to use those plain paragraphs. Use blank lines for paragraphs, **bold**, *emphasis* and [link text](/contact). HTML, images, headings and lists are not interpreted. Only verified local facts may be published; the same quality and legal-review checks apply.</p>
    {!saved.ok && <div className="space-y-2 rounded-md border border-destructive p-3"><p id={`${id}-invalid`} className="text-sm text-destructive">Saved rich local context cannot be read safely and is omitted publicly; the plain paragraphs are used. {saved.error}</p><label className="flex gap-2 text-sm"><input type="checkbox" name={contextRepairField} checked={replaceInvalid} onChange={(event) => setReplaceInvalid(event.target.checked)} />Replace the invalid saved rich context with this text. A blank field clears it.</label></div>}
    <Label htmlFor={`${id}-text`}>Rich local-context text</Label>
    <Textarea id={`${id}-text`} name="localContextRich" rows={8} maxLength={localContextRichLimit} value={value} onChange={(event) => setValue(event.target.value)} aria-describedby={`${id}-hint${error ? ` ${id}-error` : ""}`} aria-invalid={Boolean(error)} />
    {error && <p id={`${id}-error`} role="alert" className="text-sm text-destructive">{error}</p>}
    {!preview.ok && <p role="status" className="text-sm text-destructive">{preview.error}</p>}
    {preview.ok && preview.content && <div className="space-y-3 rounded-md border bg-muted/30 p-3 text-sm"><p className="font-semibold">Local context preview</p>{readParagraphs(preview.content).map((paragraph, index) => <p key={index} className="whitespace-pre-wrap"><ImageCaption caption={paragraph} format="markdown" /></p>)}</div>}
  </fieldset>;
}
