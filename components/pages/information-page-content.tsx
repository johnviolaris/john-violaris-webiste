import { CtaBanner } from "@/components/layout/cta-banner";
import { PageIntro } from "@/components/pages/page-intro";
import "./information-pages.css";
import { AboutBackground } from "@/components/sections/about-background";
import { CareerBand } from "@/components/sections/career-band";
import { ContactEnquiryForm } from "@/components/sections/contact-enquiry-form";
import { CookiePolicy } from "@/components/sections/cookie-policy";
import { FeesPreview } from "@/components/sections/fees-preview";
import { MeetJohn } from "@/components/sections/meet-john";
import { PoliceStation } from "@/components/sections/police-station";
import { PoliceStationDetail } from "@/components/sections/police-station-detail";
import { PrivacyNotice } from "@/components/sections/privacy-notice";
import { PracticeDetails } from "@/components/sections/practice-details";
import { ProcessSteps } from "@/components/sections/process-steps";
import { ServicesGrid } from "@/components/sections/services-grid";
import { Container } from "@/components/ui/container";
import { ReviewSolicitorsWidget } from "@/components/ui/review-solicitors";
import { Icon } from "@/components/ui/icons";
import { JsonLd } from "@/components/ui/json-ld";
import { Lines, Paragraphs } from "@/components/ui/lines";
import {
  breadcrumbNode,
  graph,
  questionNodes,
  schemaIds,
  webPageNode,
} from "@/lib/cms/seo/json-ld";
import { structuredDataFor } from "@/lib/cms/seo/metadata";
import { resolveFrom } from "@/lib/cms/sections/resolve";
import {
  aboutBackgroundDefaults,
  careerBandDefaults,
  contactDetailsDefaults,
  contactPrepareDefaults,
  ctaDefaults,
  feesBodyDefaults,
  feesPreviewDefaults,
  feesStagesDefaults,
  leaveReviewLink,
  meetJohnDefaults,
  pageIntroDefaults,
  policeStationDefaults,
  policeStationDetailDefaults,
  policeStationStagesDefaults,
  processDefaults,
  servicesIntroDefaults,
} from "@/lib/content/pages";
import { whatsappHref } from "@/lib/site-config";

import type { PageContentGroups } from "@/lib/cms/sections/drafts";
import type { SiteConfig } from "@/lib/site-config";

const pageTypes: Record<string, "AboutPage" | "CollectionPage" | "ContactPage"> =
  {
    about: "AboutPage",
    services: "CollectionPage",
    contact: "ContactPage",
  };

