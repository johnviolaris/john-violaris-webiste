import {
  initialCmsFormState,
  type CmsFormState,
  type FieldRule,
} from "@/lib/cms/form";

/**
 * The service-group editor's field list and rules.
 *
 * Shared by the form and the action that receives it, so the two cannot
 * drift apart. The motoring flag is a checkbox and travels separately, as the
 * service editor's do.
 *
 * No server-only imports: the editor is a client component.
 */

export const serviceGroupFields = ["name"] as const;

export type ServiceGroupField = (typeof serviceGroupFields)[number];

export type ServiceGroupValues = Record<ServiceGroupField, string>;

export const emptyServiceGroupValues: ServiceGroupValues = { name: "" };

/** 60 matches the database's check on the name. */
export const serviceGroupRules: Record<ServiceGroupField, FieldRule> = {
  name: { label: "Name", required: true, maxLength: 60 },
};

/**
 * The editor's starting state.
 *
 * Here rather than beside the action: every export of a `"use server"` module
 * has to be an async function.
 */
export const initialServiceGroupFormState: CmsFormState<ServiceGroupField> =
  initialCmsFormState(emptyServiceGroupValues);
