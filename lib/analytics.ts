/**
 * Google Analytics 4, only with the visitor's consent (SEO requirements
 * REQ-053 to REQ-055).
 *
 * Three rules shape everything here:
 *
 *  - **Off until configured.** With no `NEXT_PUBLIC_GA_MEASUREMENT_ID` there
 *    is no banner, no script and no event. Set the ID in Vercel's Production
 *    environment only, so preview deployments and local builds never report.
 *  - **Nothing before consent.** Google's script is not even requested until
 *    the visitor accepts, and `track` does nothing until then. Consent Mode v2
 *    is still declared, defaults denied, so Google reads the signals it
 *    expects. Advertising storage is never granted: there are no ads.
 *  - **No personal data, no case details.** Events say which kind of link was
 *    used and where on the page it sat. Never a name, a number, an address or
 *    what the enquiry is about. The matter type is left out on purpose,
 *    although the SEO spec lists it: which offence someone is accused of is
 *    criminal-offence data, and it has no business reaching Google.
 *
 * Client-side only in practice, but free of browser globals at import time,
 * so server components can read `gaMeasurementId`.
 */

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/** The GA4 measurement ID, or null while analytics is switched off. */
export const gaMeasurementId: string | null = (() => {
  const id = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();

  return id && /^G-[A-Z0-9]{4,}$/.test(id) ? id : null;
})();

/** The event the footer's "Cookie settings" button sends to reopen the banner. */
export const openConsentEvent = "jv:cookie-settings";

// ---------------------------------------------------------------------------
// The visitor's choice
// ---------------------------------------------------------------------------

export type ConsentChoice = "granted" | "denied";

/**
 * Kept in local storage, not a cookie, so remembering "no cookies" does not
 * itself need one. The cookie policy names this key.
 */
export const consentStorageKey = "jv-analytics-consent";

export function readConsent(): ConsentChoice | null {
  try {
    const value = window.localStorage.getItem(consentStorageKey);

    return value === "granted" || value === "denied" ? value : null;
  } catch {
    // Storage blocked: ask again next time rather than assume either answer.
    return null;
  }
}

/** Fired on this window whenever the choice is written. */
const consentChangeEvent = "jv:consent-change";

export function writeConsent(choice: ConsentChoice): void {
  try {
    window.localStorage.setItem(consentStorageKey, choice);
  } catch {
    // Storage blocked: the choice still holds until the page is left.
  }

  window.dispatchEvent(new Event(consentChangeEvent));
}

/**
 * For `useSyncExternalStore`: the choice changes here, or in another tab of
 * the same site (`storage`), and every reader follows.
 */
export function subscribeConsent(onChange: () => void): () => void {
  window.addEventListener(consentChangeEvent, onChange);
  window.addEventListener("storage", onChange);

  return () => {
    window.removeEventListener(consentChangeEvent, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/**
 * Remove the cookies Google Analytics set, after consent is withdrawn.
 *
 * GA writes them on the registrable domain (`.johnviolaris.com`), so each is
 * expired both there and on the exact host.
 */
export function clearAnalyticsCookies(): void {
  const host = window.location.hostname;
  const domains = [host, `.${host.replace(/^www\./, "")}`];
  const names = document.cookie
    .split(";")
    .map((cookie) => cookie.split("=")[0].trim())
    .filter((name) => name === "_ga" || name.startsWith("_ga_"));

  for (const name of names) {
    document.cookie = `${name}=; Max-Age=0; path=/`;

    for (const domain of domains) {
      document.cookie = `${name}=; Max-Age=0; path=/; domain=${domain}`;
    }
  }
}

// ---------------------------------------------------------------------------
// Google's tag
// ---------------------------------------------------------------------------

/**
 * Start GA4 once consent is given.
 *
 * `gtag` has to push the `arguments` object itself — Google's script ignores
 * plain arrays — which is why this is a `function` and not a rest-parameter
 * arrow. Defining it only here is what keeps `track` inert before consent.
 */
export function startAnalytics(measurementId: string): void {
  if (window.gtag) return;

  window.dataLayer = window.dataLayer ?? [];
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  };

  window.gtag("consent", "default", {
    analytics_storage: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
  window.gtag("consent", "update", { analytics_storage: "granted" });
  window.gtag("js", new Date());
  // Page views after the first, on client-side navigation, come from GA4's
  // enhanced measurement ("page changes based on browser history events"),
  // which is on by default. Sending them here as well would count each twice.
  window.gtag("config", measurementId);
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

/**
 * Every path to John (REQ-055). `location` is the part of the page the link
 * sat in, from the nearest `data-track` attribute: `header`, `hero`,
 * `mobile_bar`, `footer` and so on.
 */
type EventParams = {
  phone_click: { location: string };
  whatsapp_click: { location: string };
  email_click: { location: string };
  booking_click: { location: string };
  form_submit: Record<string, never>;
  form_error: { error_type: "validation" | "server" };
};

export type AnalyticsEventName = keyof EventParams;

/** Record an event. Does nothing without consent, or with analytics off. */
export function track<E extends AnalyticsEventName>(
  event: E,
  params: EventParams[E],
): void {
  if (typeof window === "undefined" || !window.gtag) return;

  window.gtag("event", event, {
    page_path: window.location.pathname,
    ...params,
  });
}

/**
 * Which event a click on this link is, if any.
 *
 * Classified by where the link goes rather than tagged at each link, so a
 * contact route added anywhere later is counted without anyone remembering
 * to instrument it.
 */
export function eventForLink(
  link: HTMLAnchorElement,
  bookingHref: string,
): "phone_click" | "whatsapp_click" | "email_click" | "booking_click" | null {
  const href = link.getAttribute("href") ?? "";

  if (href.startsWith("tel:")) return "phone_click";
  if (href.startsWith("mailto:")) return "email_click";
  if (href === bookingHref) return "booking_click";

  try {
    const { hostname } = new URL(link.href);

    if (hostname === "wa.me" || hostname.endsWith("whatsapp.com")) {
      return "whatsapp_click";
    }
  } catch {
    // Not a URL the browser can parse; not one of ours either.
  }

  return null;
}
