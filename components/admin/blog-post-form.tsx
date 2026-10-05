"use client";

import Link from "next/link";
import { useActionState, useEffect, useId, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  ArrowDown,
  ArrowUp,
  ExternalLink,
  Plus,
  Trash2,
} from "lucide-react";

import { DetachedActionForm } from "@/components/admin/detached-action-form";
import { SlugChangeConfirmation } from "@/components/admin/slug-change-confirmation";
import { ImageField } from "@/components/admin/image-field";
import { FaqFields } from "@/components/admin/faq-fields";
import { SeoTip } from "@/components/admin/seo-tip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { iconNames } from "@/components/ui/icons";
import { cn } from "cn";
import { useControlledAfterReset } from "@/hooks/use-controlled-after-reset";
import { deleteBlogPost, saveBlogPost } from "@/lib/cms/blog/actions";
import {
  emptyBlogPostValues,
  initialBlogPostFormState,
  emptySection,
  sectionCountField,
  sectionField,
  type BlogPostField,
  type BlogPostValues,
  type SectionValues,
} from "@/lib/cms/blog/schema";
import { seoTips } from "@/lib/cms/seo-tips";
import { slugify } from "@/lib/slug";

/**
 * The article editor.
 *
 * A body is a list of sections — a heading, prose beneath it, and an optional
 * bulleted list — which is the shape `/blog/[slug]` already renders and the
 * shape the contents rail is built from. Storing structure rather than markup
 * is what keeps the article page's typography the page's own decision.
 *
 * Section rows are React state rather than uncontrolled inputs. They have to
 * be: they can be added, removed and reordered, and React resets a form after
 * an action settles, which would empty them on a rejected save. The same
 * reasoning covers the selects and the publish checkbox. Plain text inputs keep
 * `defaultValue` from the echoed state, as the contact form does.
 */

export type BlogPostFormProps = {
  /** Null when writing a new article. */
  post: {
    id: string;
    values: BlogPostValues;
    sections: SectionValues[];
    faqItems?: unknown;
    published: boolean;
  } | null;
  categories: { id: string; name: string }[];
  /** For the "related service" list — the page an article should point at. */
  services: { href: string; name: string }[];
};

type Row = SectionValues & { key: string };

function newRow(values: SectionValues = emptySection): Row {
  return { ...values, key: crypto.randomUUID() };
}

