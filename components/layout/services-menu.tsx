"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { Icon } from "@/components/ui/icons";
import { useServiceCatalogue } from "@/components/layout/service-catalogue-provider";
import { useSiteConfig } from "@/components/layout/site-config-provider";

/** Delay before a hover-out actually closes, so the pointer can cross the gap. */
const CLOSE_DELAY_MS = 140;

/**
 * The panel's columns on a wide screen, by how many groups there are.
 *
 * Groups are added under Services, so the count is not fixed. Five is the
 * layout as designed and six still fit one row; seven or eight read better as
 * two even rows of four than one cramped row, and past that rows of five
 * again. Whole class names, so Tailwind finds them.
 */
function menuColumns(groupCount: number): string {
  if (groupCount === 6) return "lg:grid-cols-6";
  if (groupCount === 7 || groupCount === 8) return "lg:grid-cols-4";

  return "lg:grid-cols-5";
}

/**
 * The services mega-menu that lives in the site header.
 *
 * Opens on hover for mice, on click or Enter for everyone else. The panel is
 * positioned against the header, so this must be rendered inside it.
 */
export function ServicesMenu() {
  const config = useSiteConfig();
  const { groups: serviceGroups } = useServiceCatalogue();
  const pathname = usePathname();
  const panelId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<number | null>(null);

  /**
   * Open only while we are still on the route it was opened from, so a
   * navigation closes the panel without needing an effect.
   */
  const [openedOn, setOpenedOn] = useState<string | null>(null);
  const open = openedOn === pathname;

  const cancelClose = () => {
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const openPanel = () => {
    cancelClose();
    setOpenedOn(pathname);
  };

  const closePanel = () => {
    cancelClose();
    setOpenedOn(null);
  };

  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = window.setTimeout(
      () => setOpenedOn(null),
      CLOSE_DELAY_MS,
    );
  };

  useEffect(() => cancelClose, []);

  useEffect(() => {
    if (!open) return;

    // Escape closes the panel even when it was opened by hover alone.
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenedOn(null);
        buttonRef.current?.focus();
      }
    };
    // Touch users have no pointer-leave, so dismiss on a tap outside.
    const onPointerDown = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpenedOn(null);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  return (
    <div
      ref={wrapperRef}
      className="hidden sm:block"
      /*
        Hover is for mice only. On touch the browser emulates an enter before
        the click, which would open the panel and let the click immediately
        toggle it shut again.
      */
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") openPanel();
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === "mouse") scheduleClose();
      }}
      /*
        Focusing the trigger must not open the panel — the click handler owns
        that, so Enter and Space behave predictably. This only keeps the panel
        open as focus moves through the links inside it.
      */
      onFocusCapture={(event) => {
        const focused = event.target as HTMLElement;
        if (focused !== buttonRef.current) openPanel();
      }}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          closePanel();
        }
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        onClick={() => (open ? closePanel() : openPanel())}
        aria-expanded={open}
        aria-controls={panelId}
        className={`flex shrink-0 items-center gap-2.5 rounded-sharp px-3 py-2 text-[10.5px] font-bold tracking-[0.18em] uppercase transition-colors ${
          open
            ? "bg-gold/10 text-gold-light"
            : "text-cream/65 hover:bg-white/5 hover:text-gold-light"
        }`}
      >
        {/* Hamburger that folds into a cross when open. */}
        <span aria-hidden="true" className="relative block h-3 w-4">
          <span
            className={`absolute left-0 block h-px w-full bg-current transition-all duration-300 ease-out ${
              open ? "top-1/2 -translate-y-1/2 rotate-45" : "top-0 rotate-0"
            }`}
          />
          <span
            className={`absolute top-1/2 left-0 block h-px w-full -translate-y-1/2 bg-current transition-opacity duration-200 ${
              open ? "opacity-0" : "opacity-100"
            }`}
          />
          <span
            className={`absolute left-0 block h-px w-full bg-current transition-all duration-300 ease-out ${
              open
                ? "top-1/2 -translate-y-1/2 -rotate-45"
                : "top-full -translate-y-full rotate-0"
            }`}
          />
        </span>
        All services
      </button>

      {/* ── Panel ─────────────────────────────────────────────── */}
      <div
        id={panelId}
        inert={!open}
        className={`absolute inset-x-0 top-full z-40 grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
          open
            ? "grid-rows-[1fr] opacity-100"
            : "pointer-events-none grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="max-h-[76vh] overflow-y-auto border-b border-gold/25 bg-navy-deep shadow-2xl shadow-black/50">
            <div className="mx-auto w-full max-w-7xl px-5 py-9 sm:px-8 lg:px-12 lg:py-10">
              <div
                className={`grid gap-x-8 gap-y-9 sm:grid-cols-2 ${menuColumns(serviceGroups.length)}`}
              >
                {serviceGroups.map((group, groupIndex) => (
                  <div
                    key={group.heading}
                    className={`transition-all duration-300 ease-out ${
                      open
                        ? "translate-y-0 opacity-100"
                        : "translate-y-1 opacity-0"
                    }`}
                    style={{
                      transitionDelay: open
                        ? `${60 + groupIndex * 45}ms`
                        : "0ms",
                    }}
                  >
                    <p
                      id={`${panelId}-group-${groupIndex}`}
                      className="border-b border-gold/20 pb-2.5 text-[10px] font-bold tracking-[0.2em] text-gold uppercase"
                    >
                      {group.heading}
                    </p>
                    <ul
                      aria-labelledby={`${panelId}-group-${groupIndex}`}
                      className="mt-3 space-y-0.5"
                    >
                      {group.services.map((service) => (
                        <li key={service.href}>
                          <Link
                            href={service.href}
                            onClick={closePanel}
                            className="group/item -mx-2 flex items-start gap-3 rounded-sharp px-2 py-2 transition-colors hover:bg-white/5"
                          >
                            <Icon
                              name={service.icon}
                              size={17}
                              className="mt-0.5 shrink-0 text-gold/70 transition-colors group-hover/item:text-gold"
                            />
                            <span className="min-w-0">
                              <span className="block text-[13.5px] leading-snug font-medium text-cream/85 transition-colors group-hover/item:text-gold-light">
                                {service.name}
                              </span>
                              {service.statute && (
                                <span className="mt-0.5 block text-[10.5px] tracking-[0.06em] text-cream/55">
                                  {service.statute}
                                </span>
                              )}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="mt-9 flex flex-col gap-4 border-t border-white/8 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[13.5px] text-cream/58">
                  Not sure which of these your case falls under? Tell me what
                  happened and I&rsquo;ll place it for you.
                </p>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                  <a
                    href={config.telHref}
                    className="flex items-center gap-2 font-display text-[17px] font-bold text-gold transition-colors hover:text-gold-light"
                  >
                    <Icon name="call" size={16} />
                    {config.phoneE164
                      ? config.phoneDisplay
                      : "Speak to John"}
                  </a>
                  <Link
                    href="/services"
                    className="inline-flex items-center gap-2 border-b border-gold/40 pb-0.5 text-[13px] font-semibold text-cream transition-colors hover:border-gold hover:text-gold-light"
                  >
                    View all services
                    <Icon name="arrowRight" size={13} className="text-gold" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
