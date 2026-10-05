import type { Service } from "@/lib/content/services";

/**
 * Site-wide settings: the shape, the defaults, and how the derived links are
 * worked out.
 *
 * Every phone number, address, email and external URL used anywhere on the site
 * comes from here. Nothing contact-related is hardcoded in a component.
 *
 * Two layers, and the split is the point:
 *
 *  - `SiteSettings` is what John can edit under Site Settings. The values below
 *    are the defaults, read from the environment, and they are what the site
 *    uses until a row exists in `site_settings`.
 *  - `deployment` is configuration, not content. The canonical domain decides
 *    every canonical URL and `metadataBase`; changing it from a CMS would break
 *    them silently, and it belongs with the deploy that serves it.
 *
 * `resolveSiteConfig` lays stored values over the defaults and derives the
 * links. Server components read it through `getSiteConfig()`; client components
 * take it from `useSiteConfig()`, which the site layout provides. It is plain
 * data on purpose — a function cannot cross the server/client boundary as a
 * prop, so `whatsappHref` below takes the config rather than living on it.
 */

// ---------------------------------------------------------------------------
// What is editable
// ---------------------------------------------------------------------------

export type SiteSettings = {
  name: string;
  role: string;
  roleLong: string;
  initials: string;
  jurisdiction: string;
  email: string;
  /** Human-readable, e.g. "07427 260293". */
  phoneDisplay: string;
  /** E.164, used for `tel:` links. Empty means no number is confirmed. */
  phoneE164: string;
  /** Any usual shape; normalised for `wa.me` by `resolveSiteConfig`. */
  whatsappNumber: string;
  responseTime: string;
  /** Empty until John supplies it; no number is ever invented. */
  sraNumber: string;
  /** The year John qualified as a solicitor, e.g. "2005". */
  qualifiedYear: string;
  /**
   * Public profiles that confirm who John is, for search engines' `sameAs`.
   * Each is empty until its address is confirmed: a guessed profile link
   * would tell Google that a stranger's page is John's.
   */
  reviewSolicitorsUrl: string;
  lawSocietyUrl: string;
  linkedinUrl: string;
  /** Optional verified practice facts; all remain empty until confirmed. */
  practiceLegalName: string;
  practiceSraNumber: string;
  addressStreet: string;
  addressLocality: string;
  addressRegion: string;
  addressPostalCode: string;
  addressCountry: string;
  latitude: string;
  longitude: string;
  openingHours: string;
  practiceDetailsReviewedAt: string;
};

export const siteSettingKeys = [
  "name",
  "role",
  "roleLong",
  "initials",
  "jurisdiction",
  "email",
  "phoneDisplay",
  "phoneE164",
  "whatsappNumber",
  "responseTime",
  "sraNumber",
  "qualifiedYear",
  "reviewSolicitorsUrl",
  "lawSocietyUrl",
  "linkedinUrl",
  "practiceLegalName", "practiceSraNumber", "addressStreet", "addressLocality",
  "addressRegion", "addressPostalCode", "addressCountry", "latitude", "longitude",
  "openingHours", "practiceDetailsReviewedAt",
] as const satisfies readonly (keyof SiteSettings)[];

/**
 * The defaults, and the fallback whenever a setting has no row.
 *
 * Still read from the environment rather than being written out here, so an
 * existing deploy keeps working exactly as it did until someone edits a
 * setting. The environment variables stay supported for that reason; a stored
 * value simply wins over one.
 */
export const siteSettingsDefaults: SiteSettings = {
  name: "John Violaris",
  role: "Criminal Defence Solicitor",
  roleLong: "Criminal Defence Solicitor & Motoring Specialist",
  initials: "JV",
  jurisdiction: "England & Wales",
  email: "contact@johnviolaris.com",
  phoneDisplay:
    process.env.NEXT_PUBLIC_PHONE_DISPLAY || "Phone details pending",
  phoneE164: process.env.NEXT_PUBLIC_PHONE_NUMBER || "",
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "",
  responseTime: "Response within 24 hours",
  sraNumber: "",
  // What the footer has always printed.
  qualifiedYear: "2005",
  // The practice's page on ReviewSolicitors — where the reviews on this site
  // come from, and the firm the review widgets are keyed to.
  reviewSolicitorsUrl:
    "https://www.reviewsolicitors.co.uk/london/london/ioannis-violaris",
  lawSocietyUrl: "",
  linkedinUrl: "",
  practiceLegalName: "", practiceSraNumber: "", addressStreet: "", addressLocality: "",
  addressRegion: "", addressPostalCode: "", addressCountry: "", latitude: "", longitude: "",
  openingHours: "", practiceDetailsReviewedAt: "",
};

// ---------------------------------------------------------------------------
// What is not
// ---------------------------------------------------------------------------

/** Deployment configuration. Deliberately not editable — see the note above. */
export const deployment = {
  /** Primary/canonical domain. Secondary domains should 301 here. */
  url: "https://johnviolaris.com",
  secondaryUrl: "https://drivingjustice.co.uk",
  /** Dialling code assumed when a number is written in national form. */
  countryCode: "44",
} as const;

// ---------------------------------------------------------------------------
// Resolution
// ---------------------------------------------------------------------------

