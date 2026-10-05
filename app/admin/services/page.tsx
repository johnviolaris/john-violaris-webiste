import type { Metadata } from "next";
import Link from "next/link";
import { BriefcaseBusiness, Pencil, Plus } from "lucide-react";

import { ClickableRow } from "@/components/admin/clickable-row";
import { PublishToggle } from "@/components/admin/publish-toggle";
import { RowReorder } from "@/components/admin/row-reorder";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "cn";
import {
  listServiceGroups,
  listServicePages,
  listServices,
} from "@/lib/cms/admin-queries";
import { moveServiceGroup } from "@/lib/cms/service-groups/actions";
import { moveService, setServicePublished } from "@/lib/cms/services/actions";
import { servicePath } from "@/lib/cms/services/schema";
import type { ServiceGroupRow, ServiceRow } from "@/lib/cms/types";

export const metadata: Metadata = {
  title: "Services",
};

type GroupListing = {
  name: string;
  /** Null for a name with no group row — only if the groups failed to load. */
  group: ServiceGroupRow | null;
  rows: ServiceRow[];
};

/**
 * Services under their groups, in menu order — the order `toServiceGroups`
 * gives the site, so the list reads as the mega-menu does. Empty groups are
 * listed too: here is where they get their first service.
 */
function groupRows(groups: ServiceGroupRow[], rows: ServiceRow[]): GroupListing[] {
  const listings = new Map<string, GroupListing>(
    groups.map((group) => [group.name, { name: group.name, group, rows: [] }]),
  );

  for (const row of rows) {
    const name = row.content.group;
    let listing = listings.get(name);

    if (!listing) {
      listing = { name, group: null, rows: [] };
      listings.set(name, listing);
    }

    listing.rows.push(row);
  }

  return [...listings.values()];
}

/** The service editor, opened with this group already chosen. */
function addServiceHref(groupName: string) {
  return `/admin/services/new?group=${encodeURIComponent(groupName)}`;
}