export function BlogPostForm({ post, categories, services }: BlogPostFormProps) {
  const initialValues = post?.values ?? emptyBlogPostValues;

  const [state, formAction] = useActionState(saveBlogPost, {
    ...initialBlogPostFormState,
    values: initialValues,
  });

  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  useControlledAfterReset(formRef);
  const alertRef = useRef<HTMLParagraphElement>(null);

  const [rows, setRows] = useState<Row[]>(() =>
    (post?.sections ?? []).map((section) => newRow(section)),
  );
  const [categoryId, setCategoryId] = useState(initialValues.categoryId);
  const [icon, setIcon] = useState(initialValues.icon);
  const [relatedService, setRelatedService] = useState(
    initialValues.relatedService,
  );
  const [featuredImage, setFeaturedImage] = useState(initialValues.featuredImage);
  const [published, setPublished] = useState(post?.published ?? false);

  // Until the slug has been touched, it follows the title. After that it is the
  // editor's, because a published URL should never move on its own.
  const [slug, setSlug] = useState(initialValues.slug);
  const [slugTouched, setSlugTouched] = useState(Boolean(post));

  // Send focus where the problem is, rather than leaving it on a save button
  // at the bottom of a long form.
  useEffect(() => {
    if (state.status !== "error") return;

    const firstInvalid = formRef.current?.querySelector<HTMLElement>(
      '[aria-invalid="true"]',
    );

    (firstInvalid ?? alertRef.current)?.focus();
  }, [state]);

  const errorId = (field: BlogPostField) =>
    state.fieldErrors[field] ? `${formId}-${field}-error` : undefined;

  const fieldProps = (field: BlogPostField) => ({
    id: `${formId}-${field}`,
    name: field,
    defaultValue: state.values[field],
    "aria-invalid": state.fieldErrors[field] ? true : undefined,
    "aria-describedby": errorId(field),
  });

  function updateRow(index: number, part: keyof SectionValues, value: string) {
    setRows((current) =>
      current.map((row, i) => (i === index ? { ...row, [part]: value } : row)),
    );
  }

  function moveRow(index: number, by: -1 | 1) {
    setRows((current) => {
      const next = [...current];
      const target = index + by;

      if (target < 0 || target >= next.length) return current;

      [next[index], next[target]] = [next[target], next[index]];

      return next;
    });
  }

  const deleteFormId = `${formId}-delete`;

  return (
    <>
      <form ref={formRef} action={formAction} className="space-y-8">
        {post ? <input type="hidden" name="id" value={post.id} /> : null}
        {post && <SlugChangeConfirmation previous={post.values.slug} next={slug}
          wasPublished={post.published} prefix="/blog/" />}

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
          <h2 className="font-display text-lg font-semibold">The article</h2>

          <Field
            label="Title"
            labelFor={`${formId}-title`}
            seo="The article’s main heading and, unless SEO Metadata says otherwise, its title in Google. Lead with the question or topic people search for, such as “What happens at a drink driving hearing?”, and keep it under about 60 characters so Google shows it whole."
            error={state.fieldErrors.title}
            errorId={errorId("title")}
          >
            <Input
              {...fieldProps("title")}
              onChange={(event) => {
                if (!slugTouched) setSlug(slugify(event.target.value));
              }}
            />
          </Field>

          <Field
            labelFor={`${formId}-slug`}
            label="URL slug"
            hint={`The article will live at /blog/${slug || "…"}`}
            seo={seoTips.slug}
            error={state.fieldErrors.slug}
            errorId={errorId("slug")}
          >
            <Input
              id={`${formId}-slug`}
              name="slug"
              value={slug}
              aria-invalid={state.fieldErrors.slug ? true : undefined}
              aria-describedby={errorId("slug")}
              onChange={(event) => {
                setSlugTouched(true);
                setSlug(event.target.value);
              }}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              labelFor={`${formId}-categoryId`}
              label="Category"
              seo={seoTips.minor}
              error={state.fieldErrors.categoryId}
              errorId={errorId("categoryId")}
            >
              <Select
                id={`${formId}-categoryId`}
                name="categoryId"
                value={categoryId}
                onChange={setCategoryId}
              >
                <option value="">No category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </Field>

            <Field
              labelFor={`${formId}-icon`}
              label="Icon"
              hint="Shown on the article card, beside the category."
              error={state.fieldErrors.icon}
              errorId={errorId("icon")}
            >
              <Select
                id={`${formId}-icon`}
                name="icon"
                value={icon}
                onChange={setIcon}
              >
                {iconNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field
            labelFor={`${formId}-excerpt`}
            label="Excerpt"
            hint="The card summary, and the description search engines show. Aim for one or two sentences."
            seo="Google’s description for the article unless SEO Metadata overrides it. Say what the reader will learn, in under about 155 characters so it is not cut off."
            error={state.fieldErrors.excerpt}
            errorId={errorId("excerpt")}
          >
            <Textarea rows={3} {...fieldProps("excerpt")} />
          </Field>

          <Field
            labelFor={`${formId}-standfirst`}
            label="Standfirst"
            hint="The opening paragraph beneath the headline, before the first section."
            seo="Answer the article’s main question in the first two sentences. Google often lifts a direct answer from the top of a page into its results."
            error={state.fieldErrors.standfirst}
            errorId={errorId("standfirst")}
          >
            <Textarea rows={3} {...fieldProps("standfirst")} />
          </Field>
        </section>

        {/* ------------------------------------------------------------------ */}
        <section className="space-y-4 rounded-xl border p-4 md:p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-semibold">Body</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                One section per heading. Separate paragraphs with a blank line;
                the list beneath is optional, one item per line.
              </p>
              {/* Here once rather than in every section, where the same
                  advice repeated would bury the fields. */}
              <SeoTip variant="section" className="mt-3">
                Each heading is a subheading to Google. Phrase headings as the
                questions readers ask, such as “Can I keep my licence?”, and
                answer each in the paragraphs beneath. {seoTips.prose} Use the
                list for steps or options: Google sometimes lifts a list
                straight into its results.
              </SeoTip>
            </div>
            <span className="text-sm text-muted-foreground tabular-nums">
              {rows.length} {rows.length === 1 ? "section" : "sections"}
            </span>
          </div>

          <input type="hidden" name={sectionCountField} value={rows.length} />

          {rows.length === 0 ? (
            <p className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
              No sections yet. An article needs at least one before it can be
              published.
            </p>
          ) : null}

          <ol className="space-y-4">
            {rows.map((row, index) => (
              <li
                key={row.key}
                className={cn(
                  "rounded-lg border p-3 md:p-4",
                  state.sectionErrors[index] && "border-destructive/40 bg-destructive/5",
                )}
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                    Section {index + 1}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={index === 0}
                      onClick={() => moveRow(index, -1)}
                    >
                      <ArrowUp aria-hidden="true" />
                      <span className="sr-only">Move section {index + 1} up</span>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={index === rows.length - 1}
                      onClick={() => moveRow(index, 1)}
                    >
                      <ArrowDown aria-hidden="true" />
                      <span className="sr-only">Move section {index + 1} down</span>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setRows((current) => current.filter((_, i) => i !== index))
                      }
                    >
                      <Trash2 aria-hidden="true" />
                      <span className="sr-only">Remove section {index + 1}</span>
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <Field label="Heading" labelFor={`${formId}-section-${index}-heading`}>
                    <Input
                      id={`${formId}-section-${index}-heading`}
                      name={sectionField(index, "heading")}
                      value={row.heading}
                      onChange={(event) =>
                        updateRow(index, "heading", event.target.value)
                      }
                    />
                  </Field>

                  <Field
                    label="Paragraphs"
                    labelFor={`${formId}-section-${index}-paragraphs`}
                  >
                    <Textarea
                      id={`${formId}-section-${index}-paragraphs`}
                      name={sectionField(index, "paragraphs")}
                      rows={6}
                      value={row.paragraphs}
                      onChange={(event) =>
                        updateRow(index, "paragraphs", event.target.value)
                      }
                    />
                  </Field>

                  <Field
                    label="Bulleted list"
                    hint="Optional. One item per line."
                    labelFor={`${formId}-section-${index}-list`}
                  >
                    <Textarea
                      id={`${formId}-section-${index}-list`}
                      name={sectionField(index, "list")}
                      rows={3}
                      value={row.list}
                      onChange={(event) => updateRow(index, "list", event.target.value)}
                    />
                  </Field>
                </div>

                {state.sectionErrors[index] ? (
                  <p role="alert" className="mt-2 text-sm text-destructive">
                    {state.sectionErrors[index]}
                  </p>
                ) : null}
              </li>
            ))}
          </ol>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setRows((current) => [...current, newRow()])}
          >
            <Plus aria-hidden="true" />
            Add section
          </Button>
        </section>

        {/* ------------------------------------------------------------------ */}
        <section className="space-y-4 rounded-xl border p-4 md:p-5">
          <h2 className="font-display text-lg font-semibold">Presentation</h2>

          <Field
            label="Featured image"
            hint="Optional. Shown at the top of the article. JPEG, PNG, WebP or AVIF, up to 4 MB."
            seo={`${seoTips.image} It is also the picture shown when the article is shared.`}
          >
            <ImageField
              name="featuredImage"
              value={featuredImage}
              onChange={setFeaturedImage}
            />
          </Field>

          {featuredImage ? (
            <>
            <Field
              labelFor={`${formId}-featuredImageAlt`}
              label="Image description"
              hint="What the image shows, for anyone using a screen reader. Registered library images use their central descriptions; edit those under Manage images."
              seo={seoTips.imageAlt}
              error={state.fieldErrors.featuredImageAlt}
              errorId={errorId("featuredImageAlt")}
            >
              <Input {...fieldProps("featuredImageAlt")} />
            </Field>
            <Field labelFor={`${formId}-featuredImageTitle`} label="Image title"
              hint="Optional short title. The description above remains the text for screen readers."
              error={state.fieldErrors.featuredImageTitle} errorId={errorId("featuredImageTitle")}>
              <Input {...fieldProps("featuredImageTitle")} />
            </Field>
            <Field labelFor={`${formId}-featuredImageCaption`} label="Image caption"
              hint="Optional text shown below the picture, including an image credit when needed."
              error={state.fieldErrors.featuredImageCaption} errorId={errorId("featuredImageCaption")}>
              <Textarea rows={2} {...fieldProps("featuredImageCaption")} />
            </Field>
            </>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              labelFor={`${formId}-relatedService`}
              label="Related service"
              hint="Where the article sends a reader who wants help."
              seo="A link from the article to the matching service tells Google the two belong together, and sends a reader who needs help to the page that offers it. Pick the closest match."
              error={state.fieldErrors.relatedService}
              errorId={errorId("relatedService")}
            >
              <Select
                id={`${formId}-relatedService`}
                name="relatedService"
                value={relatedService}
                onChange={setRelatedService}
              >
                <option value="">None</option>
                {services.map((service) => (
                  <option key={service.href} value={service.href}>
                    {service.name}
                  </option>
                ))}
              </Select>
            </Field>

            <Field
              labelFor={`${formId}-readTime`}
              label="Read time"
              hint="Left blank, this is worked out from the word count."
              seo={seoTips.minor}
              error={state.fieldErrors.readTime}
              errorId={errorId("readTime")}
            >
              <Input placeholder="8 min read" {...fieldProps("readTime")} />
            </Field>
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        <FaqFields initialItems={post?.faqItems} error={state.faqError} />

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
              <span className="font-medium">Publication enabled</span>
              <span className="mt-0.5 block text-muted-foreground">
                Enable publication now or at the scheduled UK time below.
                Keep this unchecked to save a private draft.
              </span>
            </span>
          </label>

          <SeoTip>{seoTips.published}</SeoTip>

          <Field
            labelFor={`${formId}-publishedAt`}
            label="Publish at (Europe/London)"
            hint="Leave blank to publish immediately. A future date schedules publication. All times use UK local time, including daylight saving."
            seo="When the law changes, update the article rather than writing a new one on the same subject: two similar articles compete with each other in Google, and the page shows when it was last updated."
            error={state.fieldErrors.publishedAt}
            errorId={errorId("publishedAt")}
          >
            <Input type="datetime-local" className="w-auto" {...fieldProps("publishedAt")} />
          </Field>
          <Field
            labelFor={`${formId}-unpublishAt`}
            label="Unpublish at (Europe/London)"
            hint="Optional. The article leaves Resources, its URL and the sitemap after this time. Scheduled changes refresh on the next request after the one-minute cache interval."
            error={state.fieldErrors.unpublishAt}
            errorId={errorId("unpublishAt")}
          >
            <Input type="datetime-local" className="w-auto" {...fieldProps("unpublishAt")} />
          </Field>
        </section>

        {/* ------------------------------------------------------------------ */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <SaveButton isNew={!post} />
            <Link
              href="/admin/blog-posts"
              className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Back to all articles
            </Link>
            {post?.published ? (
              <a
                href={`/blog/${post.values.slug}`}
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                View on the site
                <ExternalLink className="size-3.5" aria-hidden="true" />
              </a>
            ) : null}
            {post ? (
              <a href={`/preview/blog/${post.id}`} target="_blank" rel="noopener"
                className="inline-flex items-center gap-1.5 text-sm underline underline-offset-4">
                Preview saved article <ExternalLink className="size-3.5" aria-hidden="true" />
              </a>
            ) : null}
          </div>

          {post ? (
            <Button
              type="submit"
              form={deleteFormId}
              variant="destructive"
              size="sm"
            >
              <Trash2 aria-hidden="true" />
              Delete article
            </Button>
          ) : null}
        </div>
      </form>
      {post ? (
        <DetachedActionForm
          id={deleteFormId}
          action={deleteBlogPost}
          confirmMessage={`Permanently delete "${post.values.title}"? This cannot be undone.`}
          fields={{ id: post.id }}
        />
      ) : null}
    </>
  );
}

function SaveButton({ isNew }: { isNew: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : isNew ? "Create article" : "Save changes"}
    </Button>
  );
}

// ---------------------------------------------------------------------------
// Small building blocks
// ---------------------------------------------------------------------------

/**
 * A labelled control with its hint and error.
 *
 * `labelFor` is the id of the control the label belongs to, and it is how the
 * label gets clicked into focus and read out by a screen reader. Omit it only
 * for a group that has no single control to point at — the image picker, which
 * is a button and a hidden input — and the label becomes a group caption
 * instead of a `<label>` with a dangling `for`.
 */
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
  labelFor?: string;
  hint?: string;
  /** Search guidance, shown apart from the hint. */
  seo?: string;
  error?: string;
  errorId?: string;
  children: React.ReactNode;
}) {
  const captionId = `${labelFor ?? label.replace(/\W+/g, "-").toLowerCase()}-caption`;

  return (
    <div
      className="space-y-1.5"
      {...(labelFor ? {} : { role: "group", "aria-labelledby": captionId })}
    >
      {labelFor ? (
        <Label htmlFor={labelFor}>{label}</Label>
      ) : (
        <p id={captionId} className="text-sm leading-none font-medium">
          {label}
        </p>
      )}
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

/** A native select, styled to match `Input`. */
function Select({
  id,
  name,
  value,
  onChange,
  children,
}: {
  id: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      id={id}
      name={name}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
    >
      {children}
    </select>
  );
}