export type SiteConfig = SiteSettings &
  typeof deployment & {
    /** `tel:` href, or the contact page when no number is confirmed. */
    telHref: string;
    mailtoHref: string;
    /**
     * Normalised WhatsApp digits, or null when none is usable. Null rather
     * than a fallback route on purpose: the caller has to decide what to
     * render instead, so nothing can end up labelled "WhatsApp" while quietly
     * pointing at the contact page.
     */
    whatsappDigits: string | null;
    /**
     * Where every "book a consultation" button goes: the contact section, which
     * offers email, telephone and WhatsApp. There is no booking calendar.
     */
    bookingHref: string;
  };

/**
 * `wa.me` takes digits only: no `+`, spaces, brackets or trunk prefix. Rather
 * than trust whatever shape the configured value arrives in, it is normalised
 * here, so `+44 7700 900123`, `07700 900123` and `447700900123` all produce the
 * same link. A value that cannot be read as a number yields `null` rather than
 * a broken chat link.
 */
function normaliseWhatsappNumber(raw: string): string | null {
  let digits = raw.replace(/\D/g, "");

  // `00` is the international access prefix; any `+` is already stripped.
  if (digits.startsWith("00")) digits = digits.slice(2);

  // A single leading `0` is a national trunk prefix. The practice covers
  // England & Wales only, so it resolves against the configured dialling code.
  if (digits.startsWith("0")) {
    digits = deployment.countryCode + digits.slice(1);
  }

  // E.164 permits at most 15 digits; anything under 8 is not a phone number.
  return digits.length >= 8 && digits.length <= 15 ? digits : null;
}

/** Lay stored settings over the defaults and work out the derived links. */
export function resolveSiteConfig(
  stored: Partial<SiteSettings> = {},
): SiteConfig {
  // Only non-empty strings override. A setting cleared in the admin means
  // "unset", which is the default's job to answer — not an empty heading.
  const values = { ...siteSettingsDefaults };

  for (const key of siteSettingKeys) {
    const value = stored[key];

    if (typeof value === "string" && value.trim()) {
      values[key] = value.trim();
    }
  }

  return {
    ...values,
    ...deployment,
    telHref: values.phoneE164 ? `tel:${values.phoneE164}` : "/contact#urgent",
    mailtoHref: `mailto:${values.email}`,
    whatsappDigits: values.whatsappNumber
      ? normaliseWhatsappNumber(values.whatsappNumber)
      : null,
    bookingHref: "/contact#consultation",
  };
}

/**
 * Click-to-chat href, or `null` when no usable number is configured.
 *
 * A standalone function rather than a method on `SiteConfig`, because the
 * config travels from a Server Component to a Client Component as a prop and a
 * function cannot make that crossing.
 *
 * Called without a `subject` the chat opens empty, so the visitor says it in
 * their own words. Only a page that already knows the matter — a service page —
 * puts anything in the box, and then only the name of the offence.
 */
export function whatsappHref(
  config: Pick<SiteConfig, "whatsappDigits">,
  subject?: string,
): string | null {
  if (!config.whatsappDigits) return null;
  if (!subject) return `https://wa.me/${config.whatsappDigits}`;

  const message = `Hello John, I'd like to speak to you about ${subject}.`;

  return `https://wa.me/${config.whatsappDigits}?text=${encodeURIComponent(message)}`;
}

/**
 * The configuration with no stored settings applied.
 *
 * For the two places that must not depend on a database read: the error
 * boundary and the 404. An error page whose branding needs a query is an error
 * page that fails when the query is what broke.
 */
export const fallbackSiteConfig: SiteConfig = resolveSiteConfig();

// ---------------------------------------------------------------------------
// Navigation
//
// Structure rather than settings: which pages exist and how they are grouped is
// a decision about the site, not a detail about the practice.
// ---------------------------------------------------------------------------

export type NavLink = {
  label: string;
  href: string;
};

/** Primary header / mobile navigation. */
export const mainNav: NavLink[] = [
  { label: "About", href: "/about" },
  { label: "Services", href: "/services" },
  { label: "Police Station", href: "/police-station" },
  { label: "Magistrates Court", href: "/services/magistrates-court" },
  { label: "Fees", href: "/fees" },
  { label: "Reviews", href: "/reviews" },
  { label: "Resources", href: "/blog" },
  { label: "Contact", href: "/contact" },
];

/**
 * The general crime page leads the footer services column: it is the widest
 * entry point of the catalogue, and the motoring work follows behind it.
 */
const allCrimeHref = "/services/criminal-defence";

/**
 * Footer link columns.
 *
 * A function of the published catalogue rather than a constant, so a service
 * added, renamed or unpublished under Services changes this column with no
 * second edit. `wide` marks the column that runs in two tracks rather than one
 * long list.
 */
export function footerNav(services: Service[]): {
  heading: string;
  links: NavLink[];
  wide?: boolean;
}[] {
  return [
    {
      heading: "Services",
      wide: true,
      links: [
        ...services.filter((service) => service.href === allCrimeHref),
        ...services.filter((service) => service.href !== allCrimeHref),
      ].map((service) => ({ label: service.name, href: service.href })),
    },
    {
      heading: "Information",
      links: [
        { label: "About John", href: "/about" },
        { label: "Fees & Pricing", href: "/fees" },
        { label: "Client Reviews", href: "/reviews" },
        { label: "Resources", href: "/blog" },
        { label: "Contact", href: "/contact" },
      ],
    },
  ];
}
