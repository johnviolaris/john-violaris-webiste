"use client";

import { useActionState, useEffect, useId, useRef } from "react";
import { useFormStatus } from "react-dom";

import { SeoTip } from "@/components/admin/seo-tip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "cn";
import { saveSiteSettings } from "@/lib/cms/settings/actions";
import {
  defaultFor,
  initialSettingsFormState,
  settingGroups,
  type SettingField,
  type SettingValues,
} from "@/lib/cms/settings/schema";

/**
 * The site settings editor.
 *
 * One form for the lot. They are read together and they are short, and the
 * telephone number written for dialling and the one written for printing
 * should be changed in the same breath rather than in two separate saves.
 *
 * Every field is uncontrolled with `defaultValue` from the echoed state, as the
 * contact form is — there is nothing here that has to be reordered or toggled,
 * so nothing needs React state.
 */
export function SiteSettingsForm({ values }: { values: SettingValues }) {
  const [state, formAction] = useActionState(saveSiteSettings, {
    ...initialSettingsFormState,
    values,
  });

  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const alertRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (state.status !== "error") return;

    const firstInvalid = formRef.current?.querySelector<HTMLElement>(
      '[aria-invalid="true"]',
    );

    (firstInvalid ?? alertRef.current)?.focus();
  }, [state]);

  const errorId = (field: SettingField) =>
    state.fieldErrors[field] ? `${formId}-${field}-error` : undefined;

  return (
    <form ref={formRef} action={formAction} className="space-y-8">
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

      {settingGroups.map((group) => (
        <section
          key={group.label}
          className="space-y-4 rounded-xl border p-4 md:p-5"
        >
          <div>
            <h2 className="font-display text-lg font-semibold">
              {group.label}
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {group.description}
            </p>
          </div>

          {group.fields.map((spec) => {
            const id = `${formId}-${spec.key}`;
            const error = state.fieldErrors[spec.key];

            return (
              <div key={spec.key} className="space-y-1.5">
                <Label htmlFor={id}>
                  {spec.label}
                  {spec.required ? null : (
                    <span className="text-xs font-normal text-muted-foreground">
                      optional
                    </span>
                  )}
                </Label>
                <Input
                  id={id}
                  name={spec.key}
                  type={spec.type ?? "text"}
                  defaultValue={state.values[spec.key]}
                  placeholder={defaultFor(spec)}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={errorId(spec.key)}
                />
                {spec.hint && !error ? (
                  <p className="text-xs text-muted-foreground">{spec.hint}</p>
                ) : null}
                {spec.seo ? <SeoTip>{spec.seo}</SeoTip> : null}
                {error ? (
                  <p
                    id={errorId(spec.key)}
                    role="alert"
                    className="text-sm text-destructive"
                  >
                    {error}
                  </p>
                ) : null}
              </div>
            );
          })}
        </section>
      ))}

      <SaveButton />
    </form>
  );
}

function SaveButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : "Save settings"}
    </Button>
  );
}
