"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { IntentLink as Link } from "@/components/ui/intent-link";

import { OffenceStrip } from "@/components/sections/offence-strip";
import { Container } from "@/components/ui/container";
import { Icon } from "@/components/ui/icons";
import { Lines } from "@/components/ui/lines";
import { ImageCaption } from "@/components/ui/image-caption";
import { heroDefaults, offenceStripDefaults } from "@/lib/content/pages";
import type { HeroContent } from "@/lib/content/pages";
import { useSiteConfig } from "@/components/layout/site-config-provider";

/**
 * The opening screen.
 *
 * Copy arrives as a prop rather than being read here: this is a client
 * component — it tracks scroll for the card that slides in over the
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
  const portraitRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const portrait = portraitRef.current;
    const card = cardRef.current;
    if (!portrait || !card) return;
    const mobile = window.matchMedia("(max-width: 639px)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const clamp = (value: number) => Math.max(0, Math.min(1, value));
    let frame = 0;

    // The original start/start → end/end (desktop) and end/65% (mobile)
    // offsets, scale, slide and rotation, updated once per animation frame.
    const render = () => {
      frame = 0;
      const stage = mobile.matches ? mobileScrollStageRef.current : scrollStageRef.current;
      if (!stage) return;
      const bounds = stage.getBoundingClientRect();
      const end = window.innerHeight * (mobile.matches ? 0.65 : 1);
      const progress = clamp(-bounds.top / Math.max(1, bounds.height - end));
      const slide = reduced.matches ? 1 : clamp((progress - 0.08) / 0.74);
      const scale = reduced.matches ? 1 : 1 + 0.035 * clamp(progress / 0.82);
      portrait.style.transform = `scale(${scale})`;
      card.style.transform = `translateY(${100 * (1 - slide)}%) rotate(${1.1 * (1 - slide)}deg)`;
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(render); };
    render();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    mobile.addEventListener("change", schedule);
    reduced.addEventListener("change", schedule);
    const observer = new ResizeObserver(schedule);
    if (scrollStageRef.current) observer.observe(scrollStageRef.current);
    if (mobileScrollStageRef.current) observer.observe(mobileScrollStageRef.current);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      mobile.removeEventListener("change", schedule);
      reduced.removeEventListener("change", schedule);
    };
  }, []);

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
                    <div
                      ref={portraitRef}
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
                      ref={cardRef}
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
    </section>
  );
}
