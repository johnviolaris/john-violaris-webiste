"use client";

import { useActionState, useId, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { initialCmsFormState } from "@/lib/cms/form";
import { saveCrawlRules } from "@/lib/cms/seo/robots-actions";
import { crawlPreview, parseCrawlSettings, robotsRulesMaxLength } from "@/lib/cms/seo/robots";

export function SeoRobotsForm({ initialRules, siteUrl }: { initialRules: string; siteUrl: string }) {
  const id = useId();
  const [state, action] = useActionState(saveCrawlRules, initialCmsFormState({ rules: initialRules }));
  const [rules, setRules] = useState(initialRules);
  const [seen, setSeen] = useState(state);
  if (state !== seen) { setSeen(state); if (state.status === "success") setRules(state.values.rules); }
  const checked = parseCrawlSettings(rules);
  return <form action={action} className="space-y-5">
    {state.message ? <p role={state.status === "error" ? "alert" : "status"} className="rounded-lg border p-3 text-sm">{state.message}</p> : null}
    <div className="space-y-2"><Label htmlFor={id}>Crawler rules</Label><p id={`${id}-hint`} className="text-sm text-muted-foreground">Use one rule per crawler. Every rule keeps admin, auth, API and preview paths blocked. The sitemap always points to the primary website. Allow paths are explicit; Disallow paths may use * and a final $.</p><Textarea id={id} name="rules" value={rules} onChange={(event) => setRules(event.target.value)} rows={15} maxLength={robotsRulesMaxLength} spellCheck={false} className="font-mono text-sm" aria-invalid={Boolean(state.fieldErrors.rules)} aria-describedby={`${id}-hint${state.fieldErrors.rules ? ` ${id}-error` : ""}`} />{state.fieldErrors.rules ? <p id={`${id}-error`} role="alert" className="text-sm text-destructive">{state.fieldErrors.rules}</p> : null}</div>
    <div><h2 className="mb-2 font-medium">robots.txt preview</h2>{checked.ok ? <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-xs">{crawlPreview(checked.settings, siteUrl)}</pre> : <p className="text-sm text-destructive">{checked.error}</p>}</div>
    <label className="flex items-start gap-3 text-sm"><input type="checkbox" name="confirmRestrictions" className="mt-1 size-4 accent-primary" /><span>I have reviewed any public pages blocked for crawlers and intend those restrictions.</span></label>
    <div className="flex flex-wrap gap-3"><SaveButton /><Button type="submit" name="intent" value="reset" variant="outline">Restore default crawl rules</Button></div>
  </form>;
}

function SaveButton() { const { pending } = useFormStatus(); return <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save crawl rules"}</Button>; }
