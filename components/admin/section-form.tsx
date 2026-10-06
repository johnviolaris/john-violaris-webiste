"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { RotateCcw } from "lucide-react";

import { ImageField } from "@/components/admin/image-field";
import { ItemsField, useItemRows } from "@/components/admin/items-field";
import { SeoTip } from "@/components/admin/seo-tip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "cn";
import { useControlledAfterReset } from "@/hooks/use-controlled-after-reset";
import { savePageSection } from "@/lib/cms/sections/actions";
import { sectionEditorConflict, sectionPreviewPaths, type SectionDraft } from "@/lib/cms/sections/drafts";
import {
  fieldName,
  initialSectionFormState,
  type SectionContent,
  type SectionDefinition,
  type SectionField,
} from "@/lib/cms/sections/schema";
import {
  fieldValueFrom,
  itemRowsFrom,
  sectionValuesFrom,
} from "@/lib/cms/sections/values";

/**
 * The editor for one page section.
 *
 * Generic on purpose. Every section is a list of fields described in
 * `lib/cms/sections/schema.ts`, so this renders from that description rather
 * than being written out per section — which is what keeps twenty-odd editable
 * sections to one form instead of twenty forms that drift apart.
 *
 * Each section is its own `<form>` and its own row, so saving the hero cannot
 * touch the process steps, and a rejected save leaves the rest of the page
 * alone. That is also why an accordion of sections works here: nothing is lost
 * by collapsing one.
 *
 * Repeating rows come from `ItemsField`, shared with the offence-page editor.
 * Image fields are React state too, because the picker is: it uploads as soon
 * as a file is chosen and hands back an address.
 */

export type SectionFormProps = {
  page: string;
  definition: SectionDefinition;
  /** What is stored, or undefined when the section has never been edited. */
  stored: SectionContent | undefined;
  draft?: SectionDraft;
  available: boolean;
};

/** Rows for every repeating field of a section, from the given content. */
function rowsFrom(definition: SectionDefinition, content: SectionContent) {
  return Object.fromEntries(
    definition.fields
      .filter((field) => field.kind === "items")
      .map((field) => [field.key, itemRowsFrom(field, content)]),
  );
}

/** The address of every image field of a section, from the given content. */
function imagesFrom(definition: SectionDefinition, content: SectionContent) {
  return Object.fromEntries(
    definition.fields
      .filter((field) => field.kind === "image")
      .map((field) => [field.key, fieldValueFrom(field, content)]),
  );
}

