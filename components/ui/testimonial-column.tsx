"use client";

import { useAnimate } from "motion/react";
import { useEffect, useRef } from "react";

import { Stars } from "@/components/ui/stars";
import type { Testimonial } from "@/lib/content/home";

/** Just enough of the playback handle for pause/resume and the staggered start. */
type Playback = {
  pause: () => void;
  play: () => void;
  stop: () => void;
  /** Elapsed time in seconds. Set once, to start the column mid-pass. */
  time: number;
};

/**
 * Cards in one copy of the track, at minimum.
 *
 * The -50% loop holds only while a single copy is at least as tall as the
 * window it scrolls inside: nothing is rendered below the second copy, so a
 * copy shorter than the window would scroll blank space into view at the end of
 * every pass. `.voices-marquee` caps that window at 660px and the shortest card
 * runs around 200px, so four cards clear it whatever the reviews turn out to
 * say. Short lists are repeated up to this count — with three reviews on the
 * site the same three simply come round twice per pass.
 */
const MIN_CARDS = 4;

/** Repeat the list until it is long enough to fill a copy of the track. */
function fillCopy(testimonials: Testimonial[]): Testimonial[] {
  if (testimonials.length === 0) return testimonials;

  const repeats = Math.ceil(MIN_CARDS / testimonials.length);

  return Array.from({ length: repeats }, () => testimonials).flat();
}

/**
 * One vertically scrolling column of client reviews.
 *
 * The list is rendered twice and the track travels exactly -50%, so the second
 * copy is in the first copy's place when the loop restarts and the seam is
 * invisible. The duplicate is `aria-hidden`, so assistive technology reads each
 * review once.
 *
 * Driven through `useAnimate` rather than the declarative `animate` prop
 * because that hands back playback controls — auto-scrolling text has to be
 * stoppable to be readable, so it pauses on hover and on focus. The same handle
 * is what `start` seeks with. It must be the full `motion/react` build: the
 * `motion/react-mini` one animates through the Web Animations API, which has no
 * `y` property, so the columns stood still.
 *
 * Speed and starting point are both given per card, not per pass. How many
 * cards make up a pass depends on how many reviews there are and how often a
 * short list had to be repeated, so a per-pass figure would quietly speed the
 * column up, and move where it starts, every time a review was added.
 *
 * The scroll runs regardless of `prefers-reduced-motion`, by request. Pausing
 * on hover and focus is what keeps the reviews readable; if the motion ever
 * needs to honour that setting again, gate this effect on `useReducedMotion`
 * and restore the matching block in `globals.css`.
 */
export function TestimonialColumn({
  testimonials,
  secondsPerCard = 6,
  start = 0,
  className = "",
}: {
  testimonials: Testimonial[];
  /** Seconds for one card to scroll past. Vary it per column so they drift apart. */
  secondsPerCard?: number;
  /**
   * How many cards into its track the column begins; fractions stagger the
   * cards against the next column's. Columns carrying the same reviews also
   * need their lists rotated, or they would open on the same review.
   */
  start?: number;
  className?: string;
}) {
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const playback = useRef<Playback | null>(null);
  const copy = fillCopy(testimonials);
  const cards = copy.length;

  useEffect(() => {
    if (!scope.current || cards === 0) return;

    const duration = secondsPerCard * cards;
    const controls = animate(
      scope.current,
      { y: "-50%" },
      { duration, ease: "linear", repeat: Infinity, repeatType: "loop" },
    ) as unknown as Playback;

    // Seeking, not delaying: the column is already part-way through its pass on
    // the first frame rather than waiting to join in.
    controls.time = secondsPerCard * (start % cards);

    playback.current = controls;
    return () => {
      controls.stop();
      playback.current = null;
    };
  }, [animate, cards, scope, secondsPerCard, start]);

  return (
    <div
      className={`voices-column ${className}`}
      onMouseEnter={() => playback.current?.pause()}
      onMouseLeave={() => playback.current?.play()}
      /* Capture, so focus landing on a card inside also pauses the column. */
      onFocusCapture={() => playback.current?.pause()}
      onBlurCapture={() => playback.current?.play()}
    >
      <div ref={scope} className="voices-track">
        {[0, 1].map((pass) =>
          copy.map((testimonial, index) => (
            /* Keyed by position: a short list is repeated, so names recur. */
            <figure
              key={`${pass}-${index}`}
              className="voice-card"
              aria-hidden={pass === 1 || undefined}
              data-clone={pass === 1 ? "true" : undefined}
            >
              <span className="voice-mark" aria-hidden="true">
                &rdquo;
              </span>
              <Stars rating={testimonial.rating} />
              <blockquote>{testimonial.quote}</blockquote>
              <figcaption>
                <span className="voice-name">{testimonial.name}</span>
                {testimonial.matter && (
                  <span className="voice-matter">{testimonial.matter}</span>
                )}
              </figcaption>
            </figure>
          )),
        )}
      </div>
    </div>
  );
}