export default async function AdminServicesPage() {
  const [services, pages, serviceGroups] = await Promise.all([
    listServices(),
    listServicePages(),
    listServiceGroups(),
  ]);

  const groups = groupRows(serviceGroups, services);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-14 pb-12 md:px-8 md:pt-10">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold">Services</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            The catalogue behind the services menu, the services page, the
            footer and the rail of common charges beneath the hero. Each group
            here is a column in the menu. The long-form page for each offence
            is edited under{" "}
            <Link
              href="/admin/service-pages"
              className="underline underline-offset-4 hover:text-foreground"
            >
              Service pages
            </Link>
            .
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Link
            href="/admin/services/groups/new"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <Plus aria-hidden="true" />
            Add group
          </Link>
          <Link href="/admin/services/new" className={buttonVariants({ size: "sm" })}>
            <Plus aria-hidden="true" />
            Add service
          </Link>
        </div>
      </header>

      {groups.length === 0 ? (
        <div className="grid place-items-center gap-3 rounded-xl border border-dashed px-6 py-16 text-center">
          <BriefcaseBusiness
            className="size-7 text-muted-foreground"
            aria-hidden="true"
          />
          <p className="text-sm font-medium">No services yet.</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Add a group for the menu, then its first service. It appears in the
            services menu once published.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map(({ name: heading, group, rows }, groupIndex) => (
            <section
              key={heading}
              id={group ? `group-${group.id}` : undefined}
              aria-labelledby={`group-heading-${groupIndex}`}
              className="scroll-mt-6"
            >
              <div className="mb-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                  <h2
                    id={`group-heading-${groupIndex}`}
                    className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase"
                  >
                    {heading}
                  </h2>
                  {group && !group.motoring ? (
                    <span className="rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground">
                      Not motoring
                    </span>
                  ) : null}
                  {rows.length > 0 && rows.every((row) => !row.published) ? (
                    <span className="rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground">
                      Not on the site yet
                    </span>
                  ) : null}
                </div>
                {group ? (
                  <div className="flex items-center gap-1">
                    <Link
                      href={addServiceHref(group.name)}
                      className={buttonVariants({ variant: "ghost", size: "sm" })}
                    >
                      <Plus aria-hidden="true" />
                      Add service
                    </Link>
                    <Link
                      href={`/admin/services/groups/${group.id}`}
                      className={buttonVariants({ variant: "ghost", size: "sm" })}
                    >
                      <Pencil aria-hidden="true" />
                      Edit group
                    </Link>
                    <RowReorder
                      id={group.id}
                      label={`the ${group.name} group`}
                      isFirst={groupIndex === 0}
                      isLast={
                        groupIndex === groups.length - 1 ||
                        groups[groupIndex + 1]?.group === null
                      }
                      action={moveServiceGroup}
                    />
                  </div>
                ) : null}
              </div>
              {rows.length === 0 ? (
                <div className="rounded-xl border border-dashed px-6 py-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    No services in this group yet, so it is not on the site.
                  </p>
                  <Link
                    href={addServiceHref(heading)}
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "mt-3",
                    )}
                  >
                    <Plus aria-hidden="true" />
                    Add its first service
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border">
                  <table className="w-full min-w-[52rem] border-collapse text-sm">
                    <caption className="sr-only">
                      {heading}, in the order they appear on the site
                    </caption>
                    <thead>
                      <tr className="border-b bg-muted/50 text-left">
                        <th scope="col" className="w-28 px-4 py-2.5 font-medium">
                          Status
                        </th>
                        <th scope="col" className="px-4 py-2.5 font-medium">
                          Service
                        </th>
                        <th scope="col" className="px-4 py-2.5 font-medium">
                          Reference line
                        </th>
                        <th scope="col" className="px-4 py-2.5 font-medium">
                          Hero rail
                        </th>
                        <th scope="col" className="px-4 py-2.5 font-medium">
                          Offence page
                        </th>
                        <th scope="col" className="w-24 px-4 py-2.5 font-medium">
                          <span className="sr-only">Reorder</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((service, index) => {
                        const page = pages[service.id];

                        return (
                          <ClickableRow
                            key={service.id}
                            href={`/admin/services/${service.id}`}
                          >
                            <td className="px-4 py-3 align-top">
                              <PublishToggle
                                id={service.id}
                                label={service.name}
                                published={service.published}
                                action={setServicePublished}
                              />
                            </td>
                            <td className="px-4 py-3 align-top">
                              <Link
                                href={`/admin/services/${service.id}`}
                                className="font-medium underline-offset-4 hover:underline focus-visible:underline"
                              >
                                {service.name}
                              </Link>
                              <span className="mt-0.5 block text-xs text-muted-foreground">
                                {servicePath(service)}
                              </span>
                            </td>
                            <td className="px-4 py-3 align-top text-muted-foreground">
                              {service.content.statute ?? "—"}
                            </td>
                            <td className="px-4 py-3 align-top text-muted-foreground">
                              {service.content.featured
                                ? (service.content.short ?? "Shown")
                                : "—"}
                            </td>
                            <td className="px-4 py-3 align-top">
                              <PageStatus service={service} page={page} />
                            </td>
                            <td className="px-2 py-2 align-top">
                              <RowReorder
                                id={service.id}
                                label={service.name}
                                isFirst={index === 0}
                                isLast={index === rows.length - 1}
                                action={moveService}
                              />
                            </td>
                          </ClickableRow>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          ))}
        </div>
      )}

      <p className="mt-6 text-sm text-muted-foreground">
        The arrows beside a group&rsquo;s name move the group in the menu; the
        arrows on a row move a service within its group. A service moved to
        another group goes to the end of it. A group appears on the site once a
        published service is in it.
      </p>
    </div>
  );
}

/**
 * Where the offence page stands, as a link to it.
 *
 * Police station representation links to a page of its own rather than an
 * offence page, and says so instead of offering to write one it would never
 * show.
 */
function PageStatus({
  service,
  page,
}: {
  service: ServiceRow;
  page: { published: boolean } | undefined;
}) {
  if (service.content.href) {
    return <span className="text-muted-foreground">Its own page</span>;
  }

  return (
    <Link
      href={`/admin/service-pages/${service.id}`}
      className="underline-offset-4 hover:underline focus-visible:underline"
    >
      {page ? (
        page.published ? (
          "Published"
        ) : (
          <span className="text-muted-foreground">Draft</span>
        )
      ) : (
        <span className="text-muted-foreground">Not written</span>
      )}
    </Link>
  );
}
