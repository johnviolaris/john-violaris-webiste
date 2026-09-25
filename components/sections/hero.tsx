"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";

import { OffenceStrip } from "@/components/sections/offence-strip";
import { Container } from "@/components/ui/container";
import { Icon } from "@/components/ui/icons";
import { Lines } from "@/components/ui/lines";
import { heroDefaults, offenceStripDefaults } from "@/lib/content/pages";
import type { HeroContent } from "@/lib/content/pages";
import { useSiteConfig } from "@/components/layout/site-config-provider";

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const updateMatch = () => setMatches(mediaQuery.matches);

    updateMatch();
    mediaQuery.addEventListener("change", updateMatch);
    return () => mediaQuery.removeEventListener("change", updateMatch);
  }, [query]);

  return matches;
}

/**
 * The opening screen.
 *
 * Copy arrives as a prop rather than being read here: this is a client
 * component — it needs `useScroll` for the card that slides in over the
 * portrait — and a client component cannot read from Supabase. The home page
 * resolves the section and passes it down, which is the pattern every editable
 * client section follows.
 *
 * The defaults are the fallback of last resort, for a caller that has not been
 * given content yet. In practice the page always passes it.
 */
export function Hero({
  content = heroDefaults,
  strip = offenceStripDefaults,
}: {
  content?: HeroContent;
  strip?: { eyebrow: string };
}) {
  const config = useSiteConfig();
  const scrollStageRef = useRef<HTMLDivElement>(null);
  const mobileScrollStageRef = useRef<HTMLDivElement>(null);
  const isMobile = useMediaQuery("(max-width: 639px)");
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: scrollStageRef,
    offset: ["start start", "end end"],
  });
  const { scrollYProgress: mobileScrollYProgress } = useScroll({
    target: mobileScrollStageRef,
    offset: ["start start", "end 65%"],
  });
  const commitmentCardY = useTransform(
    scrollYProgress,
    [0.08, 0.82],
    ["100%", "0%"],
  );
  const commitmentCardRotate = useTransform(
    scrollYProgress,
    [0.08, 0.82],
    [1.1, 0],
  );
  const mobileCommitmentCardY = useTransform(
    mobileScrollYProgress,
    [0.08, 0.82],
    ["100%", "0%"],
  );
  const mobileCommitmentCardRotate = useTransform(
    mobileScrollYProgress,
    [0.08, 0.82],
    [1.1, 0],
  );
  const firstPortraitScale = useTransform(
    scrollYProgress,
    [0, 0.82],
    [1, 1.035],
  );
  const mobilePortraitScale = useTransform(
    mobileScrollYProgress,
    [0, 0.82],
    [1, 1.035],
  );

  const activeCardY = isMobile ? mobileCommitmentCardY : commitmentCardY;
  const activeCardRotate = isMobile
    ? mobileCommitmentCardRotate
    : commitmentCardRotate;
  const activePortraitScale = isMobile
    ? mobilePortraitScale
    : firstPortraitScale;

  return (
    <section
      className="hero-editorial"
      aria-labelledby="hero-heading"
      data-track="hero"
    >
      <Container>
        <div className="hero-topline">
          <span>{content.toplineLeft}</span>
          <span>{content.toplineRight}</span>
        </div>
        <div ref={scrollStageRef} className="hero-scroll-stage">
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
            <div ref={mobileScrollStageRef} className="hero-profile-stage">
              <div className="hero-profile">
                <figure className="hero-portrait">
                  <motion.div
                    className="hero-photo-layer hero-photo-primary"
                    style={{
                      scale: prefersReducedMotion ? 1 : activePortraitScale,
                    }}
                  >
                    {/*
                      The home page's largest paint. Already in the server
                      HTML, so the browser finds it without a preload; what it
                      needs is to be fetched first rather than queued behind
                      the scripts. The Next 16 image docs recommend exactly
                      this over `preload`.
                    */}
                    <Image
                      src={content.portrait}
                      alt={content.portraitAlt}
                      fill
                      loading="eager"
                      fetchPriority="high"
                      sizes="(max-width: 639px) calc(100vw - 62px), (max-width: 1023px) 34vw, 28vw"
                      className="hero-portrait-image hero-portrait-image-primary"
                    />
                    <figcaption className="portrait-caption">
                      <span>{config.name}</span>
                      <small>{config.role}</small>
                    </figcaption>
                  </motion.div>
                  <motion.aside
                    className="hero-scroll-card"
                    aria-label="John’s personal commitment"
                    style={{
                      y: prefersReducedMotion ? "0%" : activeCardY,
                      rotate: prefersReducedMotion ? 0 : activeCardRotate,
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
                  </motion.aside>
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
    </section>
  );
}
