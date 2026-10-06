"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** Keep the scroll effect interactive while the hero's content stays on the server. */
export function HeroMotion({ children }: { children: ReactNode }) {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const scrollStage = section.querySelector<HTMLDivElement>(".hero-scroll-stage");
    const mobileScrollStage = section.querySelector<HTMLDivElement>(".hero-profile-stage");
    const portrait = section.querySelector<HTMLDivElement>(".hero-photo-primary");
    const card = section.querySelector<HTMLElement>(".hero-scroll-card");
    if (!portrait || !card) return;
    const mobile = window.matchMedia("(max-width: 639px)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const clamp = (value: number) => Math.max(0, Math.min(1, value));
    let frame = 0;

    // Preserve the original offsets, scale, slide and rotation.
    const render = () => {
      frame = 0;
      const stage = mobile.matches ? mobileScrollStage : scrollStage;
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
    if (scrollStage) observer.observe(scrollStage);
    if (mobileScrollStage) observer.observe(mobileScrollStage);
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
      ref={sectionRef}
      className="hero-editorial"
      aria-labelledby="hero-heading"
      data-track="hero"
    >
      {children}
    </section>
  );
}
