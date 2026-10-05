import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ServicePageForm } from "@/components/admin/service-page-form";
import { getService, getServicePageFor } from "@/lib/cms/admin-queries";
import { servicePath } from "@/lib/cms/services/schema";
import { formatUkShortDateTime } from "@/lib/format";
import { RevisionHistory } from "@/components/admin/revision-history";
import { SeoPanel } from "@/components/admin/seo-panel";

export const metadata: Metadata = {
  title: "Edit service page",
};

/**
 * One offence page, addressed by its service.
 *
 * By the service's id rather than the page's, because a service with no page
 * yet still needs somewhere to write one — the first save creates the row.
 */
export default async function EditServicePagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [service, page] = await Promise.all([
    getService(id),
    getServicePageFor(id),
  ]);

  if (!service) notFound();

  // Police station representation links to its own page instead.
  if (service.content.href) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 pt-14 pb-12 md:px-8 md:pt-10">
        <h1 className="font-display text-2xl font-semibold">{service.name}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This service links to a page of its own at{" "}
          <span className="font-mono">{service.content.href}</span>, which is
          edited under{" "}
          <Link
            href="/admin/website-content/police-station"
            className="underline underline-offset-4 hover:text-foreground"
          >
            Website content
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-14 pb-12 md:px-8 md:pt-10">
      <header className="mb-6">
        <p className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
          Service page
        </p>
        <h1 className="mt-1 font-display text-2xl font-semibold">
          {service.name}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {page ? (
            <>
              Last edited{" "}
              <time dateTime={page.updated_at}>
                {formatUkShortDateTime(page.updated_at)}
              </time>
              .{" "}
              {page.published && service.published
                ? "This page is live on the site."
                : "This page is not visible to visitors yet."}
            </>
          ) : (
            "No page has been written for this service yet. Until one is published, its address shows general copy about how John can help."
          )}
        </p>
      </header>

      <ServicePageForm
        // Keyed by id so moving between two pages rebuilds the editor rather
        // than carrying one page's rows into the next.
        key={service.id}
        service={{
          id: service.id,
          name: service.name,
          path: servicePath(service),
          published: service.published,
        }}
        page={page ? { content: page.content, published: page.published } : null}
      />
      <a href={`/preview/services/${service.id}`} target="_blank" rel="noopener"
        className="mt-5 inline-flex text-sm underline underline-offset-4">Preview saved service page</a>
      {page && <RevisionHistory entity="service_pages" id={page.id} previewPath={`/preview/services/${service.id}`} />}
      <SeoPanel path={servicePath(service)} />
    </div>
  );
}
