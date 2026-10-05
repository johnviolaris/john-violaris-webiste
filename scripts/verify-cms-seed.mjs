/**
 * Checks that the CMS seed renders exactly what the static site renders.
 *
 *   node --import ./scripts/alias-hook.mjs scripts/verify-cms-seed.mjs
 *
 * The seed migration's one promise is that moving content into Postgres changes
 * nothing a visitor sees. This is that promise, tested: each seeded row is put
 * through the same mapper `lib/cms/queries.ts` uses, and the result compared
 * against the static module the page renders today.
 *
 * Run it after editing anything under `lib/content/` or `lib/cms/`, and before
 * regenerating the seed. A failure means a page would change when it switched
 * over to the CMS — which is either a bug in a mapper, or an edit that belongs
 * in the CMS rather than in a static file.
 *
 * Comparison is key-order insensitive: `{a, b}` and `{b, a}` are the same
 * content, and the catalogue and the descriptions map genuinely list their
 * entries in different orders.
 */
import {
  toArticle,
  toServiceDescriptions,
  toServiceGroups,
  toTestimonial,
} from "@/lib/cms/mappers.ts";
import {
  seedBlogCategories,
  seedBlogPosts,
  seedServiceGroups,
  seedServicePages,
  seedServices,
  seedTestimonials,
} from "@/lib/cms/seed-data.ts";
import { articles } from "@/lib/content/blog.ts";
import { testimonials } from "@/lib/content/home.ts";
import { serviceDescriptions } from "@/lib/content/service-descriptions.ts";
import { serviceDetails } from "@/lib/content/service-detail.ts";
import { serviceGroups } from "@/lib/content/services.ts";

/** Stable stringify — object keys sorted, array order preserved. */
function canonical(value) {
  if (Array.isArray(value)) {
    return `[${value.map(canonical).join(",")}]`;
  }

  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`)
      .join(",")}}`;
  }

  return JSON.stringify(value) ?? "null";
}

let failures = 0;

function expect(label, fromSeed, fromStatic) {
  const seeded = canonical(fromSeed);
  const statik = canonical(fromStatic);

  if (seeded === statik) {
    console.log(`  ok    ${label}`);

    return;
  }

  failures += 1;
  console.log(`  FAIL  ${label}`);

  // Point at the first divergence rather than printing two walls of JSON.
  const at = [...seeded].findIndex((character, index) => character !== statik[index]);
  const window = 90;

  console.log(`        first differs at character ${at}`);
  console.log(`        seed:   ...${seeded.slice(Math.max(0, at - 20), at + window)}`);
  console.log(`        static: ...${statik.slice(Math.max(0, at - 20), at + window)}`);
}

const categoryName = (slug) =>
  seedBlogCategories.find((category) => category.slug === slug)?.name;

expect(
  "service catalogue",
  toServiceGroups(seedServices, seedServiceGroups),
  serviceGroups,
);

expect(
  "service descriptions",
  toServiceDescriptions(seedServices),
  serviceDescriptions,
);

expect(
  "offence pages",
  Object.fromEntries(
    seedServicePages.map((page) => [`/services/${page.serviceSlug}`, page.content]),
  ),
  serviceDetails,
);

expect(
  "testimonials",
  seedTestimonials.map(toTestimonial),
  testimonials.map((testimonial) => ({
    quote: testimonial.quote,
    name: testimonial.name,
    // Spread, to match the mapper: an absent field is absent on both sides
    // rather than present and undefined on one of them.
    ...(testimonial.matter ? { matter: testimonial.matter } : {}),
    rating: testimonial.rating,
    ...(testimonial.source ? { source: testimonial.source } : {}),
  })),
);

expect(
  "articles",
  seedBlogPosts.map((post) => toArticle(post, categoryName(post.categorySlug))),
  articles.map((article) => ({
    slug: article.slug,
    title: article.title,
    category: article.category,
    excerpt: article.excerpt,
    standfirst: article.standfirst,
    readTime: article.readTime,
    icon: article.icon,
    body: article.body,
    relatedService: article.relatedService,
    publishedAt: null,
  })),
);

// Every article's category must exist, or the seed migration would join to
// nothing and quietly leave the post uncategorised.
const missing = seedBlogPosts
  .filter((post) => !categoryName(post.categorySlug))
  .map((post) => post.slug);

if (missing.length > 0) {
  failures += 1;
  console.log(`  FAIL  every article has a category (missing: ${missing.join(", ")})`);
} else {
  console.log("  ok    every article has a category");
}

// A service page with no service would be dropped by the migration's join.
const orphans = seedServicePages
  .filter((page) => !seedServices.some((service) => service.slug === page.serviceSlug))
  .map((page) => page.serviceSlug);

if (orphans.length > 0) {
  failures += 1;
  console.log(`  FAIL  every offence page has a service (orphans: ${orphans.join(", ")})`);
} else {
  console.log("  ok    every offence page has a service");
}

console.log(
  failures === 0
    ? "\nSeed content renders identically to the static site."
    : `\n${failures} mismatch(es) — the seed would change what the site shows.`,
);

process.exit(failures === 0 ? 0 : 1);
