import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ServiceGroupForm } from "@/components/admin/service-group-form";
import { getServiceGroup, listServices } from "@/lib/cms/admin-queries";
import { formatUkShortDateTime } from "@/lib/format";

export const metadata: Metadata = {
  title: "Edit group",
};

export default async function EditServiceGroupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [group, services] = await Promise.all([
    getServiceGroup(id),
    listServices(),
  ]);

  if (!group) notFound();

  const members = services.filter((service) => service.content.group === group.name);
  const published = members.filter((service) => service.published).length;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-14 pb-12 md:px-8 md:pt-10">
      <header className="mb-6">
        <h1 className="font-display text-2xl font-semibold">Edit group</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Last edited{" "}
          <time dateTime={group.updated_at}>
            {formatUkShortDateTime(group.updated_at)}
          </time>
          .{" "}
          {published > 0
            ? "This group is in the services menu."
            : "Nothing in this group is published, so it is not on the site yet."}
        </p>
      </header>

      <ServiceGroupForm
        // Keyed by id so moving between two groups rebuilds the editor rather
        // than carrying one group's checkbox across.
        key={group.id}
        group={{
          id: group.id,
          name: group.name,
          motoring: group.motoring,
          serviceCount: members.length,
        }}
      />
    </div>
  );
}
