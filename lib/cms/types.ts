import type { IconName } from "@/components/ui/icons";
import type { FaqItem } from "@/lib/cms/faq";
import type { ArticleBlock } from "@/lib/content/blog";
import type { ServiceDetail } from "@/lib/content/service-detail";
import type { Service, ServiceGroup } from "@/lib/content/services";

/**
 * The shapes the CMS stores, and the shapes the site renders.
 *
 * Every content table has the same skeleton: a few real columns for the things
 * the database has to index, order or filter on, and a `content` jsonb column
 * holding everything else (see `20260914103000_create_cms_content_tables.sql`).
 * This file is the contract for what goes in that jsonb.
 *
 * The presentation types — `ServiceGroup`, `PenaltyCard`, `ArticleBlock` and so
 * on — are imported from `lib/content/` rather than redefined, so a CMS row and
 * the static seed it came from cannot drift into different shapes. Those
 * modules stay the definition of what a service or an article *is*; the CMS
 * decides what the current one *says*.
 *
 * Nothing here is `server-only`: the admin forms are client components and read
 * the same types the server writes.
 */

/** Columns every editable row carries. */
export type Timestamps = {
  created_at: string;
  updated_at: string;
};

// ---------------------------------------------------------------------------
// Services
// ---------------------------------------------------------------------------

/**
 * `services.content`.
 *
 * `group` is the name of a `service_groups` row rather than a foreign key to
 * it. The public reads, the static fallback and the seed all work from the
 * name, and database triggers keep it honest: a missing group is created, a
 * renamed one is renamed on its services, and a group with services cannot be
 * deleted. See `20261005120000_create_service_groups.sql`.
 */
export type ServiceContent = {
  /** Mega-menu / catalogue heading this service sits under. */
  group: string;
  statute?: string;
  icon: IconName;
  /** Shorter label for the compact rail, where the full name is too long. */
  short?: string;
  /** Shown in the compact rail beneath the hero. */
  featured?: boolean;
  /** One-line summary on the services index. */
  intro?: string;
  /**
   * Set when the service links somewhere other than `/services/<slug>` —
   * police station representation points at its own standalone page.
   */
  href?: string;
};

/**
 * `service_groups` — a heading of the services menu, with its place in the
 * menu and whether its services are motoring offences.
 */
export type ServiceGroupRow = Timestamps & {
  id: string;
  name: string;
  sort_order: number;
  motoring: boolean;
};

export type ServiceRow = Timestamps & {
  id: string;
  slug: string;
  name: string;
  published: boolean;
  sort_order: number;
  content: ServiceContent;
};

/**
 * `service_pages.content` — the long-form body of one offence page.
 *
 * Exactly the static `ServiceDetail`, not a copy of its fields. An earlier
 * copy left out `outcomes` and `ancillaryOrders`, so a page read from Postgres
 * would have type-checked while silently dropping two of its tables.
 */
export type ServicePageContent = ServiceDetail;

export type ServicePageRow = Timestamps & {
  id: string;
  service_id: string;
  published: boolean;
  content: ServicePageContent;
};

// ---------------------------------------------------------------------------
// Testimonials
// ---------------------------------------------------------------------------

/**
 * `testimonials.content`.
 *
 * `source` records where a review came from — ReviewSolicitors, Trustpilot, or
 * given directly to John. PRD §17 forbids inventing a verified review, and an
 * unset source is how an unverified one stays distinguishable from a verified
 * one rather than quietly becoming one.
 */
export type TestimonialContent = {
  /**
   * The matter it concerned, e.g. "Driving offences". Optional: ReviewSolicitors
   * lets a reviewer leave the area of law off, and a card shows no line at all
   * rather than one guessed from the review text.
   */
  matter?: string;
  source?: string;
};

export type TestimonialRow = Timestamps & {
  id: string;
  /** Displayed attribution, e.g. "T.B., London". Initials, never a full name. */
  author: string;
  quote: string;
  rating: number | null;
  published: boolean;
  sort_order: number;
  content: TestimonialContent;
};

