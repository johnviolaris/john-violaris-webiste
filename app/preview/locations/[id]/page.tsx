import { notFound } from "next/navigation";
import { getLocationPageAdmin } from "@/lib/cms/locations/admin-queries";
import { getContentRevision } from "@/lib/cms/revisions/queries";
import { getServices, getSiteConfig } from "@/lib/cms/queries";
import { LocationPageContent } from "@/components/pages/location-page-content";
import type { LocationPageRow } from "@/lib/cms/types";
import { getLocationPages } from "@/lib/cms/locations/queries";

export default async function PreviewLocation({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ revision?: string }> }) {
  const { id } = await params;
  // A layout and page can render in parallel: authorize beside the draft read.
  const current = await getLocationPageAdmin(id); if (!current) notFound();
  const { revision } = await searchParams;
  const location = revision ? await getContentRevision("location_pages", id, revision) as LocationPageRow | null : current;
  if (!location) notFound();
  const [services, config, locations] = await Promise.all([getServices(), getSiteConfig(), location.content.relatedLocations?.length ? getLocationPages() : Promise.resolve([])]);
  return <>{revision && <p role="status" className="bg-gold px-4 py-3 text-center text-sm">Historical version preview.</p>}<LocationPageContent location={location} services={services} config={config} locations={locations} preview /></>;
}
