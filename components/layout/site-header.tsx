"use client";

import { IntentLink as Link } from "@/components/ui/intent-link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { Logo } from "@/components/layout/logo";
import { ServicesMenu } from "@/components/layout/services-menu";
import { useSiteConfig } from "@/components/layout/site-config-provider";
import { mainNav, whatsappHref } from "@/lib/site-config";
import { Icon } from "@/components/ui/icons";

export function SiteHeader() {
  const pathname = usePathname();
  const panelId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  /**
   * The drawer is open only while we are still on the route it was opened
   * from. Deriving it this way closes it on navigation without an effect.
   */
  const [openedOn, setOpenedOn] = useState<string | null>(null);
  const open = openedOn === pathname;
  const setOpen = (next: boolean) => setOpenedOn(next ? pathname : null);

  // Null unless a usable number is configured, so the drawer never offers a
  // WhatsApp button that is not WhatsApp.
  const config = useSiteConfig();
  const whatsapp = whatsappHref(config);

  // Lock background scroll and wire up Escape while the drawer is open.
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    drawerRef.current?.querySelector<HTMLButtonElement>("button")?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Tab") {
        const items = drawerRef.current?.querySelectorAll<HTMLElement>(
          "a[href], button:not([disabled])",
        );
        if (items?.length) {
          const first = items[0];
          const last = items[items.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        }
      }
      if (event.key === "Escape") {
        setOpenedOn(null);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    const desktop = window.matchMedia("(min-width: 1280px)");
    const onDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) setOpenedOn(null);
    };
    desktop.addEventListener("change", onDesktop);

    return () => {
      desktop.removeEventListener("change", onDesktop);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  /**
   * Only the most specific matching link is marked current. "Magistrates
   * Court" sits under /services, so a prefix match alone would light both it
   * and "Services" at once.
   */
  const current = mainNav.reduce<string | null>((best, item) => {
    const matches =
      pathname === item.href || pathname.startsWith(`${item.href}/`);
    if (!matches) return best;
    return best && best.length >= item.href.length ? best : item.href;
  }, null);

  const isActive = (href: string) => current === href;

  return (
    <header className="site-header sticky top-0 z-50 bg-navy" data-track="header">
      {/* Fine brass rule separates the sticky header from page content. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 bg-gold/35"
      />

      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-5 sm:px-8 xl:h-[86px] xl:gap-6 xl:px-12">
        <div className="flex min-w-0 items-center gap-3">
          <Logo name={config.name} role={config.role} />
          <span
            aria-hidden="true"
            className="hidden h-7 w-px bg-gold/20 xl:block"
          />
          <ServicesMenu />
        </div>

        {/* ── Desktop navigation ───────────────────────────────── */}
        <nav aria-label="Main" className="hidden items-center xl:flex">
          {mainNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={`rounded-sharp px-2.5 py-2 text-[12.5px] font-medium whitespace-nowrap transition-colors 2xl:px-3 ${
                isActive(item.href)
                  ? "text-gold-light"
                  : "text-cream/65 hover:text-cream"
              }`}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href={config.bookingHref}
            className="ml-3 rounded-sharp border border-gold/60 px-4 py-2.5 text-[11px] font-semibold tracking-[0.02em] whitespace-nowrap text-gold-light transition-colors hover:bg-gold hover:text-navy"
          >
            Free Consultation
          </Link>
        </nav>

        {/* ── Mobile actions ───────────────────────────────────── */}
        <div className="flex items-center gap-1 xl:hidden">
          <a
            href={config.telHref}
            className="flex h-10 w-10 items-center justify-center rounded-sharp text-gold transition-colors hover:bg-white/5"
            aria-label={
              config.phoneE164
                ? `Call John on ${config.phoneDisplay}`
                : "Contact John"
            }
          >
            <Icon name="call" size={19} />
          </a>
          <button
            ref={toggleRef}
            type="button"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-controls={panelId}
            aria-label={open ? "Close menu" : "Open menu"}
            className="flex h-10 w-10 items-center justify-center rounded-sharp text-cream transition-colors hover:bg-white/5"
          >
            <Icon name={open ? "close" : "menu"} size={22} />
          </button>
        </div>
      </div>

      {/* Scrim — dims the page behind the drawer and closes it on tap. */}
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        hidden={!open}
        onClick={() => setOpenedOn(null)}
        className="fixed inset-x-0 top-16 bottom-0 z-0 cursor-default bg-navy-deep/75 xl:hidden"
      />

      {/* ── Mobile drawer ──────────────────────────────────────── */}
      <div
        id={panelId}
        ref={drawerRef}
        role="dialog"
        aria-modal={open ? true : undefined}
        aria-label="Navigation"
        data-track="mobile_menu"
        onClick={(event) => {
          if ((event.target as HTMLElement).closest("a")) setOpenedOn(null);
        }}
        hidden={!open}
        className="absolute inset-x-0 top-full z-10 max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-b border-gold/15 bg-navy shadow-2xl shadow-black/50 xl:hidden"
      >
        <button
          type="button"
          className="ml-auto flex items-center gap-2 px-5 pt-5 text-xs text-cream"
          onClick={() => {
            setOpenedOn(null);
            toggleRef.current?.focus();
          }}
        >
          Close menu <Icon name="close" size={18} />
        </button>
        <nav aria-label="Mobile" className="px-5 py-4 sm:px-8">
          <ul className="divide-y divide-white/6">
            {mainNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={`flex items-center justify-between py-3.5 text-[15px] font-medium ${
                    isActive(item.href) ? "text-gold-light" : "text-cream/80"
                  }`}
                >
                  {item.label}
                  <Icon name="arrowRight" size={16} className="text-gold/45" />
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-5 grid gap-2.5 border-t border-gold/15 pt-5">
            <Link
              href={config.bookingHref}
              className="flex items-center justify-center gap-2 rounded-sharp bg-gold px-5 py-3.5 text-xs font-bold uppercase tracking-[0.07em] text-navy"
            >
              <Icon name="calendar" size={16} />
              Book a free consultation
            </Link>
            <div
              className={`grid gap-2.5 ${whatsapp ? "grid-cols-2" : "grid-cols-1"}`}
            >
              <a
                href={config.telHref}
                className="flex items-center justify-center gap-2 rounded-sharp border border-cream/25 px-4 py-3 text-xs font-semibold uppercase tracking-[0.06em] text-cream"
              >
                <Icon name="call" size={15} />
                Call
              </a>
              {whatsapp ? (
                <a
                  href={whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-sharp border border-cream/25 px-4 py-3 text-xs font-semibold uppercase tracking-[0.06em] text-cream"
                >
                  <Icon name="whatsapp" size={15} />
                  WhatsApp
                </a>
              ) : null}
            </div>
            <a
              href={config.mailtoHref}
              className="pt-1 text-center text-[12.5px] text-cream/58"
            >
              {config.email}
            </a>
          </div>
        </nav>
      </div>
    </header>
  );
}