// ---------------------------------------------------------------------------
// Blog
// ---------------------------------------------------------------------------

export type BlogCategoryRow = {
  id: string;
  slug: string;
  name: string;
  created_at: string;
};

/** `blog_posts.content`. */
export type BlogPostContent = {
  /** Only saved, reviewed FAQs are rendered and described by FAQPage schema. */
  faqItems?: FaqItem[];
  /** Card summary, and the meta description for the article page. */
  excerpt: string;
  /** Standfirst beneath the article heading. */
  standfirst: string;
  readTime: string;
  icon: IconName;
  body: ArticleBlock[];
  /** Service page this article should send the reader to. */
  relatedService?: string;
  /** Storage path of the featured image, once uploads exist. */
  featuredImage?: string;
  featuredImageAlt?: string;
  featuredImageTitle?: string;
  featuredImageCaption?: string;
  /** Missing values preserve historical captions as literal plain text. */
  featuredImageCaptionFormat?: "plain" | "markdown";
};

export type BlogPostRow = Timestamps & {
  id: string;
  slug: string;
  title: string;
  category_id: string | null;
  published: boolean;
  published_at: string | null;
  /** Stops publication at this instant; entered by editors in UK local time. */
  unpublish_at?: string | null;
  content: BlogPostContent;
};

// ---------------------------------------------------------------------------
// SEO and settings
// ---------------------------------------------------------------------------

/**
 * `seo_metadata.content`, keyed by site path. Every field is optional: a row
 * overrides only what it sets, and the page's own defaults cover the rest —
 * see `resolveMetadata` in `lib/cms/seo/resolve.ts`, the one place that
 * decides the order.
 *
 * Absent rather than empty: the editor stores only what was filled in, and a
 * row with nothing left in it is deleted rather than kept.
 */
export type SeoContent = {
  /** The part before " | John Violaris"; the site's title template adds that. */
  title?: string;
  description?: string;
  /** A path on this site or an absolute URL. Defaults to the page's own. */
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogImageAlt?: string;
  /** Left unset to follow the page's content type. */
  ogType?: "website" | "article";
  /** X/Twitter overrides fall back to their Open Graph equivalents. */
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  twitterImageAlt?: string;
  twitterCard?: "summary" | "summary_large_image";
  /** Validated additive Schema.org JSON-LD, edited by administrators only. */
  customJsonLd?: string;
  /** Asks search engines to leave the page out, and drops it from the sitemap. */
  noIndex?: true;
  noFollow?: true;
};

export type SeoRow = Timestamps & {
  id: string;
  path: string;
  content: SeoContent;
};

/** Bespoke service-area content. No office/address fields or seeded locations. */
export type LocationPageContent = {
  description: string;
  intro: string;
  localContext: string[];
  body: string[];
  relatedServices: string[];
};

export type LocationPageRow = Timestamps & {
  id: string;
  slug: string;
  location: string;
  title: string;
  published: boolean;
  published_at?: string | null;
  unpublish_at?: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  content: LocationPageContent;
};

/**
 * `site_settings` is key/value so a new setting needs no migration.
 *
 * NOTE: the table is world-readable by design — it holds the contact details
 * the site prints on every page. Never put a secret in it.
 */
export type SiteSettingRow = {
  key: string;
  value: unknown;
  updated_at: string;
};

// ---------------------------------------------------------------------------
// Render shapes
//
// What the read layer hands the components: exactly what they consume today,
// so switching a page from a static import to a CMS read changes the import
// line and nothing else.
// ---------------------------------------------------------------------------

export type { Service, ServiceGroup };

/** A service and its long-form page, as `/services/[slug]` needs them. */
export type ServiceWithPage = {
  service: Service;
  slug: string;
  detail: ServicePageContent;
};

/** One article, in the shape `/blog` and `/blog/[slug]` already render. */
export type Article = BlogPostContent & {
  slug: string;
  title: string;
  /** Category name, resolved from `category_id`. */
  category: string;
  publishedAt: string | null;
};

export type Testimonial = TestimonialContent & {
  quote: string;
  name: string;
  rating: number;
};
