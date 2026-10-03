"use client";

import Link from "next/link";
import Script from "next/script";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { useSiteConfig } from "@/components/layout/site-config-provider";
import {
  clearAnalyticsCookies,
  eventForLink,
  gaMeasurementId,
  openConsentEvent,
  readConsent,
  startAnalytics,
  subscribeConsent,
  track,
  writeConsent,
  type ConsentChoice,
} from "@/lib/analytics";

/**
 * Analytics and the consent banner that gates it (REQ-053, REQ-054).
 *
 * Renders nothing at all while analytics is switched off, so the site shows
 * no banner asking permission for something it does not do.
 */
export function Analytics() {
  return gaMeasurementId ? <ConsentedAnalytics id={gaMeasurementId} /> : null;
}

/** Nothing to subscribe to: the host does not change under a page. */
const noSubscription = () => () => {};

function ConsentedAnalytics({ id }: { id: string }) {
  const { bookingHref } = useSiteConfig();
  // `undefined` on the server and during hydration, where the stored choice
  // cannot be read; the banner waits for it rather than flashing on every
  // page for someone who has already answered.
  const choice = useSyncExternalStore<ConsentChoice | null | undefined>(
    subscribeConsent,
    readConsent,
    () => undefined,
  );
  const isLocal = useSyncExternalStore(
    noSubscription,
    () => /^(localhost|127\.0\.0\.1|\[::1\])$/.test(window.location.hostname),
    () => true,
  );
  const [reopened, setReopened] = useState(false);
  const firstButton = useRef<HTMLButtonElement>(null);
  const bannerOpen = choice === null || reopened;

  // The footer's "Cookie settings" reopens the banner.
  useEffect(() => {
    const reopen = () => setReopened(true);

    window.addEventListener(openConsentEvent, reopen);
    return () => window.removeEventListener(openConsentEvent, reopen);
  }, []);

  // Focus moves into a reopened banner, since the visitor asked for it; on
  // an ordinary page load it never takes focus.
  useEffect(() => {
    if (reopened) firstButton.current?.focus();
  }, [reopened]);

  useEffect(() => {
    if (choice !== "granted") return;

    startAnalytics(id);

    // One listener for every contact link on the site, in the capture phase
    // so nothing downstream can swallow the click first.
    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest?.("a[href]");

      if (!(link instanceof HTMLAnchorElement)) return;

      const name = eventForLink(link, bookingHref);

      if (!name) return;

      const location =
        link.closest<HTMLElement>("[data-track]")?.dataset.track ?? "page";

      track(name, { location });
    };

    document.addEventListener("click", onClick, { capture: true });
    return () =>
      document.removeEventListener("click", onClick, { capture: true });
  }, [choice, id, bookingHref]);

  function decide(next: ConsentChoice) {
    const withdrawing = choice === "granted" && next === "denied";

    setReopened(false);
    writeConsent(next);

    if (withdrawing) {
      // Google's script cannot be unloaded, so withdrawing consent removes its
      // cookies and reloads the page without it.
      clearAnalyticsCookies();
      window.location.reload();
    }
  }

  /*
   * Always the same wrapper, rendered on the server too, with the banner
   * coming and going inside it. The next sibling in the layout is the
   * ReviewSolicitors widget, whose script rewrites and moves its own element;
   * a banner inserted directly beside it made React look for a node that was
   * no longer there, and the page fell over to the error boundary.
   */
  return (
    <div className="consent-slot">
      {/* Locally everything runs except the request to Google, so events can
          be checked in `window.dataLayer` without reporting anything. */}
      {choice === "granted" && !isLocal ? (
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
          strategy="afterInteractive"
        />
      ) : null}

      {bannerOpen ? (
        <section className="consent-banner" aria-label="Cookie choice">
          <p>
            <strong>May we use analytics storage?</strong> This site and Google
            Analytics would show John which pages and campaigns help people get
            in touch. Browser storage and analytics cookies are only used if
            you accept.{" "}
            <Link href="/cookies">Cookie policy</Link>
          </p>
          {/* Two identical buttons: rejecting is exactly as easy as accepting. */}
          <div className="consent-actions">
            <button
              ref={firstButton}
              type="button"
              className="consent-button"
              onClick={() => decide("denied")}
            >
              Reject
            </button>
            <button
              type="button"
              className="consent-button"
              onClick={() => decide("granted")}
            >
              Accept
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}

/**
 * Reopens the banner, from the footer and the cookie policy (REQ-054: the
 * choice is revocable). Absent while analytics is off — there is no choice to
 * revisit.
 */
export function CookieSettingsButton({ className }: { className?: string }) {
  if (!gaMeasurementId) return null;

  return (
    <button
      type="button"
      className={className}
      onClick={() => window.dispatchEvent(new Event(openConsentEvent))}
    >
      Cookie settings
    </button>
  );
}

/**
 * Reports the enquiry form's outcome. A hook rather than a call in the form's
 * render, so each submission counts once.
 */
export function useEnquiryTracking(state: {
  status: "idle" | "success" | "error";
  fieldErrors: Record<string, unknown>;
}) {
  useEffect(() => {
    if (state.status === "success") {
      track("form_submit", {});
    } else if (state.status === "error") {
      track("form_error", {
        error_type:
          Object.keys(state.fieldErrors).length > 0 ? "validation" : "server",
      });
    }
  }, [state]);
}
