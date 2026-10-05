import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ServicePageContent } from "@/components/pages/service-page-content";
import { getServiceDescriptions, getServiceGroups, getServicePage, getServices, getSiteConfig } from "@/lib/cms/queries";
import { redirectFromCms } from "@/lib/cms/redirects";
import { seoMetadataFor } from "@/lib/cms/seo/metadata";

/**
 * The published service at `/services/<slug>`, or undefined.
 *
 * Found in the catalogue rather than through the page join, and the difference
 * is deliberate: a published service whose page is unwritten or still a draft
 * is in the menu, so its URL has to render — with the general copy below —
 * rather than 404 from a link the site itself printed.
 */
async function findService(slug: string) {
  const services = await getServices();

  return services.find((service) => service.href === `/services/${slug}`);
}

/**
 * Prerender every published service at build time.
 *
 * `dynamicParams` is left at its default, so a service added after the build
 * renders on first request rather than 404ing until the next deploy. Police
 * station representation links to its own page and is left out here.
 */
export async function generateStaticParams() {
  const services = await getServices();

  return services
    .filter((service) => service.href.startsWith("/services/"))
    .map((service) => ({ slug: service.href.split("/").pop()! }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  // "<Offence> Solicitor" and the page's standfirst, from the route registry
  // and any SEO override. An unpublished service gets nothing.
  return seoMetadataFor(`/services/${slug}`);
}
export default async function ServicePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const path = `/services/${slug}`;
  const [service, page, groups, descriptions, config] = await Promise.all([
    findService(slug),
    getServicePage(slug),
    getServiceGroups(),
    getServiceDescriptions(),
    getSiteConfig(),
  ]);
  if (!service) {
    await redirectFromCms(path);
    notFound();
  }
  return <ServicePageContent service={service} detail={page?.detail} groups={groups} descriptions={descriptions} config={config} />;
}
