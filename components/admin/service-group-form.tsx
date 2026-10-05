"use client";

import Link from "next/link";
import { useActionState, useEffect, useId, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Plus, Trash2 } from "lucide-react";

import { DetachedActionForm } from "@/components/admin/detached-action-form";
import { SeoTip } from "@/components/admin/seo-tip";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "cn";
import { useControlledAfterReset } from "@/hooks/use-controlled-after-reset";
import {
  deleteServiceGroup,
  saveServiceGroup,
} from "@/lib/cms/service-groups/actions";
import {
  emptyServiceGroupValues,
  initialServiceGroupFormState,
} from "@/lib/cms/service-groups/schema";

/**
 * The service-group editor: a menu heading and whether its services are
 * motoring offences.
 *
 * The name keeps `defaultValue` from the echoed state, as the other editors'
 * text fields do; the checkbox is React state, because React resets a form
 * after an action settles and it would otherwise snap back on a rejected save.
 */

export type ServiceGroupFormProps = {
  /** Null when adding a group. */
  group: {
    id: string;
    name: string;
    motoring: boolean;
    /** Drafts included: any service at all keeps the group from deletion. */
    serviceCount: number;
  } | null;
};

export function ServiceGroupForm({ group }: ServiceGroupFormProps) {
  const [state, formAction] = useActionState(saveServiceGroup, {
    ...initialServiceGroupFormState,
    values: group ? { name: group.name } : emptyServiceGroupValues,
  });

  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  useControlledAfterReset(formRef);
  const alertRef = useRef<HTMLParagraphElement>(null);

  const [motoring, setMotoring] = useState(group?.motoring ?? true);

  useEffect(() => {
    if (state.status !== "error") return;

    const firstInvalid = formRef.current?.querySelector<HTMLElement>(
      '[aria-invalid="true"]',
    );

    (firstInvalid ?? alertRef.current)?.focus();
  }, [state]);

  // After a rename the page's own props still hold the old name until the
  // next navigation; the saved name is the one a new service should join.
  const savedName =
    state.status === "success" ? state.values.name : (group?.name ?? "");

  const nameError = state.fieldErrors.name;
  const nameErrorId = nameError ? `${formId}-name-error` : undefined;
  const deleteFormId = `${formId}-delete`;

  return (
    <>
      <form ref={formRef} action={formAction} className="space-y-8">
        {group ? <input type="hidden" name="id" value={group.id} /> : null}

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
          <h2 className="font-display text-lg font-semibold">The group</h2>

          <div className="space-y-1.5">
            <Label htmlFor={`${formId}-name`}>Name</Label>
            <Input
              id={`${formId}-name`}
              name="name"
              defaultValue={state.values.name}
              aria-invalid={nameError ? true : undefined}
              aria-describedby={nameErrorId}
            />
            {!nameError ? (
              <p className="text-xs text-muted-foreground">
                The heading of its column in the services menu and its tab on
                the services page, e.g. “Drugs &amp; Alcohol”.
                {group
                  ? " Renaming it moves every service in it along with it."
                  : null}
              </p>
            ) : null}
            <SeoTip>
              Google reads it as the heading over a column of links to the
              offence pages. Name the kind of case in the words clients use,
              such as “Speeding &amp; cameras”, rather than an internal label.
            </SeoTip>
            {nameError ? (
              <p id={nameErrorId} role="alert" className="text-sm text-destructive">
                {nameError}
              </p>
            ) : null}
          </div>

          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              name="motoring"
              checked={motoring}
              onChange={(event) => setMotoring(event.target.checked)}
              className="mt-0.5 size-4 rounded border-input accent-primary"
            />
            <span className="text-sm">
              <span className="font-medium">Motoring offences</span>
              <span className="mt-0.5 block text-muted-foreground">
                Ticked, each offence page in this group reads its reference
                line as the statute and asks the client for their driving
                record. Untick it for general crime and representation, where
                the client may never have been accused of a motoring offence.
              </span>
            </span>
          </label>
        </section>

        {/* ------------------------------------------------------------------ */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <SaveButton isNew={!group} />
            <Link
              href="/admin/services"
              className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Back to all services
            </Link>
            {group ? (
              <Link
                href={`/admin/services/new?group=${encodeURIComponent(savedName)}`}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                <Plus aria-hidden="true" />
                Add a service to this group
              </Link>
            ) : null}
          </div>

          {group && group.serviceCount === 0 ? (
            <Button
              type="submit"
              form={deleteFormId}
              variant="destructive"
              size="sm"
            >
              <Trash2 aria-hidden="true" />
              Delete group
            </Button>
          ) : null}
        </div>

        {group && group.serviceCount > 0 ? (
          <p className="text-sm text-muted-foreground">
            {group.serviceCount === 1
              ? "One service is"
              : `${group.serviceCount} services are`}{" "}
            in this group. A group can be deleted once it is empty: move its
            services to another group, or delete them, first.
          </p>
        ) : null}
      </form>
      {group && group.serviceCount === 0 ? (
        <DetachedActionForm
          id={deleteFormId}
          action={deleteServiceGroup}
          confirmMessage={`Delete the group "${group.name}"? It has no services, so nothing on the site changes.`}
          fields={{ id: group.id }}
        />
      ) : null}
    </>
  );
}

function SaveButton({ isNew }: { isNew: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : isNew ? "Add group" : "Save changes"}
    </Button>
  );
}
