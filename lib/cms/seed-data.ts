import { articles } from "@/lib/content/blog";
import { testimonials } from "@/lib/content/home";
import { serviceDescriptions } from "@/lib/content/service-descriptions";
import { serviceDetails } from "@/lib/content/service-detail";
import { serviceGroups } from "@/lib/content/services";
import { slugify } from "@/lib/slug";
import type {
  BlogPostContent,
  ServiceContent,
  ServicePageContent,
  TestimonialContent,
} from "@/lib/cms/types";

/**
 * The static content of the site, expressed as CMS rows.
 *
 * This module has two readers and that is the point of it:
 *
 *  1. `scripts/generate-cms-seed.mjs` turns it into the seed migration, so the
 *     tables start holding exactly what the site shows today.
 *  2. `lib/cms/queries.ts` falls back to it when a read fails, so a Supabase
 *     outage or an unseeded database serves the right content rather than a
 *     blank page.
 *
 * Because both go through the same mappers in `lib/cms/mappers.ts`, a row read
 * from Postgres and a row read from here cannot render differently.
 *
 * The `lib/content/` modules stay where the words live until each section is
 * migrated. Once John is editing a section in the CMS, its entry here is frozen
 * history — useful as a fallback, no longer the source. Delete an entry only
 * when its table is populated in production and the fallback has been removed.
 *
 * Deliberately free of `server-only`: the seed generator imports it from plain
 * node.
 */

export type SeedService = {
  slug: string;
  name: string;
  published: boolean;
  sort_order: number;
  content: ServiceContent;
};

export type SeedServicePage = {
  /** Resolved to `service_id` by the migration. */
  serviceSlug: string;
  published: boolean;
  content: ServicePageContent;
};

export type SeedTestimonial = {
  author: string;
  quote: string;
  rating: number;
  published: boolean;
  sort_order: number;
  content: TestimonialContent;
};

export type SeedBlogCategory = {
  slug: string;
  name: string;
};

export type SeedBlogPost = {
  slug: string;
  title: string;
  /** Resolved to `category_id` by the migration. */
  categorySlug: string;
  published: boolean;
  published_at: string | null;
  content: BlogPostContent;
};

/** `/services/drink-driving` -> `drink-driving`; `/police-station` -> `police-station`. */
function slugFromHref(href: string): string {
  return href.replace(/^\/(services\/)?/, "");
}

/**
 * Services, flattened from the grouped catalogue.
 *
 * `sort_order` runs across the whole list rather than restarting per group, so
 * ordering the rows by it reproduces both the order of the groups and the order
 * within them — which is what `toServiceGroups` relies on to rebuild the menu.
 */
export const seedServices: SeedService[] = serviceGroups.flatMap(
  (group, groupIndex) =>
    group.services.map((service, serviceIndex): SeedService => {
      const slug = slugFromHref(service.href);
      const canonicalHref = `/services/${slug}`;

      return {
        slug,
        name: service.name,
        published: true,
        // Leaves room to insert between groups without renumbering everything.
        sort_order: groupIndex * 100 + serviceIndex,
        content: {
          group: group.heading,
          icon: service.icon,
          ...(service.statute ? { statute: service.statute } : {}),
          ...(service.short ? { short: service.short } : {}),
          ...(service.featured ? { featured: true } : {}),
          ...(serviceDescriptions[service.href]
            ? { intro: serviceDescriptions[service.href].intro }
            : {}),
          // Only recorded when it differs from the conventional route, so an
          // ordinary service row carries no redundant URL to keep in step with
          // its own slug.
          ...(service.href === canonicalHref ? {} : { href: service.href }),
        },
      };
    }),
);

/**
 * Long-form offence pages. Sixteen of the seventeen services have one; police
 * station representation is served by its own page at `/police-station`.
 */
export const seedServicePages: SeedServicePage[] = Object.entries(
  serviceDetails,
).map(([href, detail]): SeedServicePage => ({
  serviceSlug: slugFromHref(href),
  published: true,
  content: detail,
}));

/**
 * The verified reviews from John's ReviewSolicitors profile, seeded published
 * because they are what the homepage shows today.
 *
 * `source` is set now, which it was not while these were placeholders: PRD §17
 * forbids publishing an invented review as a verified one, and the field is
 * what tells the two apart. Only set it on a review that can be pointed at.
 */
export const seedTestimonials: SeedTestimonial[] = testimonials.map(
  (testimonial, index): SeedTestimonial => ({
    author: testimonial.name,
    quote: testimonial.quote,
    rating: testimonial.rating,
    published: true,
    sort_order: index * 10,
    content: {
      ...(testimonial.matter ? { matter: testimonial.matter } : {}),
      ...(testimonial.source ? { source: testimonial.source } : {}),
    },
  }),
);

/** Categories, derived from the articles that use them. */
export const seedBlogCategories: SeedBlogCategory[] = [
  ...new Set(articles.map((article) => article.category)),
].map((name) => ({ slug: slugify(name), name }));

/**
 * The six legal guides.
 *
 * `published_at` is null: the static articles carry no publication date, and
 * inventing one would date content John has not yet approved. The blog admin
 * sets it on first publish.
 */
export const seedBlogPosts: SeedBlogPost[] = articles.map(
  (article): SeedBlogPost => ({
    slug: article.slug,
    title: article.title,
    categorySlug: slugify(article.category),
    published: true,
    published_at: null,
    content: {
      excerpt: article.excerpt,
      standfirst: article.standfirst,
      readTime: article.readTime,
      icon: article.icon,
      body: article.body,
      relatedService: article.relatedService,
    },
  }),
);

export type SeedSiteSetting = {
  key: string;
  value: unknown;
};

/**
 * Site settings, seeded with the facts that are actually known.
 *
 * What is absent matters more than what is here. There is no telephone number,
 * WhatsApp number or SRA number in this list, because none has been confirmed
 * and PRD §25 forbids inventing one. TidyCal is intentionally out of scope.
 * `siteSettingsDefaults` in `lib/site-config.ts` keeps reading the remaining
 * values from the environment until John sets them under Site Settings, and
 * every route that depends on one stays hidden rather than rendering a control
 * that leads nowhere.
 *
 * The canonical domain, the secondary domain and the dialling code are not
 * here either, and that one is a decision rather than a gap: they are
 * deployment configuration, they live in `deployment` in `lib/site-config.ts`,
 * and `20260923103000_drop_deployment_site_settings.sql` removes the rows an
 * earlier seed created for them.
 *
 * The email address is seeded because it is already published on the contact
 * page, not because it has been verified. Confirm it before launch.
 */
export const seedSiteSettings: SeedSiteSetting[] = [
  { key: "name", value: "John Violaris" },
  { key: "role", value: "Criminal Defence Solicitor" },
  { key: "roleLong", value: "Criminal Defence Solicitor & Motoring Specialist" },
  { key: "initials", value: "JV" },
  { key: "jurisdiction", value: "England & Wales" },
  { key: "email", value: "contact@johnviolaris.com" },
  { key: "responseTime", value: "Response within 24 hours" },
];
