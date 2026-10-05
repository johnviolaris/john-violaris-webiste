import type {
  Article,
  Service,
  ServiceGroup,
  Testimonial,
} from "@/lib/cms/types";
import type {
  BlogPostContent,
  ServiceContent,
  TestimonialContent,
} from "@/lib/cms/types";

/**
 * Row -> render shape.
 *
 * Both paths into a page go through here: a row read from Postgres and a row
 * read from the static fallback in `lib/cms/seed-data.ts`. Keeping the
 * transformation in one place is what makes the fallback trustworthy — there is
 * no second implementation to drift.
 *
 * The parameter types are structural and ask only for the fields each mapper
 * reads, so a full `ServiceRow` and a `SeedService` (which has no id or
 * timestamps yet) both satisfy them.
 */

type ServiceLike = {
  slug: string;
  name: string;
  content: ServiceContent;
};

export function toService(row: ServiceLike): Service {
  const { content } = row;

  // Key order matches `lib/content/services.ts` so that a service built from a
  // row and the same service written by hand serialise identically — which is
  // what lets the seed be checked against the static catalogue byte for byte.
  return {
    name: row.name,
    href: content.href ?? `/services/${row.slug}`,
    ...(content.statute ? { statute: content.statute } : {}),
    icon: content.icon,
    ...(content.short ? { short: content.short } : {}),
    ...(content.featured ? { featured: true } : {}),
  };
}

type ServiceGroupLike = {
  name: string;
  motoring: boolean;
};

/**
 * Rebuild the grouped catalogue the mega-menu renders.
 *
 * Groups come out in the order of `groups`, and only those with a service in
 * them: a group being prepared has nothing to show. Services must arrive
 * ordered by `sort_order` and keep that order within their group.
 *
 * A service naming a group missing from `groups` still appears, in a group of
 * its own at the end, treated as motoring as every group is by default. The
 * database creates the row for any group a service names, so this is only
 * the fallback's and a stale read's case — but losing a service from the
 * menu would be the worse failure.
 */
export function toServiceGroups(
  rows: ServiceLike[],
  groups: ServiceGroupLike[],
): ServiceGroup[] {
  const byName = new Map<string, ServiceGroup>(
    groups.map((group) => [
      group.name,
      { heading: group.name, motoring: group.motoring, services: [] },
    ]),
  );

  for (const row of rows) {
    const heading = row.content.group;
    let group = byName.get(heading);

    if (!group) {
      group = { heading, motoring: true, services: [] };
      byName.set(heading, group);
    }

    group.services.push(toService(row));
  }

  return [...byName.values()].filter((group) => group.services.length > 0);
}

/** Service intros, keyed by href, as `serviceDescriptions` is today. */
export function toServiceDescriptions(
  rows: ServiceLike[],
): Record<string, { intro: string }> {
  const descriptions: Record<string, { intro: string }> = {};

  for (const row of rows) {
    if (row.content.intro) {
      descriptions[toService(row).href] = { intro: row.content.intro };
    }
  }

  return descriptions;
}

type TestimonialLike = {
  author: string;
  quote: string;
  rating: number | null;
  content: TestimonialContent;
};

export function toTestimonial(row: TestimonialLike): Testimonial {
  return {
    quote: row.quote,
    name: row.author,
    // Spread rather than assigned, so an untagged review carries no `matter`
    // key at all instead of one set to undefined.
    ...(row.content.matter ? { matter: row.content.matter } : {}),
    // The stars component takes a number. An unrated review shows five stars
    // nowhere — it shows none, which is the honest rendering of "not rated".
    rating: row.rating ?? 0,
    ...(row.content.source ? { source: row.content.source } : {}),
  };
}

type BlogPostLike = {
  slug: string;
  title: string;
  published_at: string | null;
  content: BlogPostContent;
};

export function toArticle(row: BlogPostLike, category: string): Article {
  return {
    ...row.content,
    slug: row.slug,
    title: row.title,
    category,
    publishedAt: row.published_at,
  };
}
