import Link from "next/link";
import { PageIntro } from "@/components/pages/page-intro";
import "./service-pages.css";
import { Container } from "@/components/ui/container";
import { OnThisPage, type TocItem } from "@/components/ui/on-this-page";
import { Icon } from "@/components/ui/icons";
import { JsonLd } from "@/components/ui/json-ld";
import { FaqBlock } from "@/components/ui/faq-block";
import { InlineMarkup, ServiceMarkup } from "@/components/pages/service-markup";
import { faqSectionId, resolveFaqItems } from "@/lib/cms/faq";
import { CtaBanner } from "@/components/layout/cta-banner";
import {
  breadcrumbNode,
  graph,
  faqPageNode,
  serviceId,
  serviceNode,
  webPageNode,
} from "@/lib/cms/seo/json-ld";
import { structuredDataFor } from "@/lib/cms/seo/metadata";
import { whatsappHref } from "@/lib/site-config";

import type { Service, ServiceGroup, ServicePageContent as ServiceDetailContent } from "@/lib/cms/types";
import type { ServiceSection } from "@/lib/content/service-detail";
import type { SiteConfig } from "@/lib/site-config";

/**
 * Ids the page already uses, which a long-form section's anchor must not take.
 */
const reservedIds = [
  "main",
  "at-a-glance",
  "legal-framework",
  "your-options",
  "sentencing-and-outcomes",
  "ancillary-orders",
  "what-to-share",
  "personal-representation",
  "page-alert",
  "toc-heading",
  "cta-heading",
];

