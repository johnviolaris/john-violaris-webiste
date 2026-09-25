import Link from "next/link";

import { Container } from "@/components/ui/container";
import { Icon } from "@/components/ui/icons";
import { Lines, Paragraphs } from "@/components/ui/lines";
import { policeStationDetailDefaults } from "@/lib/content/pages";
import type { PoliceStationDetailContent } from "@/lib/content/pages";
import type { SiteConfig } from "@/lib/site-config";

export function PoliceStationDetail({
  content = policeStationDetailDefaults,
  config,
}: {
  content?: PoliceStationDetailContent;
  config: SiteConfig;
}) {
  return (
    <section
      className="police-detail section-space"
      aria-labelledby="police-detail-heading"
      data-track="police_station"
    >
      <Container>
        <div className="police-detail-grid">
          <div className="police-detail-copy">
            <p className="eyebrow">
              <span className="small-rule" /> {content.eyebrow}
            </p>
            <h2 id="police-detail-heading" className="display-heading">
              <Lines values={content.headline} />
              <br />
              <em>
                <Lines values={content.headlineEmphasis} />
              </em>
            </h2>

            <section>
              <h3>{content.whyHeading}</h3>
              <Paragraphs values={content.whyBody} />
            </section>

            <section>
              <h3>{content.supportHeading}</h3>
              <ul>
                {content.support.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>

            <section>
              <h3>{content.continuityHeading}</h3>
              <Paragraphs values={content.continuityBody} />
            </section>
          </div>

          <div className="police-detail-rail">
            <aside className="legal-aid-note">
              <p className="eyebrow">{content.legalAidEyebrow}</p>
              <h3>{content.legalAidHeading}</h3>
              <Paragraphs values={content.legalAidBody} />
            </aside>
            <aside className="police-urgent-card">
              <p className="eyebrow">{content.urgentEyebrow}</p>
              <h3>{content.urgentHeading}</h3>
              <Paragraphs values={content.urgentBody} />
              <div>
                <a href={config.telHref} className="action-button">
                  <Icon name="call" size={16} />
                  {config.phoneE164
                    ? content.urgentCallLabel
                    : content.urgentCallFallbackLabel}
                </a>
                <a href={config.mailtoHref} className="text-link">
                  {content.urgentEmailLabel}{" "}
                  <Icon name="arrowRight" size={15} />
                </a>
              </div>
              <Link href="/contact#consultation" className="police-detail-prep">
                {content.prepLabel} <span aria-hidden="true">↗</span>
              </Link>
            </aside>
          </div>
        </div>
      </Container>
    </section>
  );
}
