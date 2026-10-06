"use client";

import { useCallback, useEffect, useRef } from "react";

import { Stars } from "@/components/ui/stars";
import type { Testimonial } from "@/lib/content/home";

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
 * Native transform keyframes run on the compositor without an animation
 * library in the initial bundle. The playback handle keeps the same pause on
 * hover/focus and staggered start as before. Use `transform`, not Motion's `y`
 * shorthand: the Web Animations API animates CSS properties directly.
 *
 * Speed and starting point are both given per card, not per pass. How many
 * cards make up a pass depends on how many reviews there are and how often a
 * short list had to be repeated, so a per-pass figure would quietly speed the
 * column up, and move where it starts, every time a review was added.
 *
 * The scroll runs regardless of `prefers-reduced-motion`, by request. Pausing
 * on hover and focus is what keeps the reviews readable; if the motion ever
 * needs to honour that setting again, gate this effect on its media query
 * and restore the matching block in `globals.css`.
 */
export function TestimonialColumn({
  testimonials,
  secondsPerCard = 6,
  start = 0,
  className = "",
  ariaHidden = false,
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
  /** Other visible columns may repeat the same short list for visual balance. */
  ariaHidden?: boolean;
}) {
  const scope = useRef<HTMLDivElement>(null);
  const column = useRef<HTMLDivElement>(null);
  const playback = useRef<Animation | null>(null);
  const visible = useRef(false);
  const hovered = useRef(false);
  const focused = useRef(false);
  const copy = fillCopy(testimonials);
  const cards = copy.length;
  const synchronizePlayback = useCallback(() => {
    if (visible.current && !hovered.current && !focused.current) playback.current?.play();
    else playback.current?.pause();
  }, []);

  useEffect(() => {
    if (!scope.current || cards === 0 || typeof scope.current.animate !== "function") return;

    const track = scope.current;
    // Creating transform animations also resolves layout. Do that only when
    // this column approaches the viewport, not during first-screen hydration.
    const observer = new IntersectionObserver(([entry]) => {
      visible.current = entry.isIntersecting;
      if (visible.current && !playback.current) {
        const controls = track.animate(
          [{ transform: "translateY(0%)" }, { transform: "translateY(-50%)" }],
          { duration: secondsPerCard * cards * 1000, easing: "linear", iterations: Infinity },
        );
        // Seek to the original staggered opening position rather than delay.
        controls.currentTime = secondsPerCard * (start % cards) * 1000;
        playback.current = controls;
      }
      synchronizePlayback();
    }, { rootMargin: "100px" });
    if (column.current) observer.observe(column.current);
    return () => {
      observer.disconnect();
      playback.current?.cancel();
      playback.current = null;
    };
  }, [cards, secondsPerCard, start, synchronizePlayback]);

  return (
    <div
      ref={column}
      className={`voices-column ${className}`}
      aria-hidden={ariaHidden || undefined}
      onMouseEnter={() => { hovered.current = true; synchronizePlayback(); }}
      onMouseLeave={() => { hovered.current = false; synchronizePlayback(); }}
      /* Capture, so focus landing on a card inside also pauses the column. */
      onFocusCapture={() => { focused.current = true; synchronizePlayback(); }}
      onBlurCapture={(event) => {
        if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
        focused.current = false;
        synchronizePlayback();
      }}
    >
      <div ref={scope} className="voices-track">
        {[0, 1].map((pass) =>
          copy.map((testimonial, index) => (
            /* Keyed by position: a short list is repeated, so names recur. */
            <figure
              key={`${pass}-${index}`}
              className="voice-card"
              aria-hidden={pass === 1 || index >= testimonials.length || undefined}
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
