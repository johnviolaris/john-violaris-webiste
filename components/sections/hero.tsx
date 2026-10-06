import Image from "next/image";
import { IntentLink as Link } from "@/components/ui/intent-link";

import { HeroMotion } from "@/components/sections/hero-motion";
import { OffenceStrip } from "@/components/sections/offence-strip";
import { Container } from "@/components/ui/container";
import { Icon } from "@/components/ui/icons";
import { Lines } from "@/components/ui/lines";
import { ImageCaption } from "@/components/ui/image-caption";
import { heroDefaults, offenceStripDefaults } from "@/lib/content/pages";
import type { HeroContent } from "@/lib/content/pages";
import type { SiteConfig } from "@/lib/site-config";

/**
 * The opening screen.
 *
 * The home renderer resolves the section and configuration on the server.
 * Only HeroMotion needs client JavaScript for the card's scroll effect;
 * the editorial markup, images and fallback content stay on the server.
 *
 * The defaults are the fallback of last resort, for a caller that has not been
 * given content yet. In practice the page always passes it.
 */
export function Hero({
  content = heroDefaults,
  strip = offenceStripDefaults,
  config,
}: {
  content?: HeroContent;
  strip?: { eyebrow: string };
  config: SiteConfig;
}) {
  return (
    <HeroMotion>
      <Container>
        <div className="hero-topline">
          <span>{content.toplineLeft}</span>
          <span>{content.toplineRight}</span>
        </div>
        <div className="hero-scroll-stage">
          <div className="hero-composition">
            <div className="hero-copy">
              <p className="eyebrow">
                <span className="small-rule" /> {content.eyebrow}
              </p>
              <h1 id="hero-heading">
                <Lines values={content.headline} />
                <br />
                <em>
                  <Lines
                    values={content.headlineEmphasis}
                    separator={<br className="mobile-break" />}
                  />
                </em>
              </h1>
              <p className="hero-description">
                <Lines
                  values={content.description}
                  separator={<br className="hidden sm:block" />}
                />
              </p>
              <Link href={config.bookingHref} className="action-button">
                {content.ctaLabel} <Icon name="arrowRight" size={19} />
              </Link>
              <p className="hero-reassurance">
                {content.reassuranceLeft} <span>·</span>{" "}
                {content.reassuranceRight}
              </p>
            </div>
            <div className="hero-profile-stage">
              <div className="hero-profile">
                <figure className="hero-portrait">
                    <div
                      className="hero-photo-layer hero-photo-primary"
                    >
                      {/*
                        The home page's largest paint. Already in the server
                        HTML, so the browser finds it without a preload; what it
                        needs is to be fetched first rather than queued behind
                        the scripts. The Next 16 image docs recommend exactly
                        this over `preload`.
                      */}
                      <Image
                        // Existing CMS rows can still contain the old filename.
                        // Use the compressed source without changing saved copy.
                        src={content.portrait === "/Profile 7.png"
                          ? "/john-violaris-portrait.webp"
                          : content.portrait}
                        alt={content.portraitAlt}
                        title={content.portraitTitle}
                        fill
                        loading="eager"
                        fetchPriority="high"
                        sizes="(max-width: 639px) calc(100vw - 62px), (max-width: 1023px) 34vw, 28vw"
                        className="hero-portrait-image hero-portrait-image-primary"
                      />
                      <figcaption className="portrait-caption">
                        <span>{config.name}</span>
                        <small>{config.role}</small>
                        {content.portraitCaption && <small className="whitespace-pre-wrap"><ImageCaption caption={content.portraitCaption} format={content.portraitCaptionFormat} /></small>}
                      </figcaption>
                    </div>
                    <aside
                      className="hero-scroll-card"
                      aria-label="John’s personal commitment"
                      style={{
                        transform: "translateY(100%) rotate(1.1deg)",
                      }}
                    >
                      <div className="letter-top">
                        <span>{content.cardLabel}</span>
                        <span>01 / {config.initials}</span>
                      </div>
                      <div className="letter-monogram" aria-hidden="true">
                        J<span>V</span>
                        <i>.</i>
                      </div>
                      <div className="letter-body">
                        <span className="eyebrow">{content.cardEyebrow}</span>
                        <p>
                          <Lines values={content.cardBody} />{" "}
                          <em>{content.cardBodyEmphasis}</em>
                        </p>
                        <div className="letter-rule" />
                        <span className="letter-name">{config.name}</span>
                        <span className="letter-role">{content.cardRole}</span>
                      </div>
                      <Link href="/about" className="letter-footer">
                        {content.cardFooterLabel}{" "}
                        <Icon name="arrowRight" size={18} />
                      </Link>
                    </aside>
                </figure>
              </div>
            </div>
          </div>
        </div>
        <div className="hero-bottom">
          <a href="#expertise" className="explore-link">
            {content.exploreLabel} <span aria-hidden="true">↓</span>
          </a>
          <span>{content.bottomTagline}</span>
        </div>
      </Container>
      <OffenceStrip content={strip} />
      <div className="experience-band">
        <Container>
          <dl className="experience-grid">
            {content.stats.map((stat, index) => (
              <div
                key={`${stat.value}-${stat.label}`}
                /* The last figure is the personal one and is set apart. */
                className={
                  index === content.stats.length - 1
                    ? "experience-personal"
                    : undefined
                }
              >
                <dd>
                  {stat.value}
                  {stat.suffix ? <span>{stat.suffix}</span> : null}
                </dd>
                <dt>{stat.label}</dt>
              </div>
            ))}
          </dl>
        </Container>
      </div>
    </HeroMotion>
  );
}
