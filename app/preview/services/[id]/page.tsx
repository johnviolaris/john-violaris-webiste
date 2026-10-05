import { notFound } from "next/navigation";
import { ServicePageContent } from "@/components/pages/service-page-content";
import { getService, getServicePageFor, listServiceGroups, listServices } from "@/lib/cms/admin-queries";
import { getSiteConfig } from "@/lib/cms/queries";
import { toService, toServiceDescriptions, toServiceGroups } from "@/lib/cms/mappers";
import { getContentRevision } from "@/lib/cms/revisions/queries";
import type { ServicePageRow } from "@/lib/cms/types";

export default async function PreviewService({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ revision?: string }> }) {
  const { id } = await params;
  const service = await getService(id);
  if (!service || service.content.href) notFound();
  const [page, rows, groups, config] = await Promise.all([
    getServicePageFor(id), listServices(), listServiceGroups(), getSiteConfig(),
  ]);
  const { revision } = await searchParams;
  const historical = revision && page
    ? await getContentRevision("service_pages", page.id, revision) as ServicePageRow | null : null;
  if (revision && !historical) notFound();
  return <>
    {revision && <p role="status" className="bg-gold px-4 py-3 text-center text-sm">Historical version preview. This is the content saved at that time.</p>}
    <ServicePageContent service={toService(service)} detail={historical?.content ?? page?.content}
      groups={toServiceGroups(rows, groups)} descriptions={toServiceDescriptions(rows)}
      config={config} preview />
  </>;
}
