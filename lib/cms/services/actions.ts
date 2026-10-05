"use server";

import { redirect } from "next/navigation";

import { isIconName } from "@/components/ui/icons";
import { requireAdmin } from "@/lib/auth";
import {
  formError,
  formFailure,
  readCheckbox,
  readFields,
  validateFields,
  type CmsFormState,
} from "@/lib/cms/form";
import { revalidateFor } from "@/lib/cms/revalidate";
import { dropSeoOverride, moveSeoOverride } from "@/lib/cms/seo/overrides";
import {
  serviceFields,
  serviceRules,
  type ServiceField,
} from "@/lib/cms/services/schema";
import type { ServiceContent } from "@/lib/cms/types";
import { cmsWrite } from "@/lib/cms/write";
import { createClient } from "@/utils/supabase/server";

/**
 * Service catalogue mutations.
 *
 * Everything that changes what a visitor sees goes through `cmsWrite` or ends
 * in `revalidateFor("services")`. The catalogue is in the header's mega-menu,
 * so that sweeps the whole site — which is accurate rather than lazy, and why
 * no caller passes a path.
 */

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

type StoredService = {
  id: string;
  slug: string;
  sort_order: number;
  content: ServiceContent;
};

/**
 * The `sort_order` that puts a service last in `group`.
 *
 * One past the group's highest member. A group nobody has used yet starts at
 * the next hundred after everything else, keeping the banding the seed laid
 * down. Where a group sits in the menu is its own `service_groups.sort_order`
 * now, so this orders services within their group and nothing more.
 *
 * Every service is read rather than filtered in the query: there are under
 * twenty, and the new-group case needs the overall maximum anyway.
 */
async function endOfGroup(
  supabase: SupabaseServerClient,
  group: string,
  excludeId: string | null,
): Promise<number> {
  const { data } = await supabase
    .from("services")
    .select("id, sort_order, content")
    .returns<Pick<StoredService, "id" | "sort_order" | "content">[]>();

  const others = (data ?? []).filter((row) => row.id !== excludeId);
  const members = others.filter((row) => row.content.group === group);

  if (members.length > 0) {
    return Math.max(...members.map((row) => row.sort_order)) + 1;
  }

  const highest = Math.max(-1, ...others.map((row) => row.sort_order));

  return (Math.floor(highest / 100) + 1) * 100;
}

/**
 * Create or update a service.
 *
 * Existing URL slugs may be corrected. The database captures the previous
 * address as a permanent redirect in the same transaction and updates related
 * article links; this action also moves the page's SEO override and rebuilds
 * both paths.
 */
