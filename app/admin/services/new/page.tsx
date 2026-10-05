import type { Metadata } from "next";

import { ServiceForm } from "@/components/admin/service-form";
import { listServiceGroups } from "@/lib/cms/admin-queries";

export const metadata: Metadata = {
  title: "Add service",
};

export default async function NewServicePage({
  searchParams,
}: {
  searchParams: Promise<{ group?: string }>;
}) {
  const [{ group }, serviceGroups] = await Promise.all([
    searchParams,
    listServiceGroups(),
  ]);
  const groups = serviceGroups.map((serviceGroup) => serviceGroup.name);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-14 pb-12 md:px-8 md:pt-10">
      <header className="mb-6">
        <h1 className="font-display text-2xl font-semibold">Add service</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Nothing appears on the site until you tick Published. Once the service
          is added, write its page under Service pages — until then its page
          shows general copy about how John can help.
        </p>
      </header>

      <ServiceForm service={null} groups={groups} defaultGroup={group} />
    </div>
  );
}