export function SectionForm({ page, definition, stored, draft, available }: SectionFormProps) {
  // The defaults underneath are what the site renders today, so an untouched
  // section opens showing the live copy rather than an empty form.
  const content: SectionContent = { ...definition.defaults, ...(draft?.content ?? stored ?? {}) };
  const [initialContext] = useState(() => ({ draft: draft ?? null, live: stored ?? null }));

  const [state, formAction] = useActionState(savePageSection, {
    ...initialSectionFormState,
    values: sectionValuesFrom(definition, content),
  });

  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  useControlledAfterReset(formRef);
  const alertRef = useRef<HTMLParagraphElement>(null);
  const savedDraft = state.savedDraft !== undefined ? state.savedDraft : initialContext.draft;
  const savedLive = state.savedLiveContent !== undefined ? state.savedLiveContent : initialContext.live;
  const expectedLive = savedDraft ? savedDraft.base_content : savedLive;
  const conflict = sectionEditorConflict({ liveContent: expectedLive, draftId: savedDraft?.id ?? null, draftVersion: savedDraft?.version ?? null }, stored ?? null, draft ?? null);

  const { rowsFor, resetRows } = useItemRows(rowsFrom(definition, content));
  const [images, setImages] = useState(() => imagesFrom(definition, content));

  /*
   * A deliberate discard or original-wording reset replaces the rows and
   * images with the returned live content or source defaults, adjusted during
   * render as the new state arrives rather than in an effect, which would
   * paint the stale values first. The plain text fields need nothing: their
   * `defaultValue` is the returned `state.values`.
   */
  const [seenState, setSeenState] = useState(state);

  if (state !== seenState) {
    setSeenState(state);

    if (state.reset) {
      const restored = { ...definition.defaults, ...(state.savedLiveContent ?? {}) };
      resetRows(rowsFrom(definition, restored));
      setImages(imagesFrom(definition, restored));
    }
  }

  useEffect(() => {
    if (state.status !== "error") return;

    const firstInvalid = formRef.current?.querySelector<HTMLElement>(
      '[aria-invalid="true"]',
    );

    (firstInvalid ?? alertRef.current)?.focus();
  }, [state]);

  const errorId = (key: string) =>
    state.fieldErrors[key] ? `${formId}-${key}-error` : undefined;

  return (
    <form ref={formRef} action={formAction} className="space-y-5">
      <input type="hidden" name="page" value={page} />
      <input type="hidden" name="section" value={definition.key} />
      <input type="hidden" name="workflowVersion" value="1" />
      <input type="hidden" name="expectedLiveContent" value={JSON.stringify(expectedLive)} />
      <input type="hidden" name="expectedDraftId" value={savedDraft?.id ?? ""} />
      <input type="hidden" name="expectedDraftVersion" value={savedDraft?.version ?? ""} />
      {!available && <p role="status" className="rounded-xl border p-3 text-sm">Private drafts become available after the reviewed static-draft migration is installed. Reload before saving or publishing.</p>}
      {conflict && <div role="status" className="rounded-xl border p-3 text-sm">
        <p>{conflict === "draft-changed" ? "The saved draft changed, including any history restore. These fields and their original save tokens are retained until you reload." : "The live section changed after this draft was started. Compare the versions, or discard the draft and reload before making a new one."}</p>
        <button type="button" className="mt-2 underline underline-offset-4" onClick={() => window.location.reload()}>Reload editor (discard unsaved edits)</button>
      </div>}
      {savedDraft && <div className="rounded-xl border border-primary/30 p-3 text-sm">
        <p>A private draft is saved. The live section changes only when you publish.</p>
        <div className="mt-2 flex flex-wrap gap-3">{sectionPreviewPaths(definition).map((path) => <a key={path}
          href={`/preview/pages/${savedDraft.id}?path=${encodeURIComponent(path)}`} target="_blank" rel="noopener" className="underline underline-offset-4">Preview on {path}</a>)}</div>
      </div>}

      {state.message ? (
        <p
          ref={alertRef}
          tabIndex={-1}
          role={state.status === "error" ? "alert" : "status"}
          className={cn(
            "rounded-xl border px-4 py-3 text-sm outline-none",
            state.status === "error"
              ? "border-destructive/30 bg-destructive/5 text-destructive"
              : "border-primary/30 bg-primary/5 text-foreground",
          )}
        >
          {state.message}
        </p>
      ) : null}

      {definition.fields.map((field) =>
        field.kind === "items" ? (
          <ItemsField
            key={field.key}
            field={field}
            formId={formId}
            error={state.fieldErrors[field.key]}
            errorId={errorId(field.key)}
            {...rowsFor(field)}
          />
        ) : field.kind === "image" ? (
          <ImageScalarField
            key={field.key}
            field={field}
            value={images[field.key] ?? ""}
            onChange={(value) =>
              setImages((current) => ({ ...current, [field.key]: value }))
            }
            error={state.fieldErrors[field.key]}
            errorId={errorId(field.key)}
          />
        ) : (
          <ScalarField
            key={field.key}
            field={field}
            formId={formId}
            value={state.values[field.key] ?? ""}
            error={state.fieldErrors[field.key]}
            errorId={errorId(field.key)}
          />
        ),
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
        <div className="flex flex-wrap gap-3"><SaveButton available={available && !conflict} />
          <ActionButton intent="publish" available={available && !conflict}>Publish changes</ActionButton>
          {savedDraft && <ActionButton intent="discard" available={available && conflict !== "draft-changed"} formNoValidate>Discard draft</ActionButton>}
        </div>
        {/* Only once a section has been edited: there is nothing to undo
            otherwise, and a button that always does nothing is worse than no
            button. A second submit button of this same form, told apart by
            its `intent`, so the revert's answer arrives in this form's state. */}
        {stored ? (
          <ActionButton intent="reset" available={available && !conflict} formNoValidate
            confirmation={`Publish the original wording for "${definition.label}" immediately and discard its saved draft? Current live values remain in history.`}>
            <RotateCcw aria-hidden="true" />
            Publish original wording
          </ActionButton>
        ) : null}
      </div>
    </form>
  );
}

function SaveButton({ available }: { available: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" name="intent" value="draft" disabled={pending || !available}>
      {pending ? "Saving…" : "Save draft"}
    </Button>
  );
}

function ActionButton({ intent, available, formNoValidate, confirmation, children }: { intent: "publish" | "discard" | "reset"; available: boolean; formNoValidate?: boolean; confirmation?: string; children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return <Button type="submit" name="intent" value={intent} variant={intent === "reset" ? "ghost" : "outline"} disabled={pending || !available} formNoValidate={formNoValidate}
    onClick={(event) => { if (!window.confirm(confirmation ?? (intent === "publish" ? "Publish these section changes to the live website now?" : "Discard this saved draft and unsaved edits? Live content stays unchanged."))) event.preventDefault(); }}>{children}</Button>;
}

// ---------------------------------------------------------------------------

function ScalarField({
  field,
  formId,
  value,
  error,
  errorId,
}: {
  field: SectionField;
  formId: string;
  value: string;
  error?: string;
  errorId?: string;
}) {
  const id = `${formId}-${field.key}`;
  const shared = {
    id,
    name: fieldName(field.key),
    defaultValue: value,
    "aria-invalid": error ? (true as const) : undefined,
    "aria-describedby": errorId,
  };

  return (
    <Field
      label={field.label}
      labelFor={id}
      hint={field.hint}
      seo={field.seo}
      error={error}
      errorId={errorId}
      required={field.required}
    >
      {field.kind === "text" ? (
        <Input {...shared} />
      ) : (
        <Textarea rows={field.rows ?? 3} {...shared} />
      )}
    </Field>
  );
}

/**
 * An image, with the article editor's picker. What the form carries is the
 * address, in the picker's hidden input; the file itself was uploaded when it
 * was chosen.
 */
function ImageScalarField({
  field,
  value,
  onChange,
  error,
  errorId,
}: {
  field: SectionField;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  errorId?: string;
}) {
  return (
    <div className="space-y-1.5" role="group" aria-label={field.label}>
      <p className="text-sm leading-none font-medium">{field.label}</p>
      <ImageField
        name={fieldName(field.key)}
        value={value}
        onChange={onChange}
        describedBy={errorId}
        folder="site"
      />
      {field.hint && !error ? (
        <p className="text-xs text-muted-foreground">{field.hint}</p>
      ) : null}
      {field.seo ? <SeoTip>{field.seo}</SeoTip> : null}
      {error ? (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/**
 * A labelled control with its hint, SEO tip and error. Mirrors the article
 * editor's.
 */
function Field({
  label,
  labelFor,
  hint,
  seo,
  error,
  errorId,
  required,
  children,
}: {
  label: string;
  labelFor: string;
  hint?: string;
  seo?: string;
  error?: string;
  errorId?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={labelFor}>
        {label}
        {required ? null : (
          <span className="text-xs font-normal text-muted-foreground">
            optional
          </span>
        )}
      </Label>
      {children}
      {hint && !error ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
      {seo ? <SeoTip>{seo}</SeoTip> : null}
      {error ? (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
