"use client";

import Link from "next/link";
import { useActionState, useEffect, useId, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { ExternalLink, Trash2 } from "lucide-react";

import { DetachedActionForm } from "@/components/admin/detached-action-form";
import { ItemsField, useItemRows } from "@/components/admin/items-field";
import { FaqFields } from "@/components/admin/faq-fields";
import { SeoTip } from "@/components/admin/seo-tip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "cn";
import { useControlledAfterReset } from "@/hooks/use-controlled-after-reset";
import {
  deleteServicePage,
  saveServicePage,
} from "@/lib/cms/service-pages/actions";
import {
  ancillaryOrdersField,
  defenceIssuesField,
  initialServicePageFormState,
  outcomesField,
  penaltiesField,
  relatedLinksField,
  sectionsField,
  servicePageAsSection,
  servicePageItemFields,
  servicePageValuesFrom,
  type ServicePageField,
} from "@/lib/cms/service-pages/schema";
import { itemRowsFrom } from "@/lib/cms/sections/values";
import { seoTips } from "@/lib/cms/seo-tips";
import type { SectionField } from "@/lib/cms/sections/schema";
import type { ServicePageContent } from "@/lib/cms/types";

/**
 * The offence-page editor.
 *
 * Laid out in the order the page reads, so each block of the form sits where
 * its words appear on the site: the heading and its cards, then the points
 * examined, then the two tables.
 *
 * Single-value fields keep `defaultValue` from the echoed state, as the other
 * editors do. The repeating groups are `ItemsField`s — the same component
 * Website Content uses — so their rows are React state and survive a rejected
 * save.
 */

export type ServicePageFormProps = {
  service: {
    id: string;
    name: string;
    /** `/services/<slug>`. */
    path: string;
    /** Whether the service itself is live; a page shows only when both are. */
    published: boolean;
  };
  /** Null when the service has no page yet — the first save creates it. */
  page: {
    content: ServicePageContent;
    published: boolean;
  } | null;
};

export function ServicePageForm({ service, page }: ServicePageFormProps) {
  const content = page?.content ?? null;

  const [state, formAction] = useActionState(saveServicePage, {
    ...initialServicePageFormState,
    values: servicePageValuesFrom(content),
  });

  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  useControlledAfterReset(formRef);
  const alertRef = useRef<HTMLParagraphElement>(null);

  const [published, setPublished] = useState(page?.published ?? false);

  const { rowsFor } = useItemRows(
    Object.fromEntries(
      servicePageItemFields.map((field) => [
        field.key,
        itemRowsFrom(field, servicePageAsSection(content)),
      ]),
    ),
  );

  useEffect(() => {
    if (state.status !== "error") return;

    const firstInvalid = formRef.current?.querySelector<HTMLElement>(
      '[aria-invalid="true"]',
    );

    (firstInvalid ?? alertRef.current)?.focus();
  }, [state]);

  const errorId = (field: ServicePageField) =>
    state.fieldErrors[field] ? `${formId}-${field}-error` : undefined;

  const fieldProps = (field: ServicePageField) => ({
    id: `${formId}-${field}`,
    name: field,
    defaultValue: state.values[field],
    "aria-invalid": state.fieldErrors[field] ? (true as const) : undefined,
    "aria-describedby": errorId(field),
  });

  const deleteFormId = `${formId}-delete`;

  const items = (field: SectionField) => (
    <ItemsField
      field={field}
      formId={formId}
      error={state.fieldErrors[field.key as ServicePageField]}
      errorId={errorId(field.key as ServicePageField)}
      {...rowsFor(field)}
    />
  );

  return (
    <>
      <form ref={formRef} action={formAction} className="space-y-8">
        <input type="hidden" name="serviceId" value={service.id} />

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

        {/* ------------------------------------------------------------------ */}
        <section className="space-y-4 rounded-xl border p-4 md:p-5">
          <div>
            <h2 className="font-display text-lg font-semibold">The opening</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              The top of the page, beneath the breadcrumb. The breadcrumb itself
              is the service’s name.
            </p>
          </div>

          <SeoTip variant="section">
            What Google reads first, and what decides whether the page matches a
            search for this offence. {seoTips.searchListing}
          </SeoTip>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Heading"
              labelFor={`${formId}-headline`}
              hint="e.g. “Driving with excess alcohol.”"
              seo={seoTips.mainHeading}
              error={state.fieldErrors.headline}
              errorId={errorId("headline")}
            >
              <Input {...fieldProps("headline")} />
            </Field>

            <Field
              label="Heading, emphasised part"
              labelFor={`${formId}-emphasis`}
              hint="Set in italic after the heading, e.g. “Specialist defence.”"
              seo={seoTips.mainHeadingEmphasis}
              error={state.fieldErrors.emphasis}
              errorId={errorId("emphasis")}
            >
              <Input {...fieldProps("emphasis")} />
            </Field>
          </div>

          <Field
            label="Standfirst"
            labelFor={`${formId}-intro`}
            hint="The paragraph beneath the heading."
            seo="The first sentences Google reads, and the summary of the service it is given behind the scenes. Name the offence the way people search for it and say how John helps. For a new service with no description of its own under SEO Metadata, this is also the snippet under the Google result."
            error={state.fieldErrors.intro}
            errorId={errorId("intro")}
          >
            <Textarea rows={4} {...fieldProps("intro")} />
          </Field>

          {items(penaltiesField)}
        </section>

        {/* ------------------------------------------------------------------ */}
        <section className="space-y-4 rounded-xl border p-4 md:p-5">
          <div>
            <h2 className="font-display text-lg font-semibold">
              The long-form page
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Everything below the at-a-glance cards: an opening statement, a
              highlighted box, the sections, a quote and the related pages.
              Once the page has at least one section, these replace “Clarity
              first” and the tables further down, which are then not shown.
            </p>
          </div>

          <FormattingGuide />

          <Field
            label="Opening statement"
            labelFor={`${formId}-lead`}
            hint="The statement beneath the cards, set large. Words between **double asterisks** are picked out in gold italics."
            seo={seoTips.prose}
            error={state.fieldErrors.lead}
            errorId={errorId("lead")}
          >
            <Textarea rows={4} {...fieldProps("lead")} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-[1fr_2fr]">
            <Field
              label="Highlighted box, title"
              labelFor={`${formId}-alertTitle`}
              hint="e.g. “Already have points?”. Leave both empty for no box."
              error={state.fieldErrors.alertTitle}
              errorId={errorId("alertTitle")}
            >
              <Input {...fieldProps("alertTitle")} />
            </Field>

            <Field
              label="Highlighted box, text"
              labelFor={`${formId}-alertBody`}
              error={state.fieldErrors.alertBody}
              errorId={errorId("alertBody")}
            >
              <Textarea rows={3} {...fieldProps("alertBody")} />
            </Field>
          </div>

          {items(sectionsField)}

          <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
            <Field
              label="Quote"
              labelFor={`${formId}-quote`}
              hint="Set as a pull quote after the last section. Quotation marks are added for you."
              error={state.fieldErrors.quote}
              errorId={errorId("quote")}
            >
              <Textarea rows={3} {...fieldProps("quote")} />
            </Field>

            <Field
              label="Quote, attributed to"
              labelFor={`${formId}-quoteCite`}
              hint="e.g. “John Violaris”."
              error={state.fieldErrors.quoteCite}
              errorId={errorId("quoteCite")}
            >
              <Input {...fieldProps("quoteCite")} />
            </Field>
          </div>

          {items(relatedLinksField)}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Closing banner, heading"
              labelFor={`${formId}-ctaHeading`}
              hint="The large line in the gold band at the foot of the page, e.g. “Charged with careless driving?”. Leave empty for the standard one."
              error={state.fieldErrors.ctaHeading}
              errorId={errorId("ctaHeading")}
            >
              <Input {...fieldProps("ctaHeading")} />
            </Field>

            <Field
              label="Closing banner, emphasised part"
              labelFor={`${formId}-ctaEmphasis`}
              hint="Set in italic beneath it, e.g. “Call before you respond to anything.”"
              error={state.fieldErrors.ctaEmphasis}
              errorId={errorId("ctaEmphasis")}
            >
              <Input {...fieldProps("ctaEmphasis")} />
            </Field>
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        <section className="space-y-4 rounded-xl border p-4 md:p-5">
          <div>
            <h2 className="font-display text-lg font-semibold">
              Clarity first
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              The shorter template, for a page without long-form sections: the
              section after “The legal framework”. Its heading is the same on
              every page; the eyebrow, introduction and points are this page’s
              own.
            </p>
          </div>

          <SeoTip variant="section">
            The heading is the same on every offence page, so the words here are
            what set this page apart. They are where it can match the detailed
            searches.
          </SeoTip>

          <Field
            label="Eyebrow"
            labelFor={`${formId}-issuesHeading`}
            hint="The small capitals above the heading, e.g. “The issues I examine”."
            seo={seoTips.eyebrow}
            error={state.fieldErrors.issuesHeading}
            errorId={errorId("issuesHeading")}
          >
            <Input {...fieldProps("issuesHeading")} />
          </Field>

          <Field
            label="Introduction"
            labelFor={`${formId}-issuesIntro`}
            seo={seoTips.prose}
            error={state.fieldErrors.issuesIntro}
            errorId={errorId("issuesIntro")}
          >
            <Textarea rows={3} {...fieldProps("issuesIntro")} />
          </Field>

          {items(defenceIssuesField)}
        </section>

        {/* ------------------------------------------------------------------ */}
        <section className="space-y-4 rounded-xl border p-4 md:p-5">
          <div>
            <h2 className="font-display text-lg font-semibold">
              Outcomes and orders
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Both tables are optional, and like “Clarity first” they are only
              shown on a page without long-form sections.
            </p>
          </div>

          <SeoTip variant="section">
            “What could happen to me?” is one of the first things people search
            after a charge. Clear, accurate tables answer it directly.
          </SeoTip>

          {items(outcomesField)}
          {items(ancillaryOrdersField)}
        </section>

        {/* ------------------------------------------------------------------ */}
        <FaqFields initialItems={content?.faqItems} error={state.fieldErrors.faqItems} />

        <section className="space-y-4 rounded-xl border p-4 md:p-5">
          <h2 className="font-display text-lg font-semibold">Publication</h2>

          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              name="published"
              checked={published}
              onChange={(event) => setPublished(event.target.checked)}
              className="mt-0.5 size-4 rounded border-input accent-primary"
            />
            <span className="text-sm">
              <span className="font-medium">Published</span>
              <span className="mt-0.5 block text-muted-foreground">
                {service.published
                  ? `A published page replaces the general copy at ${service.path}.`
                  : `The ${service.name} service is itself a draft, so nothing shows at ${service.path} until it is published under Services too.`}{" "}
                Save as a draft as often as you like; everything except the
                heading can be filled in later.
              </span>
            </span>
          </label>

          <SeoTip>{seoTips.published}</SeoTip>
        </section>

        {/* ------------------------------------------------------------------ */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <SaveButton isNew={!page} />
            <Link
              href="/admin/service-pages"
              className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Back to all pages
            </Link>
            <Link
              href={`/admin/services/${service.id}`}
              className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Edit the service
            </Link>
            {service.published ? (
              <a
                href={service.path}
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                View on the site
                <ExternalLink className="size-3.5" aria-hidden="true" />
              </a>
            ) : null}
          </div>

          {/* Only once there is a page: before the first save there is
              nothing to delete. */}
          {page ? (
            <Button
              type="submit"
              form={deleteFormId}
              variant="destructive"
              size="sm"
            >
              <Trash2 aria-hidden="true" />
              Delete page
            </Button>
          ) : null}
        </div>
      </form>
      {page ? (
        <DetachedActionForm
          id={deleteFormId}
          action={deleteServicePage}
          confirmMessage={`Permanently delete everything written on the ${service.name} page? This cannot be undone. The service stays in the menu${service.published ? `, and ${service.path} shows the general copy about how John can help instead` : ""}. To take the page down and keep it, unpublish it instead.`}
          fields={{ serviceId: service.id }}
        />
      ) : null}
    </>
  );
}

function SaveButton({ isNew }: { isNew: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : isNew ? "Create page" : "Save changes"}
    </Button>
  );
}

/**
 * The marks a section's text can use, beside the fields that use them.
 *
 * The full description, and the parser, are `lib/content/service-markup.ts`;
 * this is the version an editor needs at hand.
 */
function FormattingGuide() {
  const rows: [string, string][] = [
    ["A blank line", "Starts a new paragraph."],
    ["### Heading", "A sub-heading within the section."],
    ["#### Title", "A smaller heading. Also the title of a card, a stage or a box."],
    ["##### Label", "Small capitals, e.g. above a card’s title."],
    ["###### Note", "Small print, e.g. the source under a table."],
    ["- item", "A bulleted list, one item per line. Use 1. for a numbered list."],
    ["| A | B |", "A table, one row per line. The first row is the header; a row of | --- | under it is optional."],
    ["::: note", "Starts a gold box; a line with just ::: ends it. Use ::: warning for a red one."],
    ["::: cards", "Cards side by side, ended by :::. Put a line of --- between one card and the next."],
    ["::: steps", "Numbered stages, ended by :::. Put a line of --- between stages."],
    ["**bold**  *italic*", "Within any line."],
    ["[link text](/services/speeding)", "A link. Use an address on this site, or a full https:// address."],
  ];

  return (
    <details className="rounded-lg border bg-muted/40 px-4 py-3 text-sm">
      <summary className="cursor-pointer font-medium">
        How to format the text of a section
      </summary>
      <p className="mt-2 text-muted-foreground">
        Write as you would in a document. These marks, at the start of a line,
        give the text its layout. After saving, “Preview saved service page”
        below the form shows the page as visitors will see it.
      </p>
      <dl className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-[minmax(0,14rem)_1fr]">
        {rows.map(([mark, meaning]) => (
          <div key={mark} className="contents">
            <dt>
              <code className="rounded bg-background px-1.5 py-0.5 text-xs">{mark}</code>
            </dt>
            <dd className="text-muted-foreground">{meaning}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}

/** A labelled control with its hint and error. Mirrors the fee editor's. */
function Field({
  label,
  labelFor,
  hint,
  seo,
  error,
  errorId,
  children,
}: {
  label: string;
  labelFor: string;
  hint?: string;
  /** Search guidance, shown apart from the hint. */
  seo?: string;
  error?: string;
  errorId?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={labelFor}>{label}</Label>
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
