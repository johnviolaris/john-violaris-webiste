import Link from "next/link";

import { Container } from "@/components/ui/container";
import { Icon } from "@/components/ui/icons";
import { Lines } from "@/components/ui/lines";
import { TestimonialColumn } from "@/components/ui/testimonial-column";
import { testimonials } from "@/lib/content/home";
import { testimonialsIntroDefaults } from "@/lib/content/pages";
import type { TestimonialsIntroContent } from "@/lib/content/pages";

const COLUMNS = 3;

/**
 * Deal round-robin so neighbouring columns never show the same review.
 *
 * Dealing only works once every column gets at least two reviews. Deal fewer
 * and a column holds one review, which the track then repeats to fill itself —
 * the same card four times over. Until then each column takes the whole list
 * instead, rotated by its own index so it opens on a different review. A review
 * is then on screen more than once, which so few reviews and three columns make
 * unavoidable; what the rotation buys is that the repeats are never level with
 * each other. The section goes back to dealing on its own at six reviews.
 */
const columns = Array.from({ length: COLUMNS }, (_, column) =>
  testimonials.length >= COLUMNS * 2
    ? testimonials.filter((_, index) => index % COLUMNS === column)
    : testimonials.map(
        (_, index) => testimonials[(index + column) % testimonials.length],
      ),
);

/** Seconds per card. Deliberately uneven so the columns drift out of step. */
const secondsPerCard = [6.5, 8.5, 7.5];

/**
 * Where each column starts, in cards. Under one card each, so the cards sit
 * staggered against their neighbours without undoing the rotation above.
 */
const starts = [0, 0.4, 0.75];

/**
 * Client voices, on navy so the section reads as a pause between the two light
 * bands either side of it.
 *
 * The columns are a marquee at tablet width and up. Below that a single column
 * carries every review instead — splitting three reviews across three columns
 * would leave a phone showing only the first of them.
 *
 * Every review here is a verified one from John's ReviewSolicitors profile, and
 * the button underneath leads to the same reviews in full. There are three of
 * them today, so they come round repeatedly; the alternative was writing copy
 * to fill the gap, which is the one thing this section must not do.
 */
export function Testimonials({
  content = testimonialsIntroDefaults,
}: {
  content?: TestimonialsIntroContent;
}) {
  return (
    <section
      className="voices-section section-space"
      aria-labelledby="testimonials-heading"
    >
      <Container>
        <div className="section-heading-row">
          <div>
            <p className="eyebrow">
              <span className="small-rule" /> {content.eyebrow}
            </p>
            <h2 id="testimonials-heading" className="display-heading">
              <Lines values={content.headline} />
              <br />
              <em>
                <Lines values={content.headlineEmphasis} />
              </em>
            </h2>
          </div>
          {content.intro.length > 0 ? (
            <p className="section-intro">
              <Lines values={content.intro} />
            </p>
          ) : null}
        </div>

        <div className="voices-marquee">
          <TestimonialColumn
            testimonials={testimonials}
            secondsPerCard={7.5}
            className="voices-column-stacked"
          />
          {columns.map((column, index) => (
            <TestimonialColumn
              key={index}
              testimonials={column}
              secondsPerCard={secondsPerCard[index]}
              start={starts[index]}
              className={`voices-column-split voices-column-${index + 1}`}
              // A short list appears in every split column. The first exposes
              // all real reviews; the other columns are visual repetitions.
              ariaHidden={testimonials.length < COLUMNS * 2 && index > 0}
            />
          ))}
        </div>

        <div className="voices-action">
          <Link href="/reviews" className="action-button">
            {content.linkLabel} <Icon name="arrowRight" size={17} />
          </Link>
          <p className="voices-note">{content.note}</p>
        </div>
      </Container>
    </section>
  );
}
