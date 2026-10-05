"use client";

import Link from "next/link";
import { useActionState, useEffect, useId, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { ExternalLink, RotateCcw } from "lucide-react";

import { ImageField } from "@/components/admin/image-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "cn";
import { useControlledAfterReset } from "@/hooks/use-controlled-after-reset";
import { saveSeo } from "@/lib/cms/seo/actions";
import {
  descriptionWarnAt,
  initialSeoFormState,
  seoRules,
  titleWarnAt,
  type SeoField,
  type SeoValues,
} from "@/lib/cms/seo/schema";
import type { RouteDefaults } from "@/lib/cms/seo/resolve";
import { normaliseSeoText } from "@/lib/cms/seo/health";

/**
 * The SEO editor for one page.
 *
 * Every field is an override, so every empty field shows what the page says
 * without one — its default, as the placeholder — and the previews render the
 * result either way. John sees exactly what Google and a WhatsApp preview will
 * get before he saves, whichever fields he fills in.
 *
 * The four text fields the previews read are React state, so the previews and
 * the counts follow the typing. The rest keep `defaultValue` from the echoed
 * state, as the other editors do.
 */

export type SeoFormProps = {
  path: string;
  label: string;
  /** The absolute address, e.g. https://johnviolaris.com/services/speeding. */
  url: string;
  defaults: RouteDefaults;
  values: SeoValues;
  noIndex: boolean;
  noFollow: boolean;
  /** Whether an override exists, which is what "Reset to defaults" removes. */
  customised: boolean;
  /** " | John Violaris" — added to the search title, and counted with it. */
  suffix: string;
  /** The site's default card, shown when neither the page nor John sets one. */
  fallbackImage: string;
  comparisonPages: { path: string; title: string; description: string }[];
  draft?: boolean;
  canManageMedia?: boolean;
};

export function SeoForm({
  path,
  label,
  url,
  defaults,
  values,
  noIndex: initialNoIndex,
  noFollow: initialNoFollow,
  customised,
  suffix,
  fallbackImage,
  comparisonPages,
  draft = false,
  canManageMedia = true,
}: SeoFormProps) {
  const [state, formAction] = useActionState(saveSeo, {
    ...initialSeoFormState,
    values,
  });

  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  useControlledAfterReset(formRef);
  const alertRef = useRef<HTMLParagraphElement>(null);

  const [title, setTitle] = useState(values.title);
  const [description, setDescription] = useState(values.description);
  const [ogTitle, setOgTitle] = useState(values.ogTitle);
  const [ogDescription, setOgDescription] = useState(values.ogDescription);
  const [ogImage, setOgImage] = useState(values.ogImage);
  const [ogType, setOgType] = useState(values.ogType);
  const [twitterTitle, setTwitterTitle] = useState(values.twitterTitle);
  const [twitterDescription, setTwitterDescription] = useState(values.twitterDescription);
  const [twitterImage, setTwitterImage] = useState(values.twitterImage);
  const [noIndex, setNoIndex] = useState(initialNoIndex);
  const [noFollow, setNoFollow] = useState(initialNoFollow);

  /*
   * After "Reset to defaults" the override is gone, but these fields still
   * hold it — and saving again would put it straight back. So a reset empties
   * them, adjusted during render as each new state arrives rather than in an
   * effect, which would paint the stale values first. The uncontrolled fields
   * need nothing: their `defaultValue` is the emptied `state.values`.
   */
  const [seenState, setSeenState] = useState(state);

  if (state !== seenState) {
    setSeenState(state);

    if (state.reset) {
      setTitle("");
      setDescription("");
      setOgTitle("");
      setOgDescription("");
      setOgImage("");
      setOgType("");
      setTwitterTitle("");
      setTwitterDescription("");
      setTwitterImage("");
      setNoIndex(false);
      setNoFollow(false);
    }
  }

  useEffect(() => {
    if (state.status !== "error") return;

    const firstInvalid = formRef.current?.querySelector<HTMLElement>(
      '[aria-invalid="true"]',
    );

    (firstInvalid ?? alertRef.current)?.focus();
  }, [state]);

  const errorId = (field: SeoField) =>
    state.fieldErrors[field] ? `${formId}-${field}-error` : undefined;

  const invalid = (field: SeoField) =>
    state.fieldErrors[field] ? (true as const) : undefined;

  // What the page will actually say, override or not — the same order as
  // `resolveMetadata`, so the previews cannot disagree with the site.
  const shownTitle = (title.trim() || defaults.title) + suffix;
  const shownDescription = description.trim() || defaults.description || "";
  const defaultShareTitle =
    (ogType || defaults.ogType) === "article"
      ? title.trim() || defaults.title
      : shownTitle;
  const shownShareTitle = ogTitle.trim() || defaultShareTitle;
  const shownShareDescription = ogDescription.trim() || shownDescription;
  const shownShareImage = ogImage || defaults.image?.url || fallbackImage;

  const imageSize = useImageSize(ogImage);
  const duplicateTitles = comparisonPages.filter((page) => normaliseSeoText(page.title) === normaliseSeoText(shownTitle));
  const duplicateDescriptions = shownDescription ? comparisonPages.filter((page) => normaliseSeoText(page.description) === normaliseSeoText(shownDescription)) : [];

  return (
    <form ref={formRef} action={formAction} className="space-y-8">
      <input type="hidden" name="path" value={path} />

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

      {state.warnings?.length ? <div className="rounded-xl border border-amber-600/30 p-4 text-sm text-amber-800 dark:text-amber-300" role="status"><p className="font-medium">Saved with suggestions</p><ul className="mt-2 list-disc space-y-1 pl-5">{state.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></div> : null}

      {/* ---------------------------------------------------------------- */}
      <section className="space-y-4 rounded-xl border p-4 md:p-5">
        <div>
          <h2 className="font-display text-lg font-semibold">In Google</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            The headline and the snippet beneath it. Leave a field empty to
            keep the default shown in it.
          </p>
        </div>

        <SearchPreview
          url={url}
          title={shownTitle}
          description={shownDescription}
        />

        <Field
          label="Search title"
          labelFor={`${formId}-title`}
          hint={`Also the browser tab. “${suffix.trim()}” is added after it. Lead with what people search for — the offence, not the name.`}
          error={state.fieldErrors.title}
          errorId={errorId("title")}
          count={<Count length={shownTitle.length} warnAt={titleWarnAt} />}
        >
          <Input
            id={`${formId}-title`}
            name="title"
            maxLength={seoRules.title.maxLength}
            value={title}
            placeholder={defaults.title}
            onChange={(event) => setTitle(event.target.value)}
            aria-invalid={invalid("title")}
            aria-describedby={errorId("title")}
          />
        </Field>

        <Field
          label="Search description"
          labelFor={`${formId}-description`}
          hint="Why this page answers the searcher’s question — and that the first conversation is free and with John himself."
          error={state.fieldErrors.description}
          errorId={errorId("description")}
          count={
            <Count
              length={shownDescription.length}
              warnAt={descriptionWarnAt}
            />
          }
        >
          <Textarea
            id={`${formId}-description`}
            name="description"
            maxLength={seoRules.description.maxLength}
            rows={3}
            value={description}
            placeholder={defaults.description ?? ""}
            onChange={(event) => setDescription(event.target.value)}
            aria-invalid={invalid("description")}
            aria-describedby={errorId("description")}
          />
        </Field>
        <DuplicateNotice pages={duplicateTitles} field="title" />
        <DuplicateNotice pages={duplicateDescriptions} field="description" />
      </section>

      {/* ---------------------------------------------------------------- */}
      <section className="space-y-4 rounded-xl border p-4 md:p-5">
        <div>
          <h2 className="font-display text-lg font-semibold">
            When the link is shared
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            The preview in WhatsApp, iMessage, LinkedIn and the like. Left
            empty, it uses the search title and description.
          </p>
        </div>

        <SharePreview
          url={url}
          title={shownShareTitle}
          description={shownShareDescription}
          image={shownShareImage}
        />

        <Field
          label="Share title"
          labelFor={`${formId}-ogTitle`}
          hint="Used exactly as written."
          error={state.fieldErrors.ogTitle}
          errorId={errorId("ogTitle")}
        >
          <Input
            id={`${formId}-ogTitle`}
            name="ogTitle"
            maxLength={seoRules.ogTitle.maxLength}
            value={ogTitle}
            placeholder={defaultShareTitle}
            onChange={(event) => setOgTitle(event.target.value)}
            aria-invalid={invalid("ogTitle")}
            aria-describedby={errorId("ogTitle")}
          />
        </Field>

        <Field
          label="Share description"
          labelFor={`${formId}-ogDescription`}
          error={state.fieldErrors.ogDescription}
          errorId={errorId("ogDescription")}
        >
          <Textarea
            id={`${formId}-ogDescription`}
            name="ogDescription"
            maxLength={seoRules.ogDescription.maxLength}
            rows={2}
            value={ogDescription}
            placeholder={shownDescription}
            onChange={(event) => setOgDescription(event.target.value)}
            aria-invalid={invalid("ogDescription")}
            aria-describedby={errorId("ogDescription")}
          />
        </Field>

        <Field label="Open Graph type" labelFor={`${formId}-ogType`} hint="Usually article for a guide and website for other pages. Leave the default selected to follow the page type." error={state.fieldErrors.ogType} errorId={errorId("ogType")}>
          <select id={`${formId}-ogType`} name="ogType" value={ogType} onChange={(event) => setOgType(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" aria-invalid={invalid("ogType")} aria-describedby={errorId("ogType")}>
            <option value="">Page default — {defaults.ogType ?? "website"}</option>
            <option value="website">Website</option>
            <option value="article">Article</option>
          </select>
        </Field>

        <Field
          label="Share image"
          hint={
            defaults.image
              ? "Left empty, the article’s featured image is used. Best at 1200 × 630 pixels."
              : "Left empty, the site’s default card is used — the preview above shows it. Best at 1200 × 630 pixels."
          }
          error={state.fieldErrors.ogImage}
          errorId={errorId("ogImage")}
        >
          <ImageField
            name="ogImage"
            value={ogImage}
            onChange={setOgImage}
            folder="share"
            canManageMedia={canManageMedia}
          />
          {imageSize && (imageSize.width < 1200 || imageSize.height < 630) ? (
            <p className="text-xs text-destructive">
              This image is {imageSize.width} × {imageSize.height} pixels.
              Some apps will show it small or crop it; 1200 × 630 or larger
              looks best.
            </p>
          ) : null}
        </Field>

        {ogImage ? (
          <Field
            label="Image description"
            labelFor={`${formId}-ogImageAlt`}
            hint="What the image shows, for anyone using a screen reader."
            error={state.fieldErrors.ogImageAlt}
            errorId={errorId("ogImageAlt")}
          >
            <Input
              id={`${formId}-ogImageAlt`}
              name="ogImageAlt"
              maxLength={seoRules.ogImageAlt.maxLength}
              defaultValue={state.values.ogImageAlt}
              aria-invalid={invalid("ogImageAlt")}
              aria-describedby={errorId("ogImageAlt")}
            />
          </Field>
        ) : null}
      </section>

      {/* ---------------------------------------------------------------- */}
      <details className="rounded-xl border p-4 md:p-5" open={Boolean(values.twitterTitle || values.twitterDescription || values.twitterImage || values.twitterCard || state.fieldErrors.twitterImage || state.fieldErrors.twitterImageAlt || state.fieldErrors.twitterCard)}>
        <summary className="cursor-pointer font-display text-lg font-semibold">X / Twitter</summary>
        <div className="mt-4 space-y-4">
          <p className="text-sm text-muted-foreground">Optional settings for X. Empty fields use the shared link settings above.</p>
          <SharePreview url={url} title={twitterTitle.trim() || shownShareTitle} description={twitterDescription.trim() || shownShareDescription} image={twitterImage || shownShareImage} />
          <Field label="X title" labelFor={`${formId}-twitterTitle`} error={state.fieldErrors.twitterTitle} errorId={errorId("twitterTitle")}>
            <Input id={`${formId}-twitterTitle`} name="twitterTitle" value={twitterTitle} onChange={(event) => setTwitterTitle(event.target.value)} placeholder={shownShareTitle} maxLength={seoRules.twitterTitle.maxLength} aria-invalid={invalid("twitterTitle")} aria-describedby={errorId("twitterTitle")} />
          </Field>
          <Field label="X description" labelFor={`${formId}-twitterDescription`} error={state.fieldErrors.twitterDescription} errorId={errorId("twitterDescription")}>
            <Textarea id={`${formId}-twitterDescription`} name="twitterDescription" value={twitterDescription} onChange={(event) => setTwitterDescription(event.target.value)} placeholder={shownShareDescription} maxLength={seoRules.twitterDescription.maxLength} rows={2} aria-invalid={invalid("twitterDescription")} aria-describedby={errorId("twitterDescription")} />
          </Field>
          <Field label="X image" hint="Leave empty to use the shared link image. Prefer 1200 × 630 pixels." error={state.fieldErrors.twitterImage} errorId={errorId("twitterImage")}>
            <ImageField name="twitterImage" value={twitterImage} onChange={setTwitterImage} folder="share" canManageMedia={canManageMedia} />
          </Field>
          {twitterImage ? (
            <Field label="X image description" labelFor={`${formId}-twitterImageAlt`} error={state.fieldErrors.twitterImageAlt} errorId={errorId("twitterImageAlt")}>
              <Input id={`${formId}-twitterImageAlt`} name="twitterImageAlt" defaultValue={state.values.twitterImageAlt} maxLength={seoRules.twitterImageAlt.maxLength} aria-invalid={invalid("twitterImageAlt")} aria-describedby={errorId("twitterImageAlt")} />
            </Field>
          ) : null}
          <Field label="X card format" labelFor={`${formId}-twitterCard`} error={state.fieldErrors.twitterCard} errorId={errorId("twitterCard")}>
            <select id={`${formId}-twitterCard`} name="twitterCard" defaultValue={state.values.twitterCard} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" aria-invalid={invalid("twitterCard")} aria-describedby={errorId("twitterCard")}>
              <option value="">Default — large image</option>
              <option value="summary_large_image">Large image</option>
              <option value="summary">Compact summary</option>
            </select>
          </Field>
        </div>
      </details>

      {/* ---------------------------------------------------------------- */}
      <details
        className="group rounded-xl border p-4 md:p-5"
        // Open when something in here is set or wrong, so it is never hidden.
        open={
          initialNoIndex ||
          initialNoFollow ||
          Boolean(values.canonical) ||
          Boolean(state.fieldErrors.canonical) ||
          Boolean(values.customJsonLd) ||
          Boolean(state.fieldErrors.customJsonLd)
        }
      >
        <summary className="cursor-pointer font-display text-lg font-semibold">
          Advanced
        </summary>

        <div className="mt-4 space-y-4">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              name="noIndex"
              checked={noIndex}
              onChange={(event) => setNoIndex(event.target.checked)}
              className="mt-0.5 size-4 rounded border-input accent-primary"
            />
            <span className="text-sm">
              <span className="font-medium">Hide from search engines</span>
              <span className="mt-0.5 block text-muted-foreground">
                The page stays on the site for anyone with the link, but
                Google is asked to drop it and it leaves the sitemap. It can
                take a few weeks to disappear from results.
              </span>
            </span>
          </label>

          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              name="noFollow"
              checked={noFollow}
              onChange={(event) => setNoFollow(event.target.checked)}
              className="mt-0.5 size-4 rounded border-input accent-primary"
            />
            <span className="text-sm">
              <span className="font-medium">
                Ask search engines not to follow its links
              </span>
              <span className="mt-0.5 block text-muted-foreground">
                Rarely wanted: it stops this page passing any weight to the
                pages it links to, including John’s own.
              </span>
            </span>
          </label>

          <Field
            label="Canonical address"
            labelFor={`${formId}-canonical`}
            hint="Only when this page repeats another and search engines should credit that one instead. A path such as /services/speeding, or a full https:// address."
            error={state.fieldErrors.canonical}
            errorId={errorId("canonical")}
          >
            <Input
              id={`${formId}-canonical`}
              name="canonical"
              maxLength={seoRules.canonical.maxLength}
              defaultValue={state.values.canonical}
              placeholder={url}
              aria-invalid={invalid("canonical")}
              aria-describedby={errorId("canonical")}
            />
          </Field>
          <Field label="Additional structured data (JSON-LD)" labelFor={`${formId}-customJsonLd`} hint="For an administrator familiar with Schema.org. Add only facts visible on this page. The site already creates the practice, person, page, service/article and breadcrumb nodes. Do not repeat them, add invented ratings or promise case outcomes. Validation checks structure and safety; it does not confirm Google's eligibility rules." error={state.fieldErrors.customJsonLd} errorId={errorId("customJsonLd")}>
            <Textarea id={`${formId}-customJsonLd`} name="customJsonLd" defaultValue={state.values.customJsonLd} rows={10} maxLength={seoRules.customJsonLd.maxLength} spellCheck={false} className="font-mono text-xs" placeholder={'{"@type":"CreativeWork","name":"A fact shown on this page"}'} aria-invalid={invalid("customJsonLd")} aria-describedby={errorId("customJsonLd")} />
          </Field>
        </div>
      </details>

      {/* ---------------------------------------------------------------- */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <SaveButton />
          <Link
            href="/admin/seo-metadata"
            className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Back to all pages
          </Link>
          {!draft ? <a
            href={path}
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            View {label}
            <ExternalLink className="size-3.5" aria-hidden="true" />
          </a> : <span className="text-xs text-muted-foreground">Draft metadata is private until its page becomes public.</span>}
        </div>

        {/* A second submit button of this same form, told apart by its
            `intent`, so the reset's answer arrives in this form's state. */}
        {customised ? (
          <Button
            type="submit"
            name="intent"
            value="reset"
            variant="ghost"
            size="sm"
            onClick={(event) => {
              const confirmed = window.confirm(
                `Remove every SEO setting for ${label} and go back to the page's defaults?`,
              );

              if (!confirmed) event.preventDefault();
            }}
          >
            <RotateCcw aria-hidden="true" />
            Reset to defaults
          </Button>
        ) : null}
      </div>
    </form>
  );
}

function DuplicateNotice({ pages, field }: { pages: { path: string }[]; field: string }) {
  if (pages.length === 0) return null;
  return (
    <p className="text-sm text-amber-800 dark:text-amber-300" role="status">
      This search {field} is also used by {pages.length === 1 ? "another page" : `${pages.length} other pages`}:{" "}
      {pages.map((page, index) => <span key={page.path}>{index > 0 ? ", " : ""}<Link href={`/admin/seo-metadata/edit?path=${encodeURIComponent(page.path)}`} className="underline underline-offset-4">{page.path}</Link></span>)}. Give each page a distinct {field} where possible.
    </p>
  );
}

function SaveButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : "Save changes"}
    </Button>
  );
}

/**
 * The natural size of an uploaded share image, once it has loaded.
 *
 * Read in the browser rather than on upload, because the preview has to load
 * the image anyway and the server would otherwise have to decode it.
 */
function useImageSize(src: string) {
  const [size, setSize] = useState<{
    src: string;
    width: number;
    height: number;
  } | null>(null);

  useEffect(() => {
    if (!src) return;

    const image = new window.Image();

    image.onload = () =>
      setSize({ src, width: image.naturalWidth, height: image.naturalHeight });
    image.src = src;

    return () => {
      image.onload = null;
    };
  }, [src]);

  // A size measured for an image since replaced or removed says nothing.
  return size && size.src === src ? size : null;
}

/** "54 characters", turning to a warning past the point Google cuts off. */
function Count({ length, warnAt }: { length: number; warnAt: number }) {
  const over = length > warnAt;

  return (
    <span
      className={cn(
        "text-xs tabular-nums",
        over ? "text-destructive" : "text-muted-foreground",
      )}
    >
      {length} characters
      {over ? ` — Google usually shows about ${warnAt}` : null}
    </span>
  );
}

/** Roughly how the page will look as a Google result. */
function SearchPreview({
  url,
  title,
  description,
}: {
  url: string;
  title: string;
  description: string;
}) {
  const { host, pathname } = new URL(url);
  const crumbs = pathname.split("/").filter(Boolean);

  return (
    <div
      className="rounded-lg border bg-background p-4"
      aria-label="Search result preview"
      role="group"
    >
      <p className="truncate text-xs text-muted-foreground">
        {host}
        {crumbs.map((crumb) => ` › ${crumb}`)}
      </p>
      <p className="mt-1 line-clamp-1 text-lg leading-snug text-[#1a0dab]">
        {title}
      </p>
      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
        {description || "No description — Google will pick text from the page."}
      </p>
    </div>
  );
}

/** Roughly how the link will look in a chat app. */
function SharePreview({
  url,
  title,
  description,
  image,
}: {
  url: string;
  title: string;
  description: string;
  image: string;
}) {
  return (
    <div
      className="max-w-sm overflow-hidden rounded-lg border bg-muted/40"
      aria-label="Shared link preview"
      role="group"
    >
      {image ? (
        // A plain <img>: this is a preview of a remote upload at its own size,
        // not a page asset for next/image to optimise.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt=""
          className="aspect-[1200/630] w-full bg-muted object-cover"
        />
      ) : null}
      <div className="space-y-0.5 p-3">
        <p className="line-clamp-2 text-sm font-semibold">{title}</p>
        {description ? (
          <p className="line-clamp-2 text-xs text-muted-foreground">
            {description}
          </p>
        ) : null}
        <p className="text-xs text-muted-foreground">{new URL(url).host}</p>
      </div>
    </div>
  );
}

/** A labelled control with its hint, count and error. */
function Field({
  label,
  labelFor,
  hint,
  error,
  errorId,
  count,
  children,
}: {
  label: string;
  /** Omitted for a group with no single control, such as the image picker. */
  labelFor?: string;
  hint?: string;
  error?: string;
  errorId?: string;
  count?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        {labelFor ? (
          <Label htmlFor={labelFor}>{label}</Label>
        ) : (
          <p className="text-sm leading-none font-medium">{label}</p>
        )}
        {count}
      </div>
      {children}
      {hint && !error ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
