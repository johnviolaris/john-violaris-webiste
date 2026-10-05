import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ServiceForm } from "@/components/admin/service-form";
import { getService, listServiceGroups } from "@/lib/cms/admin-queries";
import { servicePath, serviceValuesFrom } from "@/lib/cms/services/schema";
import { formatUkShortDateTime } from "@/lib/format";

export const metadata: Metadata = {
  title: "Edit service",
};

export default async function EditServicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [service, serviceGroups] = await Promise.all([
    getService(id),
    listServiceGroups(),
  ]);

  if (!service) notFound();

  const groups = serviceGroups.map((group) => group.name);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-14 pb-12 md:px-8 md:pt-10">
      <header className="mb-6">
        <h1 className="font-display text-2xl font-semibold">Edit service</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Last edited{" "}
          <time dateTime={service.updated_at}>
            {formatUkShortDateTime(service.updated_at)}
          </time>
          .{" "}
          {service.published
            ? "This service is live on the site."
            : "This service is a draft and is not visible to visitors."}
        </p>
      </header>

      <ServiceForm
        // Keyed by id so moving between two services rebuilds the editor
        // rather than carrying the previous one's checkbox state across.
        key={service.id}
        service={{
          id: service.id,
          values: serviceValuesFrom(service),
          published: service.published,
          featured: service.content.featured === true,
          path: servicePath(service),
        }}
        groups={groups}
      />
    </div>
  );
}
