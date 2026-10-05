"use server";

import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/auth";
import {
  formError,
  readCheckbox,
  readFields,
  validateFields,
  type CmsFormState,
} from "@/lib/cms/form";
import { revalidateFor } from "@/lib/cms/revalidate";
import {
  serviceGroupFields,
  serviceGroupRules,
  type ServiceGroupField,
} from "@/lib/cms/service-groups/schema";
import { cmsWrite } from "@/lib/cms/write";
import { createClient } from "@/utils/supabase/server";

/**
 * Service group mutations: the headings of the services menu.
 *
 * A group is a row of its own, but each service still names its group in
 * `content.group`. The database keeps the two in step — renaming a group
 * renames it on its services, and a group with services cannot be deleted —
 * so these actions only ever write `service_groups` itself.
 *
 * Every change revalidates as "services": a group heading is in the header's
 * mega-menu, and whether it is motoring changes its offence pages.
 */

type GroupSummary = { id: string; name: string; sort_order: number };

/**
 * Create or update a group.
 *
 * A new group goes to the end of the menu and appears on the site once a
 * published service is in it. Saving a new group returns to the list, where it
 * waits for its first service.
 */
export async function saveServiceGroup(
  _previous: CmsFormState<ServiceGroupField>,
  formData: FormData,
): Promise<CmsFormState<ServiceGroupField>> {
  await requireAdmin();

  const id = formData.get("id");
  const groupId = typeof id === "string" && id ? id : null;

  const submitted = readFields(formData, serviceGroupFields);
  const motoring = readCheckbox(formData, "motoring");

  const validation = validateFields(submitted, serviceGroupRules);

  if (!validation.ok) {
    return formError(submitted, validation.fieldErrors);
  }

  // Truncation can leave a trailing space, which the database refuses.
  const values = { name: validation.values.name.trim() };

  const supabase = await createClient();
  const { data: groups } = await supabase
    .from("service_groups")
    .select("id, name, sort_order")
    .returns<GroupSummary[]>();

  // Case-blind, because two headings differing only in capitals would read as
  // the same group in the menu while splitting its services between them.
  const clash = (groups ?? []).find(
    (group) =>
      group.id !== groupId &&
      group.name.toLowerCase() === values.name.toLowerCase(),
  );

  if (clash) {
    return formError(values, {
      name: `There is already a group called “${clash.name}”.`,
    });
  }

  const sortOrder =
    Math.max(0, ...(groups ?? []).map((group) => group.sort_order)) + 1;

  const state = await cmsWrite<ServiceGroupField, { id: string } | null>({
    entity: "services",
    values,
    successMessage: "Group saved.",
    run: async (client) =>
      groupId
        ? client
            .from("service_groups")
            .update({ name: values.name, motoring })
            .eq("id", groupId)
            .select("id")
            .maybeSingle()
        : client
            .from("service_groups")
            .insert({ name: values.name, motoring, sort_order: sortOrder })
            .select("id")
            .maybeSingle(),
  });

  if (state.status === "success" && !groupId && state.data?.id) {
    redirect(`/admin/services#group-${state.data.id}`);
  }

  // Rebuilt field by field rather than spread: `data` stays on the server.
  return {
    status: state.status,
    message: state.message,
    fieldErrors: state.fieldErrors,
    values: state.values,
  };
}

/**
 * Move a group up or down the menu.
 *
 * The same two-update swap as `moveService`, with the neighbour being the
 * nearest `sort_order` either side.
 */
export async function moveServiceGroup(id: string, direction: "up" | "down") {
  await requireAdmin();

  if (typeof id !== "string" || (direction !== "up" && direction !== "down")) {
    return;
  }

  const supabase = await createClient();

  const { data: current } = await supabase
    .from("service_groups")
    .select("id, sort_order")
    .eq("id", id)
    .maybeSingle<{ id: string; sort_order: number }>();

  if (!current) return;

  const { data: neighbour } = await supabase
    .from("service_groups")
    .select("id, sort_order")
    .filter("sort_order", direction === "up" ? "lt" : "gt", current.sort_order)
    .order("sort_order", { ascending: direction !== "up" })
    .limit(1)
    .maybeSingle<{ id: string; sort_order: number }>();

  // Already first or last.
  if (!neighbour) return;

  const [{ error: firstError }, { error: secondError }] = await Promise.all([
    supabase
      .from("service_groups")
      .update({ sort_order: neighbour.sort_order })
      .eq("id", current.id),
    supabase
      .from("service_groups")
      .update({ sort_order: current.sort_order })
      .eq("id", neighbour.id),
  ]);

  if (firstError || secondError) {
    console.error(
      `[cms] Failed to reorder service group ${id}`,
      firstError ?? secondError,
    );

    return;
  }

  revalidateFor("services");
}

/**
 * Delete an empty group.
 *
 * The editor offers this only while the group is empty, and the database
 * refuses it otherwise, so a service added in another tab meanwhile is safe.
 */
export async function deleteServiceGroup(formData: FormData) {
  await requireAdmin();

  const id = formData.get("id");

  if (typeof id !== "string") return;

  const supabase = await createClient();

  const { error } = await supabase.from("service_groups").delete().eq("id", id);

  if (error) {
    console.error(`[cms] Failed to delete service group ${id}`, error);

    return;
  }

  revalidateFor("services");
  redirect("/admin/services");
}
