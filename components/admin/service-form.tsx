"use client";

import Link from "next/link";
import { useActionState, useEffect, useId, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { ExternalLink, Trash2 } from "lucide-react";

import { DetachedActionForm } from "@/components/admin/detached-action-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { iconNames } from "@/components/ui/icons";
import { cn } from "cn";
import { useControlledAfterReset } from "@/hooks/use-controlled-after-reset";
import { representationGroup } from "@/lib/content/services";
import { deleteService, saveService } from "@/lib/cms/services/actions";
import {
  emptyServiceValues,
  initialServiceFormState,
  type ServiceField,
  type ServiceValues,
} from "@/lib/cms/services/schema";
import { slugify } from "@/lib/slug";

/**
 * The service editor.
 *
 * Plain fields throughout, so the text inputs keep `defaultValue` from the
 * echoed state, as the fee editor does. The icon, the slug and the two
 * checkboxes are React state, because React resets a form after an action
 * settles and those would otherwise snap back on a rejected save.
 */

export type ServiceFormProps = {
  /** Null when adding a service. */
  service: {
    id: string;
    values: ServiceValues;
    published: boolean;
    featured: boolean;
    /** Where the service links to — its offence page, or its own page. */
    path: string;
  } | null;
  /** Every group in use, offered as suggestions for the group field. */
  groups: string[];
};

export function ServiceForm({ service, groups }: ServiceFormProps) {
  const initialValues = service?.values ?? emptyServiceValues;

  const [state, formAction] = useActionState(saveService, {
    ...initialServiceFormState,
    values: initialValues,
  });

  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  useControlledAfterReset(formRef);
  const alertRef = useRef<HTMLParagraphElement>(null);

  const [icon, setIcon] = useState(initialValues.icon);
  const [published, setPublished] = useState(service?.published ?? false);
  const [featured, setFeatured] = useState(service?.featured ?? false);

  // Until the slug has been touched, it follows the name. Existing offence
  // pages may also be corrected: the database preserves the former address as
  // a permanent redirect. A custom-href service keeps its internal key fixed.
  const [slug, setSlug] = useState(initialValues.slug);
  const [slugTouched, setSlugTouched] = useState(Boolean(service));

  useEffect(() => {
    if (state.status !== "error") return;

    const firstInvalid = formRef.current?.querySelector<HTMLElement>(
      '[aria-invalid="true"]',
    );

    (firstInvalid ?? alertRef.current)?.focus();
  }, [state]);

  const errorId = (field: ServiceField) =>
    state.fieldErrors[field] ? `${formId}-${field}-error` : undefined;

  const fieldProps = (field: ServiceField) => ({
    id: `${formId}-${field}`,
    name: field,
    defaultValue: state.values[field],
    "aria-invalid": state.fieldErrors[field] ? (true as const) : undefined,
    "aria-describedby": errorId(field),
  });

  const deleteFormId = `${formId}-delete`;

  return (
    <>
      <form ref={formRef} action={formAction} className="space-y-8">
        {service ? <input type="hidden" name="id" value={service.id} /> : null}

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
          <h2 className="font-display text-lg font-semibold">The service</h2>

          <Field
            label="Name"
            labelFor={`${formId}-name`}
            hint="As it reads in the menu and at the top of its page, e.g. “Drink Driving”."
            error={state.fieldErrors.name}
            errorId={errorId("name")}
          >
            <Input
              {...fieldProps("name")}
              onChange={(event) => {
                if (!slugTouched) setSlug(slugify(event.target.value));
              }}
            />
          </Field>

          {service && !service.path.startsWith("/services/") ? (
            <div className="space-y-1.5">
              <p className="text-sm leading-none font-medium">Address</p>
              <p className="font-mono text-sm">{service.path}</p>
              <p className="text-xs text-muted-foreground">
                This service uses a standalone page, so its internal catalogue
                key is not editable here.
              </p>
              <input type="hidden" name="slug" value={service.values.slug} />
            </div>
          ) : (
            <Field
              label="URL slug"
              labelFor={`${formId}-slug`}
              hint={
                service
                  ? `The page will move to /services/${slug || "…"}. Its previous address will redirect permanently.`
                  : `The page will live at /services/${slug || "…"}.`
              }
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
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Group"
              labelFor={`${formId}-group`}
              hint={`The menu column it sits in. Pick an existing one or type a new one. Services under “${representationGroup}” are treated as general crime rather than motoring on their pages.`}
              error={state.fieldErrors.group}
              errorId={errorId("group")}
            >
              <Input list={`${formId}-groups`} {...fieldProps("group")} />
              <datalist id={`${formId}-groups`}>
                {groups.map((group) => (
                  <option key={group} value={group} />
                ))}
              </datalist>
            </Field>

            <Field
              label="Icon"
              labelFor={`${formId}-icon`}
              hint="Shown in the menu and on the service card."
              error={state.fieldErrors.icon}
              errorId={errorId("icon")}
            >
              <select
                id={`${formId}-icon`}
                name="icon"
                value={icon}
                onChange={(event) => setIcon(event.target.value)}
                aria-invalid={state.fieldErrors.icon ? true : undefined}
                aria-describedby={errorId("icon")}
                className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
              >
                {iconNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field
            label="Reference line"
            labelFor={`${formId}-statute`}
            hint="The small line under the name in the menu. The statute for an offence, e.g. “s.5 RTA 1988”, or a short descriptor for representation work."
            error={state.fieldErrors.statute}
            errorId={errorId("statute")}
            optional
          >
            <Input {...fieldProps("statute")} />
          </Field>

          <Field
            label="Card summary"
            labelFor={`${formId}-intro`}
            hint="One or two sentences on the service card on the home and services pages. Also the search-engine description when the service has no page."
            error={state.fieldErrors.intro}
            errorId={errorId("intro")}
            optional
          >
            <Textarea rows={3} {...fieldProps("intro")} />
          </Field>
        </section>

        {/* ------------------------------------------------------------------ */}
        <section className="space-y-4 rounded-xl border p-4 md:p-5">
          <h2 className="font-display text-lg font-semibold">
            Rail beneath the hero
          </h2>

          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              name="featured"
              checked={featured}
              onChange={(event) => setFeatured(event.target.checked)}
              className="mt-0.5 size-4 rounded border-input accent-primary"
            />
            <span className="text-sm">
              <span className="font-medium">Show in the rail</span>
              <span className="mt-0.5 block text-muted-foreground">
                The strip of common charges along the bottom of the home page
                hero. Keep it to the charges people most often arrive with.
              </span>
            </span>
          </label>

          {featured ? (
            <Field
              label="Short name"
              labelFor={`${formId}-short`}
              hint="Used in the rail when the full name is too long, e.g. “Totting Up”. Left blank, the rail uses the full name."
              error={state.fieldErrors.short}
              errorId={errorId("short")}
              optional
            >
              <Input {...fieldProps("short")} />
            </Field>
          ) : (
            // Kept in the submission while hidden, so unticking the box and
            // saving does not lose a short name someone wrote.
            <input type="hidden" name="short" value={state.values.short} />
          )}
        </section>

        {/* ------------------------------------------------------------------ */}
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
                A published service is in the menu, the footer and the services
                page, and its page can be visited. Unpublish it to take all of
                that down without losing anything.
              </span>
            </span>
          </label>
        </section>

        {/* ------------------------------------------------------------------ */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <SaveButton isNew={!service} />
            <Link
              href="/admin/services"
              className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Back to all services
            </Link>
            {/* Only a service at /services/… has an offence page to edit. */}
            {service?.path.startsWith("/services/") ? (
              <Link
                href={`/admin/service-pages/${service.id}`}
                className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                Edit its page
              </Link>
            ) : null}
            {service?.published ? (
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

          {service ? (
            <Button
              type="submit"
              form={deleteFormId}
              variant="destructive"
              size="sm"
            >
              <Trash2 aria-hidden="true" />
              Delete service
            </Button>
          ) : null}
        </div>
      </form>
      {service ? (
        <DetachedActionForm
          id={deleteFormId}
          action={deleteService}
          confirmMessage={`Permanently delete "${service.values.name}" and its page? This cannot be undone — to take it off the site and keep it, unpublish it instead.`}
          fields={{ id: service.id }}
        />
      ) : null}
    </>
  );
}

function SaveButton({ isNew }: { isNew: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : isNew ? "Add service" : "Save changes"}
    </Button>
  );
}

/** A labelled control with its hint and error. Mirrors the fee editor's. */
function Field({
  label,
  labelFor,
  hint,
  error,
  errorId,
  optional,
  children,
}: {
  label: string;
  labelFor: string;
  hint?: string;
  error?: string;
  errorId?: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={labelFor}>
        {label}
        {optional ? (
          <span className="text-xs font-normal text-muted-foreground">
            optional
          </span>
        ) : null}
      </Label>
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
