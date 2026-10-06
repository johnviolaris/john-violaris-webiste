import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LocationPageContent } from "@/components/pages/location-page-content";
import { getLocationPage, getLocationPages } from "@/lib/cms/locations/queries";
import { getServices, getSiteConfig } from "@/lib/cms/queries";
import { redirectFromCms } from "@/lib/cms/redirects";
import { seoMetadataFor } from "@/lib/cms/seo/metadata";

export const revalidate = 60;
export async function generateStaticParams() {
  return (await getLocationPages()).map((page) => ({ slug: page.slug }));
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return seoMetadataFor(`/locations/${slug}`);
}

export default async function LocationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const path = `/locations/${slug}`;
  const location = await getLocationPage(slug);
  if (!location) { await redirectFromCms(path); notFound(); }
  const [services, config, locations] = await Promise.all([getServices(), getSiteConfig(), location.content.relatedLocations?.length ? getLocationPages() : Promise.resolve([])]);
  return <LocationPageContent location={location} services={services} config={config} locations={locations} />;
}
