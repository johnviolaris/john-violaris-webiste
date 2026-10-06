import "./inner-pages.css";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button-link";
import { JsonLd } from "@/components/ui/json-ld";
import { CtaBanner } from "@/components/layout/cta-banner";
import type { PublicLocationPage } from "@/lib/cms/locations/queries";
import type { Service } from "@/lib/cms/types";
import type { SiteConfig } from "@/lib/site-config";
import { breadcrumbNode, faqPageNode, graph, webPageNode } from "@/lib/cms/seo/json-ld";
import { structuredDataFor } from "@/lib/cms/seo/metadata";
import { resolveLocationStructuredContent } from "@/lib/cms/locations/structured";
import { FaqBlock } from "@/components/ui/faq-block";
import { readParagraphs } from "@/lib/cms/form";
import { ImageCaption } from "@/components/ui/image-caption";

export async function LocationPageContent({ location, services, config, locations = [], preview = false }: { location: PublicLocationPage; services: Service[]; config: SiteConfig; locations?: Pick<PublicLocationPage, "slug" | "location" | "title">[]; preview?: boolean }) {
  const path = `/locations/${location.slug}`;
  const optional = resolveLocationStructuredContent(location.content);
  const parent = services.find((service) => service.href === optional.parentService);
  const nearby = locations.filter((candidate) => candidate.slug !== location.slug && optional.relatedLocations.includes(`/locations/${candidate.slug}`));
  const relevant = services.filter((service) => location.content.relatedServices.includes(service.href));
  const structured = preview ? null : await structuredDataFor(path, location.title);
  const faq = faqPageNode({ path, items: optional.faqItems });
  const crumbs = [...(parent ? [{ name: parent.name, path: parent.href }] : []), { name: location.location, path }];
  return <>
    {structured && <JsonLd data={graph([...structured.site, webPageNode({ page: structured.page, hasBreadcrumb: true, ...(faq ? { hasPart: { "@id": faq["@id"] } } : {}) }), breadcrumbNode(path, crumbs), ...(faq ? [faq] : [])])} />}
    <section className="page-intro"><Container>{parent ? <nav className="breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><Link href={parent.href}>{parent.name}</Link><span>/</span><span aria-current="page">{location.location}</span></nav> : <Link href="/" className="breadcrumb">Home <span>/</span> {location.location}</Link>}<p className="eyebrow"><span className="small-rule" />Service area · {location.location}</p><h1>{location.title}</h1><p className="page-intro-description">{location.content.intro}</p><div className="page-intro-action"><ButtonLink href="/contact">Free initial consultation</ButtonLink></div></Container></section>
    <section className="section-space"><Container><div className="mx-auto max-w-3xl space-y-10"><section><h2 className="font-display text-2xl">Advice for people in {location.location}</h2><div className="mt-4 space-y-4 text-sm leading-relaxed text-muted-foreground">{optional.localContextRich ? readParagraphs(optional.localContextRich).map((paragraph, index) => <p key={index} className="whitespace-pre-wrap"><ImageCaption caption={paragraph} format="markdown" /></p>) : location.content.localContext.map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div></section><section><h2 className="font-display text-2xl">How John can help</h2><div className="mt-4 space-y-4 text-sm leading-relaxed text-muted-foreground">{location.content.body.map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div></section>
      {optional.courts.length > 0 && <section aria-labelledby="location-courts-heading"><h2 id="location-courts-heading" className="font-display text-2xl">Local court information</h2><div className="mt-4 space-y-6">{optional.courts.map((court) => <section key={court.name} className="space-y-3"><h3 className="font-display text-xl">{court.name}</h3><div className="space-y-3 text-sm leading-relaxed text-muted-foreground">{readParagraphs(court.details).map((paragraph, index) => <p key={index}>{paragraph}</p>)}{court.address && <p><span className="font-medium">Court address:</span> {court.address}</p>}</div><div className="flex flex-wrap gap-4 text-sm">{court.officialUrl && <a href={court.officialUrl} rel="noopener noreferrer" className="underline underline-offset-4">View court information</a>}{court.directionsUrl && <a href={court.directionsUrl} rel="noopener noreferrer" className="underline underline-offset-4">Directions to this court</a>}</div></section>)}</div></section>}
      <FaqBlock items={optional.faqItems} />
      {relevant.length > 0 ? <section><h2 className="font-display text-2xl">Related services</h2><ul className="mt-4 space-y-3">{relevant.map((service) => <li key={service.href}><Link href={service.href} className="underline underline-offset-4">{service.name}</Link></li>)}</ul></section> : null}
      {nearby.length > 0 && <section><h2 className="font-display text-2xl">Related service areas</h2><ul className="mt-4 space-y-3">{nearby.map((candidate) => <li key={candidate.slug}><Link href={`/locations/${candidate.slug}`} className="underline underline-offset-4">{candidate.title}</Link></li>)}</ul></section>}
    </div></Container></section>
    <CtaBanner config={config} />
  </>;
}
