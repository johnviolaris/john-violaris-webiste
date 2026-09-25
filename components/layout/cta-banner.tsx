import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Icon } from "@/components/ui/icons";
import { Lines } from "@/components/ui/lines";
import { ctaDefaults } from "@/lib/content/pages";
import type { CtaContent } from "@/lib/content/pages";
import type { SiteConfig } from "@/lib/site-config";

/**
 * The band that closes every page but contact.
 *
 * Most of it is one editable section, shared by every page that renders it.
 * The heading is not: the article pages and the offence pages each set their
 * own, so that the line a reader lands on follows what they were just reading
 * ("Still have questions?" after an article). Those two props override the
 * section's heading and leave the rest of it alone.
 *
 * Pages whose own copy is managed under Website Content pass neither and get
 * the edited heading. Pages managed elsewhere — articles, offence pages — pass
 * theirs, and it belongs with that section rather than here.
 */
export function CtaBanner({
  content = ctaDefaults,
  config,
  heading,
  emphasis,
}: {
  content?: CtaContent;
  config: SiteConfig;
  /** Overrides the section heading, for a page with its own closing line. */
  heading?: string;
  emphasis?: string;
}) {
  return (
    <section
      className="closing-section"
      aria-labelledby="cta-heading"
      data-track="cta_banner"
    >
      <Container>
        <div className="closing-top">
          <p className="eyebrow">
            <span className="small-rule" /> {content.eyebrow}
          </p>
          <span>{content.badge}</span>
        </div>
        <div className="closing-grid">
          <h2 id="cta-heading">
            <Lines values={heading ? [heading] : content.headline} />
            <br />
            <em>
              <Lines
                values={emphasis ? [emphasis] : content.headlineEmphasis}
              />
            </em>
          </h2>
          <div>
            <p>
              <Lines values={content.body} />
            </p>
            <Link href={config.bookingHref} className="action-button">
              {content.ctaLabel} <Icon name="arrowRight" size={18} />
            </Link>
            <a className="closing-email" href={config.mailtoHref}>
              {config.email} <span>↗</span>
            </a>
          </div>
        </div>
        <div className="closing-bottom">
          <span>{content.footerLeft}</span>
          <span>{content.footerRight}</span>
        </div>
      </Container>
    </section>
  );
}