export function InformationPageContent({ page, groups, config, structured, preview = false }: { page: string; groups: PageContentGroups; config: SiteConfig; structured?: Awaited<ReturnType<typeof structuredDataFor>>; preview?: boolean }) {
  const path = `/${page}`;
  const own = resolveFrom(groups[page]);
  const about = resolveFrom(groups.about);
  const shared = resolveFrom(groups.shared);

  const intro = own("intro", pageIntroDefaults[page]);

  // Null until a usable number is configured; the row is omitted rather than
  // linking the visitor back to the page they are already reading.
  const whatsapp = whatsappHref(config);
  const contact = own("details", contactDetailsDefaults);
  const prepare = own("prepare", contactPrepareDefaults);

  // The fees text is laid out by position: the first paragraph is the lead,
  // the last is the closing note, and the rest sit between them.
  const feesBody = own("body", feesBodyDefaults);
  const [feesLead, ...feesRest] = feesBody.body;
  const feesClosing = feesRest.at(-1);
  const feesMiddle = feesRest.slice(0, -1);
  const feesPreview = own("preview", feesPreviewDefaults);

  // The questions shown on /fees. The home page shows the same ones, but
  // Google asks for a repeated FAQ to be marked up once, and this is where
  // they are edited.
  const questions = page === "fees" ? feesPreview.questions : [];

  return (
    <>
      {structured && <JsonLd
        data={graph([
          ...structured.site,
          webPageNode({
            page: structured.page,
            type: questions.length > 0 ? "FAQPage" : pageTypes[page],
            about: page === "about" ? schemaIds.john : undefined,
            mainEntity:
              questions.length > 0 ? questionNodes(questions) : undefined,
            hasBreadcrumb: true,
          }),
          // The trail `PageIntro` prints: Home / <eyebrow>.
          breadcrumbNode(path, [{ name: intro.eyebrow, path }]),
        ])}
      />}
      <PageIntro {...intro}>
        {page === "reviews" && (
          <a
            href={leaveReviewLink.href}
            target="_blank"
            rel="noopener noreferrer"
            className="action-button"
          >
            {leaveReviewLink.label} <Icon name="arrowRight" size={17} />
          </a>
        )}
      </PageIntro>
      {page === "about" && (
        <>
          {/* The link back to /about belongs on the home page, not here. */}
          <MeetJohn
            showAboutLink={false}
            content={about("meet-john", meetJohnDefaults)}
          />
          <AboutBackground content={own("background", aboutBackgroundDefaults)} />
          <CareerBand content={own("career", careerBandDefaults)} />
          <ProcessSteps content={shared("process", processDefaults)} />
        </>
      )}
      {page === "services" && (
        <ServicesGrid content={own("explorer", servicesIntroDefaults)} />
      )}
      {page === "reviews" && (
        <section className="section-space reviews-page">
          <Container>
            {/*
              `afterInteractive`, not the component default: on this page the
              reviews are what the visitor came for, so the widget should not
              wait for browser idle time.
            */}
            <ReviewSolicitorsWidget
              widget="full-page"
              elementId="rswidget_8448b"
              strategy="afterInteractive"
            />
          </Container>
        </section>
      )}
      {page === "police-station" && (
        <>
          <PoliceStation content={own("feature", policeStationDefaults)} />
          <PoliceStationDetail
            content={own("detail", policeStationDetailDefaults)}
            config={config}
          />
          <section className="section-space">
            <Container>
              <div className="information-grid">
                {own("stages", policeStationStagesDefaults).cards.map((item) => (
                  <article key={item.title}>
                    <h2>{item.title}</h2>
                    <p>{item.body}</p>
                  </article>
                ))}
              </div>
            </Container>
          </section>
        </>
      )}
      {page === "fees" && (
        <>
          <section className="section-space">
            <Container>
              <div className="information-grid">
                {own("stages", feesStagesDefaults).cards.map((card) => (
                  <article key={card.title}>
                    <span className="eyebrow">{card.eyebrow}</span>
                    <h2>{card.title}</h2>
                    <p>{card.body}</p>
                  </article>
                ))}
              </div>
              <div className="fees-body">
                <div>
                  <p className="eyebrow">
                    <span className="small-rule" /> {feesBody.eyebrow}
                  </p>
                  <p className="fees-body-lead">{feesLead}</p>
                </div>
                <div className="fees-body-copy">
                  <Paragraphs values={feesMiddle} />
                  {feesClosing ? (
                    <p className="fees-body-closing">{feesClosing}</p>
                  ) : null}
                </div>
              </div>
            </Container>
          </section>
          <FeesPreview content={feesPreview} />
        </>
      )}
      {page === "contact" && (
        <>
          <ContactEnquiryForm readOnly={preview} />
          <section
            className="section-space"
            id="consultation"
            data-track="contact_page"
          >
            <Container>
              <div className="contact-grid">
                <div>
                  <p className="eyebrow">{contact.eyebrow}</p>
                  <h2 className="display-heading">
                    <Lines values={contact.headline} />
                    <br />
                    <em>
                      <Lines values={contact.headlineEmphasis} />
                    </em>
                  </h2>
                  <div className="contact-methods">
                    <a href={config.mailtoHref}>
                      <span>{contact.emailLabel}</span>
                      <strong>{config.email}</strong>
                      <Icon name="arrowRight" size={20} />
                    </a>
                    <a href={config.telHref}>
                      <span>{contact.callLabel}</span>
                      <strong>{config.phoneDisplay}</strong>
                      <Icon name="call" size={20} />
                    </a>
                    {whatsapp ? (
                      <a
                        href={whatsapp}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <span>{contact.whatsappLabel}</span>
                        <strong>{contact.whatsappValue}</strong>
                        <Icon name="whatsapp" size={20} />
                      </a>
                    ) : null}
                  </div>
                  <Paragraphs
                    values={contact.disclaimer}
                    className="contact-disclaimer"
                  />
                  <PracticeDetails config={config} />
                </div>
                <aside className="contact-note">
                  <p className="eyebrow">{prepare.eyebrow}</p>
                  <h2>
                    <Lines values={prepare.headline} />
                    <br />
                    <em>
                      <Lines values={prepare.headlineEmphasis} />
                    </em>
                  </h2>
                  <p>{prepare.listIntro}</p>
                  <ul>
                    {prepare.list.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  <Paragraphs values={prepare.listNote} />
                  <a href={config.mailtoHref} className="action-button">
                    {prepare.ctaLabel} <Icon name="arrowRight" size={17} />
                  </a>
                  <div className="contact-urgent" id="urgent">
                    <strong>{prepare.urgentHeading}</strong>
                    <Paragraphs values={prepare.urgentBody} />
                  </div>
                </aside>
              </div>
            </Container>
          </section>
        </>
      )}
      {page === "cookies" && <CookiePolicy />}
      {page === "privacy" && <PrivacyNotice config={config} />}
      {page !== "contact" && (
        <CtaBanner content={shared("cta", ctaDefaults)} config={config} />
      )}
    </>
  );
}