export async function saveService(
  _previous: CmsFormState<ServiceField>,
  formData: FormData,
): Promise<CmsFormState<ServiceField>> {
  await requireAdmin();

  const id = formData.get("id");
  const serviceId = typeof id === "string" && id ? id : null;

  const submitted = readFields(formData, serviceFields);
  const published = readCheckbox(formData, "published");
  const featured = readCheckbox(formData, "featured");

  const supabase = await createClient();

  // What the form does not carry: the position and the police station's link
  // to its own page.
  let existing: StoredService | null = null;

  if (serviceId) {
    const { data } = await supabase
      .from("services")
      .select("id, slug, sort_order, content")
      .eq("id", serviceId)
      .maybeSingle<StoredService>();

    if (!data) {
      return formFailure(
        submitted,
        "This service no longer exists — it may have been deleted in another tab.",
      );
    }

    existing = data;

    // A service with a custom href uses its slug only as a catalogue key. The
    // editor does not expose it, and an action request may not change it by
    // forging the hidden form value.
    if (data.content.href) submitted.slug = data.slug;
  }

  const validation = validateFields(submitted, serviceRules);

  if (!validation.ok) {
    return formError(submitted, validation.fieldErrors);
  }

  const values = validation.values;

  if (!isIconName(values.icon)) {
    return formError(values, { icon: "Choose an icon from the list." });
  }

  // A group is chosen from the list, never invented here: new groups are made
  // under "Add group", where their name is checked and their motoring flag
  // set. The database would create a missing one, but silently.
  const { data: groupRow } = await supabase
    .from("service_groups")
    .select("name")
    .eq("name", values.group)
    .maybeSingle<{ name: string }>();

  if (!groupRow) {
    return formError(values, {
      group: "Choose a group from the list. New groups are added from the Services list.",
    });
  }

  const content: ServiceContent = {
    group: values.group,
    icon: values.icon,
    ...(values.statute ? { statute: values.statute } : {}),
    ...(values.short ? { short: values.short } : {}),
    ...(featured ? { featured: true } : {}),
    ...(values.intro ? { intro: values.intro } : {}),
    ...(existing?.content.href ? { href: existing.content.href } : {}),
  };

  // Staying in its group keeps its place; joining one puts it at the end.
  const sortOrder =
    existing && existing.content.group === values.group
      ? existing.sort_order
      : await endOfGroup(supabase, values.group, serviceId);

  const renamedFrom =
    existing &&
    !existing.content.href &&
    existing.slug !== values.slug
      ? existing.slug
      : null;
  const paths = [
    `/services/${values.slug}`,
    ...(renamedFrom ? [`/services/${renamedFrom}`] : []),
  ];

  const state = await cmsWrite<ServiceField, { id: string } | null>({
    entity: "services",
    values,
    successMessage: published ? "Service saved and published." : "Draft saved.",
    paths,
    run: async (client) =>
      serviceId
        ? client
            .from("services")
            .update({
              slug: values.slug,
              name: values.name,
              published,
              sort_order: sortOrder,
              content,
            })
            .eq("id", serviceId)
            .select("id")
            .maybeSingle()
        : client
            .from("services")
            .insert({
              slug: values.slug,
              name: values.name,
              published,
              sort_order: sortOrder,
              content,
            })
            .select("id")
            .maybeSingle(),
  });

  if (state.status === "success" && renamedFrom) {
    await moveSeoOverride(
      `/services/${renamedFrom}`,
      `/services/${values.slug}`,
    );
  }

  if (state.status === "success" && !serviceId && state.data?.id) {
    // Straight into the editor for the service that now exists, so the next
    // save updates it rather than inserting a second one.
    redirect(`/admin/services/${state.data.id}`);
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
 * Publish or unpublish from the list.
 *
 * Unpublishing takes a service out of the menu, the footer, the services page
 * and the rail beneath the hero, and its offence page stops resolving. The
 * page's own row is untouched, so publishing again brings all of it back.
 */
export async function setServicePublished(id: string, published: boolean) {
  await requireAdmin();

  if (typeof id !== "string" || typeof published !== "boolean") return;

  const supabase = await createClient();

  const { error } = await supabase
    .from("services")
    .update({ published })
    .eq("id", id);

  if (error) {
    console.error(`[cms] Failed to change publish state of service ${id}`, error);

    return;
  }

  revalidateFor("services");
}

/**
 * Move a service up or down within its group.
 *
 * Within, not across: the neighbour is the nearest `sort_order` in the same
 * group, and groups are moved by `moveServiceGroup`. Otherwise the same
 * two-update swap as `moveFee`, and for the same reasons.
 */
export async function moveService(id: string, direction: "up" | "down") {
  await requireAdmin();

  if (typeof id !== "string" || (direction !== "up" && direction !== "down")) {
    return;
  }

  const supabase = await createClient();

  const { data: current } = await supabase
    .from("services")
    .select("id, sort_order, content")
    .eq("id", id)
    .maybeSingle<Pick<StoredService, "id" | "sort_order" | "content">>();

  if (!current) return;

  const { data: neighbour } = await supabase
    .from("services")
    .select("id, sort_order")
    .eq("content->>group", current.content.group)
    .filter("sort_order", direction === "up" ? "lt" : "gt", current.sort_order)
    .order("sort_order", { ascending: direction !== "up" })
    .limit(1)
    .maybeSingle<{ id: string; sort_order: number }>();

  // Already at the end of its group.
  if (!neighbour) return;

  const [{ error: firstError }, { error: secondError }] = await Promise.all([
    supabase
      .from("services")
      .update({ sort_order: neighbour.sort_order })
      .eq("id", current.id),
    supabase
      .from("services")
      .update({ sort_order: current.sort_order })
      .eq("id", neighbour.id),
  ]);

  if (firstError || secondError) {
    console.error(
      `[cms] Failed to reorder service ${id}`,
      firstError ?? secondError,
    );

    return;
  }

  revalidateFor("services");
}

/**
 * Delete a service and, by the foreign key's cascade, its offence page.
 *
 * The editor's confirm says so. Articles pointing at the service keep the link
 * in their data but stop showing it, because the article page only links to a
 * service it can find in the published catalogue.
 */
export async function deleteService(formData: FormData) {
  await requireAdmin();

  const id = formData.get("id");

  if (typeof id !== "string") return;

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("services")
    .select("slug")
    .eq("id", id)
    .maybeSingle<{ slug: string }>();

  const { error } = await supabase.from("services").delete().eq("id", id);

  if (error) {
    console.error(`[cms] Failed to delete service ${id}`, error);

    return;
  }

  // Its page's SEO override goes too, rather than passing to whatever is
  // published at the same address next.
  if (existing) await dropSeoOverride(`/services/${existing.slug}`);

  revalidateFor("services");
  redirect("/admin/services");
}
