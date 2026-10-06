import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LocationForm } from "@/components/admin/location-form";
import { getLocationPageAdmin, getLocationChoicesAdmin } from "@/lib/cms/locations/admin-queries";
import { getServices } from "@/lib/cms/queries";
import { formatUkShortDateTime } from "@/lib/format";
import { SeoPanel } from "@/components/admin/seo-panel";
import { RevisionHistory } from "@/components/admin/revision-history";

export const metadata: Metadata = { title: "Edit location page" };

export default async function EditLocationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [row, services, locations] = await Promise.all([getLocationPageAdmin(id), getServices(), getLocationChoicesAdmin()]);
  if (!row) notFound();
  return <div className="mx-auto w-full max-w-3xl px-4 pt-14 pb-12 md:px-8 md:pt-10"><h1 className="font-display text-2xl font-semibold">{row.location}</h1><p className="mt-2 mb-6 text-sm text-muted-foreground">{row.published ? "Publication enabled" : "Private draft"}{row.reviewed_at ? <> · Review confirmed <time dateTime={row.reviewed_at}>{formatUkShortDateTime(row.reviewed_at)}</time></> : null}</p><LocationForm row={row} services={services} locations={locations} /><SeoPanel path={`/locations/${row.slug}`} /><RevisionHistory entity="location_pages" id={id} previewPath={`/preview/locations/${id}`} /></div>;
}