export async function ServicePageContent({ service, detail, groups, descriptions, config, preview = false }: { service: Service; detail?: ServiceDetailContent; groups: ServiceGroup[]; descriptions: Record<string, { intro: string }>; config: SiteConfig; preview?: boolean }) {
  const path = service.href;
  const structured = preview ? null : await structuredDataFor(path, `${service.name} Solicitor`);

  // The offence is prefilled into the chat, so a message arriving from this
  // page already says what it is about. Null when no number is configured.
  const whatsapp = whatsappHref(config, service.name);

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
   * A long-form page names its own related pages. A link to an offence page
   * that is not published would be a dead end, so those are dropped here as
   * well as flagged by the SEO health check.
   */
  const published = new Set(groups.flatMap((item) => item.services.map((entry) => entry.href)));
  const chosenRelated = (detail?.relatedLinks ?? []).filter(
    (link) =>
      link.label?.trim() &&
      link.href?.trim() &&
      (!link.href.startsWith("/services/") || published.has(link.href)),
  );
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
  /*
   * A page with long-form sections is laid out from them; one without keeps
   * the shorter template. A section the editor left with neither a heading
   * nor a body is ignored rather than drawn as an empty band.
   */
  const longForm = (detail?.sections ?? []).filter(
    (section) => section.heading?.trim() || section.body?.trim(),
  );
  const anchors = sectionAnchors(longForm, reservedIds);
  const faqs = resolveFaqItems(detail?.faqItems);
  const faqId = faqSectionId([...reservedIds, ...anchors.filter((id): id is string => id !== null)]);
  const faqSchema = faqPageNode({ path, items: faqs, sectionId: faqId });
  /* Mirrors the headings rendered below, in document order. */
  const sections: TocItem[] = longForm.length
    ? [
        ...(detail ? [{ id: "at-a-glance", label: "At a glance" }] : []),
        ...longForm.flatMap((section, index) => {
          const id = anchors[index];

          return id
            ? [{ id, label: section.eyebrow?.trim() || section.heading!.trim() }]
            : [];
        }),
        ...(faqs.length ? [{ id: faqId, label: "Frequently asked questions" }] : []),
      ]
    : [
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
        ...(faqs.length ? [{ id: faqId, label: "Frequently asked questions" }] : []),
      ];
  const lead = (detail?.lead ?? "")
    .split(/\r?\n\s*\r?\n/)
    .map((paragraph) => paragraph.replace(/\s*\r?\n\s*/g, " ").trim())
    .filter(Boolean);
  const alertTitle = detail?.alertTitle?.trim();
  const alertBody = (detail?.alertBody ?? "")
    .split(/\r?\n\s*\r?\n/)
    .map((paragraph) => paragraph.replace(/\s*\r?\n\s*/g, " ").trim())
    .filter(Boolean);
  const quote = detail?.quote?.trim();

  const rail = (
    <div className="page-rail">
      <OnThisPage items={sections} />
      <aside className="service-contact-card" data-track="contact_card">
        <span className="eyebrow">Speak directly to John</span>
        <h2>
          It starts with
          <br />
          <em>a conversation.</em>
        </h2>
        <p>Free professional advice with no obligation.</p>
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
  );

  return (
    <>
      {structured && <JsonLd
        data={graph([
          ...structured.site,
          webPageNode({
            page: structured.page,
            about: serviceId(path),
            ...(faqSchema ? { hasPart: { "@id": faqSchema["@id"] } } : {}),
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
          ...(faqSchema ? [faqSchema] : []),
        ])}
      />}
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
            <div
              className={`penalty-cards${detail.penalties.length === 1 ? " penalty-cards--single" : ""}`}
            >
              {detail.penalties.map((penalty) => (
                <div
                  key={`${penalty.kicker ?? ""}${penalty.label}`}
                  className={`penalty-card penalty-card--${penalty.tone}`}
                >
                  {penalty.kicker ? (
                    <small className="penalty-kicker">{penalty.kicker}</small>
                  ) : null}
                  <strong>{penalty.label}</strong>
                  {penalty.note ? <span>{penalty.note}</span> : null}
                </div>
              ))}
            </div>
          </Container>
        </section>
      )}
      <section className="section-space">
        <Container>
          {detail && longForm.length > 0 ? (
            <div className="service-detail-grid service-detail-grid--long">
              <div className="service-long-copy">
                {lead.length > 0 ? (
                  <div className="sp-lead">
                    {lead.map((paragraph, index) => (
                      <p key={index}>
                        <InlineMarkup text={paragraph} />
                      </p>
                    ))}
                  </div>
                ) : null}
                {alertTitle || alertBody.length > 0 ? (
                  <div className="sp-alert" role="note" id="page-alert">
                    <Icon name="alert" size={20} className="sp-alert-icon" />
                    <div>
                      {alertTitle ? <p className="sp-alert-title">{alertTitle}</p> : null}
                      {alertBody.map((paragraph, index) => (
                        <p key={index}>
                          <InlineMarkup text={paragraph} />
                        </p>
                      ))}
                    </div>
                  </div>
                ) : null}
                {longForm.map((section, index) => (
                  <LongFormSection
                    key={index}
                    section={section}
                    anchor={anchors[index]}
                    fallbackLabel={service.name}
                  />
                ))}
                {quote ? (
                  <figure className="sp-quote">
                    <blockquote>
                      <p>
                        “<InlineMarkup text={quote} />”
                      </p>
                    </blockquote>
                    {detail.quoteCite?.trim() ? (
                      <figcaption>{detail.quoteCite.trim()}</figcaption>
                    ) : null}
                  </figure>
                ) : null}
                <FaqBlock items={faqs} id={faqId} />
              </div>
              {rail}
            </div>
          ) : (
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
                      {(detail.defenceIssues ?? []).map((issue) => (
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
                    <div
                      className="service-outcomes-table-wrap"
                      role="region"
                      aria-labelledby="sentencing-and-outcomes"
                      tabIndex={0}
                    >
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
                        <div
                          className="service-outcomes-table-wrap"
                          role="region"
                          aria-labelledby="ancillary-orders"
                          tabIndex={0}
                        >
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
                <FaqBlock items={faqs} id={faqId} />
              </div>
              {rail}
            </div>
          )}
          {chosenRelated.length > 0 ? (
            <div className="related-services">
              <p className="eyebrow">Related pages</p>
              {chosenRelated.map((item) => (
                <Link key={item.href} href={item.href}>
                  {item.label}
                  <Icon name="arrowRight" size={18} />
                </Link>
              ))}
            </div>
          ) : related.length > 0 ? (
            <div className="related-services">
              <p className="eyebrow">Related areas</p>
              {related.map((item) => (
                <Link key={item.href} href={item.href}>
                  {item.name}
                  <Icon name="arrowRight" size={18} />
                </Link>
              ))}
            </div>
          ) : null}
        </Container>
      </section>
      <CtaBanner
        config={config}
        heading={detail?.ctaHeading?.trim() || "Your questions matter."}
        emphasis={
          detail?.ctaHeading?.trim()
            ? detail.ctaEmphasis?.trim()
            : "Let’s talk them through."
        }
      />
    </>
  );
}

/** One section of a long-form page: its eyebrow, its `h2` and its body. */
function LongFormSection({
  section,
  anchor,
  fallbackLabel,
}: {
  section: ServiceSection;
  anchor: string | null;
  fallbackLabel: string;
}) {
  const eyebrow = section.eyebrow?.trim();
  const heading = section.heading?.trim();
  const className = [
    "sp-section",
    eyebrow ? "" : "sp-section--continues",
    heading ? "" : "sp-section--untitled",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section className={className} aria-labelledby={anchor ?? undefined}>
      {eyebrow ? (
        <p className="eyebrow sp-eyebrow">
          <span className="small-rule" /> {eyebrow}
        </p>
      ) : null}
      {heading && anchor ? (
        <h2 id={anchor} className="sp-section-heading">
          {heading}
        </h2>
      ) : null}
      {section.body?.trim() ? (
        <div className="sp-body">
          <ServiceMarkup source={section.body} label={heading || fallbackLabel} />
        </div>
      ) : null}
    </section>
  );
}

/**
 * An anchor for every titled section, from its eyebrow where it has one
 * ("the-offence") and its heading otherwise. Unique on the page; untitled
 * sections get none and stay out of the contents list.
 */
function sectionAnchors(sections: ServiceSection[], reserved: string[]): (string | null)[] {
  const used = new Set(reserved);

  return sections.map((section) => {
    const heading = section.heading?.trim();

    if (!heading) return null;

    const base =
      slugify(section.eyebrow?.trim() || heading) || "section";
    let id = base;

    for (let suffix = 2; used.has(id); suffix += 1) id = `${base}-${suffix}`;

    used.add(id);

    return id;
  });
}

function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
}
