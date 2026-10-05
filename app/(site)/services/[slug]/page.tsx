import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageIntro } from "@/components/pages/page-intro";
import { Container } from "@/components/ui/container";
import { OnThisPage } from "@/components/ui/on-this-page";
import { Icon } from "@/components/ui/icons";
import { JsonLd } from "@/components/ui/json-ld";
import { CtaBanner } from "@/components/layout/cta-banner";
import {
  getServiceDescriptions,
  getServiceGroups,
  getServicePage,
  getServices,
  getSiteConfig,
} from "@/lib/cms/queries";
import { redirectFromCms } from "@/lib/cms/redirects";
import {
  breadcrumbNode,
  graph,
  serviceId,
  serviceNode,
  webPageNode,
} from "@/lib/cms/seo/json-ld";
import { seoMetadataFor, structuredDataFor } from "@/lib/cms/seo/metadata";
import { whatsappHref } from "@/lib/site-config";

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
  const structured = await structuredDataFor(path, `${service.name} Solicitor`);

  // The offence is prefilled into the chat, so a message arriving from this
  // page already says what it is about. Null when no number is configured.
  const whatsapp = whatsappHref(config, service.name);

  const detail = page?.detail;
  const group = groups.find((candidate) =>
    candidate.services.some((item) => item.href === service.href),
  );
  /*
   * `Non-Motoring Crime` is kept out of the related list: it covers the same
   * ground as `All Crime` above it, so offering both reads as a duplicate.
   * The service itself still has its page and its place in the nav.
   */
  const related =
    group?.services.filter(
      (item) =>
        item.href !== service.href && item.href !== "/services/all-crime",
    ) ?? [];
  /*
   * Whether the group is motoring offences is set on the group, under
   * Services. Only then can the checklist below ask for a driving record: on
   * a representation page the client may never have been accused of a
   * motoring offence at all.
   */
  const isMotoringOffence = group?.motoring !== false;
  const intro =
    detail?.intro ??
    descriptions[service.href]?.intro ??
    "Personal advice and representation from John Violaris, across England and Wales.";
  /*
   * Present and non-empty. The editor stores neither table when it has no
   * rows, but the content is a database value now, and an empty array should
   * fall back rather than render a heading over an empty table.
   */
  const outcomes = detail?.outcomes?.length ? detail.outcomes : undefined;
  const ancillaryOrders = detail?.ancillaryOrders?.length
    ? detail.ancillaryOrders
    : undefined;
  /* Mirrors the headings rendered below, in document order. */
  const sections = [
    ...(detail ? [{ id: "at-a-glance", label: "At a glance" }] : []),
    ...(detail ? [{ id: "legal-framework", label: "Legal framework" }] : []),
    { id: "your-options", label: "Clarity first" },
    ...(detail
      ? [{ id: "sentencing-and-outcomes", label: "Sentencing and outcomes" }]
      : []),
    ...(ancillaryOrders
      ? [{ id: "ancillary-orders", label: "Ancillary orders" }]
      : []),
    { id: "what-to-share", label: "What to share with me" },
    { id: "personal-representation", label: "Personal representation" },
  ];
  return (
    <>
      <JsonLd
        data={graph([
          ...structured.site,
          webPageNode({
            page: structured.page,
            about: serviceId(path),
            hasBreadcrumb: true,
          }),
          // The trail `PageIntro` prints: Home / <service>.
          breadcrumbNode(path, [{ name: service.name, path }]),
          serviceNode({
            path,
            name: service.name,
            description: intro,
            category: group?.heading,
            jurisdiction: config.jurisdiction,
          }),
        ])}
      />
      <PageIntro
        /* The breadcrumb reads from `eyebrow`, so the offence name belongs here. */
        eyebrow={service.name}
        title={detail?.headline ?? service.name.replace(" · ", " / ")}
        emphasis={detail?.emphasis ?? "Let’s understand your options."}
        description={intro}
      />
      {detail && (
        <section className="penalty-strip" aria-labelledby="at-a-glance">
          <Container>
            <div className="penalty-strip-head">
              <p className="eyebrow" id="at-a-glance">
                <span className="small-rule" /> At a glance
              </p>
              {service.statute && (
                <span className="penalty-statute">{service.statute}</span>
              )}
            </div>
            <div className="penalty-cards">
              {detail.penalties.map((penalty) => (
                <div
                  key={penalty.label}
                  className={`penalty-card penalty-card--${penalty.tone}`}
                >
                  <strong>{penalty.label}</strong>
                  <span>{penalty.note}</span>
                </div>
              ))}
            </div>
          </Container>
        </section>
      )}
      <section className="section-space">
        <Container>
          <div className="service-detail-grid">
            <div className="service-detail-copy">
              {detail ? (
                <>
                  <h2 id="legal-framework" className="service-section-heading">
                    The legal framework
                  </h2>
                  <p>
                    {/*
                     * The sentence only holds where `statute` is a citation.
                     * On a representation page it is a plain descriptor
                     * ("Where most cases are heard"), so it is left out
                     * rather than read back as a legal reference.
                     */}
                    {isMotoringOffence && service.statute && (
                      <>
                        The headline reference for this service is{" "}
                        {service.statute}.{" "}
                      </>
                    )}
                    After reviewing the facts and the procedural history of your
                    case, I will identify the legislation and caselaw that apply
                    to your case.
                  </p>
                  <p className="eyebrow">
                    <span className="small-rule" /> {detail.issuesHeading}
                  </p>
                  <h2 id="your-options" className="display-heading">
                    Clarity first.
                    <br />
                    <em>Then light at the end of the tunnel</em>
                  </h2>
                  <p>{detail.issuesIntro}</p>
                  <dl className="issue-list">
                    {detail.defenceIssues.map((issue) => (
                      <div key={issue.title}>
                        <dt>{issue.title}</dt>
                        <dd>{issue.body}</dd>
                      </div>
                    ))}
                  </dl>
                  <h3 id="sentencing-and-outcomes">
                    Sentencing and possible outcomes
                  </h3>
                  <p>
                    The court has the power to dispose of cases in multiple
                    ways. The following are a breakdown of most disposal options
                    and what they mean.
                  </p>
                  <div className="service-outcomes-table-wrap">
                    <table className="service-outcomes-table">
                      <caption>
                        {outcomes
                          ? "Disposal options at the Magistrates Court"
                          : `Headline consequences for ${service.name}`}
                      </caption>
                      <thead>
                        <tr>
                          <th scope="col">Potential outcome</th>
                          <th scope="col">What this means</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(outcomes ?? detail.penalties).map((row) => (
                          <tr key={row.label}>
                            <th scope="row">{row.label}</th>
                            <td>{row.note}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {ancillaryOrders && (
                    <>
                      <h3 id="ancillary-orders">Ancillary orders</h3>
                      <p>
                        The Court can impose additional orders against you that
                        compel you to behave in a certain way or to prevent you
                        from doing something.
                      </p>
                      <div className="service-outcomes-table-wrap">
                        <table className="service-outcomes-table">
                          <caption>
                            Ancillary orders the court can impose
                          </caption>
                          <thead>
                            <tr>
                              <th scope="col">Ancillary order</th>
                              <th scope="col">What this means</th>
                            </tr>
                          </thead>
                          <tbody>
                            {ancillaryOrders.map((row) => (
                              <tr key={row.label}>
                                <th scope="row">{row.label}</th>
                                <td>{row.note}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                  <h3 id="what-to-share">What to share with me</h3>
                  <ul>
                    <li>
                      Any notice, letter or charge paperwork you have received
                    </li>
                    <li>The dates and location of any hearing or interview</li>
                    <li>
                      Your account of what happened and any supporting documents
                    </li>
                    <li>
                      Photographs, messages, receipts, witness details or other
                      material that may support your account
                    </li>
                    {isMotoringOffence ? (
                      <li>
                        Details of your driving record and how a conviction or
                        disqualification would affect other people
                      </li>
                    ) : (
                      <li>
                        How a conviction would affect your work, your family and
                        anyone who depends on you
                      </li>
                    )}
                    <li>
                      Your main concerns and the questions you want answered
                    </li>
                  </ul>
                </>
              ) : (
                <>
                  <p className="eyebrow">
                    <span className="small-rule" /> Your case, considered
                    carefully
                  </p>
                  <h2 id="your-options" className="display-heading">
                    Clarity first.
                    <br />
                    <em>Then light at the end of the tunnel</em>
                  </h2>
                  <p>
                    Every case has its own circumstances. John will take the
                    time to understand what has happened, review the material
                    available and explain how he can assist.
                  </p>
                  <h3 id="what-to-share">What to share with me</h3>
                  <ul>
                    <li>
                      Any notice, letter or charge paperwork you have received
                    </li>
                    <li>The dates and location of any hearing or interview</li>
                    <li>
                      Your account of what happened and any supporting documents
                    </li>
                    <li>
                      Your main concerns and the questions you want answered
                    </li>
                  </ul>
                </>
              )}
              <h3 id="personal-representation">Personal representation</h3>
              <p>
                When you instruct me, you deal directly with me. I will ensure
                that you clearly understand the proposed work and what it will
                cost.
              </p>
              <Link href="/services" className="text-link">
                Explore all areas of practice{" "}
                <Icon name="arrowRight" size={17} />
              </Link>
            </div>
            <div className="page-rail">
              <OnThisPage items={sections} />
              <aside className="service-contact-card" data-track="contact_card">
                <span className="eyebrow">Speak directly to John</span>
                <h2>
                  It starts with
                  <br />
                  <em>a conversation.</em>
                </h2>
                <p>
                  A free initial consultation. A chance to explain your
                  situation and understand the next step.
                </p>
                <Link href={config.bookingHref} className="action-button">
                  Discuss your case <Icon name="arrowRight" size={17} />
                </Link>
                {whatsapp ? (
                  <a
                    href={whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="service-contact-whatsapp"
                  >
                    <Icon name="whatsapp" size={16} />
                    Message John on WhatsApp
                  </a>
                ) : null}
                <span className="service-contact-caption">
                  20+ years in criminal defence
                  <br />
                  Representing clients across England & Wales
                </span>
              </aside>
              <aside className="service-fee-card">
                <span className="eyebrow">Fees and next steps</span>
                <h2>Know the cost before you commit.</h2>
                <p>
                  Once John has looked at your case, he will give you fixed
                  costs for every eventuality. The first conversation is free.
                </p>
                <Link href="/fees" className="text-link">
                  How fees work <Icon name="arrowRight" size={15} />
                </Link>
              </aside>
            </div>
          </div>
          {related.length > 0 && (
            <div className="related-services">
              <p className="eyebrow">Related areas</p>
              {related.map((item) => (
                <Link key={item.href} href={item.href}>
                  {item.name}
                  <Icon name="arrowRight" size={18} />
                </Link>
              ))}
            </div>
          )}
        </Container>
      </section>
      <CtaBanner
        config={config}
        heading="Your questions matter."
        emphasis="Let’s talk them through."
      />
    </>
  );
}
