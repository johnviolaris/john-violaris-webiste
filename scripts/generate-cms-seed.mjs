/**
 * Generates the CMS seed migration from the static content modules.
 *
 *   node --import ./scripts/alias-hook.mjs scripts/generate-cms-seed.mjs
 *
 * Writes `supabase/migrations/<timestamp>_seed_cms_content.sql`, or overwrites
 * the existing seed migration if one is already there — regenerating in place
 * rather than stacking a second seed on top of the first.
 *
 * The content comes from `lib/cms/seed-data.ts`, which is also what the site
 * falls back to when Supabase cannot be read. Generating from the same module
 * is the point: the seeded rows and the fallback are the same content by
 * construction, not by anyone remembering to update both.
 *
 * Re-running this and re-applying the migration is safe. Every statement is
 * guarded by `where not exists (select 1 from <table>)`, so a table that
 * already holds rows is left completely alone. That matters more than it looks:
 * a seed that overwrote on conflict would delete John's edits the next time
 * anyone reset the database.
 */
import { readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import {
  seedBlogCategories,
  seedBlogPosts,
  seedServicePages,
  seedServices,
  seedSiteSettings,
  seedTestimonials,
} from "@/lib/cms/seed-data.ts";

const migrationsDir = join(process.cwd(), "supabase", "migrations");
const suffix = "_seed_cms_content.sql";

// ---------------------------------------------------------------------------
// SQL literals
// ---------------------------------------------------------------------------

/** Postgres runs with standard_conforming_strings, so only `'` needs doubling. */
function text(value) {
  return `'${String(value).replace(/'/g, "''")}'::text`;
}

function json(value) {
  return `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`;
}

function bool(value) {
  return value ? "true" : "false";
}

function int(value) {
  return `${Math.trunc(value)}::integer`;
}

function timestamp(value) {
  return value === null ? "null::timestamptz" : `'${value}'::timestamptz`;
}

/** `(a, b, c)` rows, indented to sit under a `values` keyword. */
function rows(items, toCells) {
  return items
    .map((item) => `    (${toCells(item).join(", ")})`)
    .join(",\n");
}

// ---------------------------------------------------------------------------
// Statements
// ---------------------------------------------------------------------------

/**
 * A guarded insert.
 *
 * `select ... from (values ...)` rather than `insert ... values` so the guard
 * can be a `where not exists` over the target table, and so the join-by-slug
 * statements below can share the same shape.
 */
function seedInto({ table, columns, source, values, from = "", where }) {
  return `insert into public.${table} (${columns.join(", ")})
select ${source}
from (values
${values}
  ) as v (${from})
${where}
where not exists (select 1 from public.${table});`;
}

const statements = [
  {
    comment:
      "The service catalogue. `sort_order` runs across the whole list rather\n-- than restarting per group, so ordering by it reproduces both the order of\n-- the groups and the order within them.",
    sql: seedInto({
      table: "services",
      columns: ["slug", "name", "published", "sort_order", "content"],
      source: "v.slug, v.name, v.published, v.sort_order, v.content",
      from: "slug, name, published, sort_order, content",
      values: rows(seedServices, (service) => [
        text(service.slug),
        text(service.name),
        bool(service.published),
        int(service.sort_order),
        json(service.content),
      ]),
      where: "",
    }),
  },
  {
    comment:
      "Long-form offence pages, joined to their service by slug. Sixteen of the\n-- seventeen services have one; police station representation is served by its\n-- own route instead.",
    sql: seedInto({
      table: "service_pages",
      columns: ["service_id", "published", "content"],
      source: "s.id, v.published, v.content",
      from: "service_slug, published, content",
      values: rows(seedServicePages, (page) => [
        text(page.serviceSlug),
        bool(page.published),
        json(page.content),
      ]),
      where: "join public.services s on s.slug = v.service_slug",
    }),
  },
  {
    comment:
      "The verified reviews from John's ReviewSolicitors profile, seeded published\n-- because they are what the homepage shows today. `content.source` names the\n-- platform they were collected on: PRD §17 forbids presenting an invented\n-- review as a verified one, and that field is what tells the two apart. Only\n-- set it on a review that can be pointed at.",
    sql: seedInto({
      table: "testimonials",
      columns: ["author", "quote", "rating", "published", "sort_order", "content"],
      source: "v.author, v.quote, v.rating, v.published, v.sort_order, v.content",
      from: "author, quote, rating, published, sort_order, content",
      values: rows(seedTestimonials, (testimonial) => [
        text(testimonial.author),
        text(testimonial.quote),
        `${testimonial.rating}::smallint`,
        bool(testimonial.published),
        int(testimonial.sort_order),
        json(testimonial.content),
      ]),
      where: "",
    }),
  },
  {
    comment: "Categories, derived from the articles that use them.",
    sql: seedInto({
      table: "blog_categories",
      columns: ["slug", "name"],
      source: "v.slug, v.name",
      from: "slug, name",
      values: rows(seedBlogCategories, (category) => [
        text(category.slug),
        text(category.name),
      ]),
      where: "",
    }),
  },
  {
    comment:
      "The six legal guides. `published_at` is null: the static articles carry no\n-- publication date and inventing one would date content John has not yet\n-- approved. The blog admin sets it on first publish.",
    sql: seedInto({
      table: "blog_posts",
      columns: ["slug", "title", "category_id", "published", "published_at", "content"],
      source: "v.slug, v.title, c.id, v.published, v.published_at, v.content",
      from: "slug, title, category_slug, published, published_at, content",
      values: rows(seedBlogPosts, (post) => [
        text(post.slug),
        text(post.title),
        text(post.categorySlug),
        bool(post.published),
        timestamp(post.published_at),
        json(post.content),
      ]),
      where: "left join public.blog_categories c on c.slug = v.category_slug",
    }),
  },
  {
    comment:
      "Site settings. Only the facts that are actually known are seeded. No\n-- telephone number, WhatsApp number or SRA number appears here because none\n-- has been confirmed and PRD §25 forbids inventing one. TidyCal is intentionally\n-- out of scope. The site omits unconfirmed contact routes until a value is set.",
    sql: seedInto({
      table: "site_settings",
      columns: ["key", "value"],
      source: "v.key, v.value",
      from: "key, value",
      values: rows(seedSiteSettings, (setting) => [
        text(setting.key),
        json(setting.value),
      ]),
      where: "",
    }),
  },
];

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

const header = `/*
 * CMS content seed — the site's existing static content, as rows.
 *
 * GENERATED by \`scripts/generate-cms-seed.mjs\` from \`lib/cms/seed-data.ts\`.
 * Do not edit by hand: regenerate instead, or the seeded rows and the runtime
 * fallback in \`lib/cms/queries.ts\` stop agreeing with each other.
 *
 * Every statement is guarded by \`where not exists (select 1 from <table>)\`, so
 * applying this to a database that already holds content does nothing at all.
 * The guard is not politeness — a seed that overwrote on conflict would delete
 * John's edits the next time anyone reset the database.
 *
 * Seeding published content on purpose: this migration is meant to change
 * nothing a visitor sees. It moves where the content lives, not what it says.
 */
`;

const body = statements
  .map(({ comment, sql }) => `\n-- ${comment}\n${sql}\n`)
  .join("");

const existing = readdirSync(migrationsDir).find((file) => file.endsWith(suffix));

// A regenerated seed replaces the previous file rather than adding a second
// one; two seed migrations in a row would apply the same content twice.
const filename =
  existing ??
  `${new Date().toISOString().replace(/\D/g, "").slice(0, 14)}${suffix}`;

writeFileSync(join(migrationsDir, filename), `${header}${body}`, "utf8");

const counts = {
  services: seedServices.length,
  service_pages: seedServicePages.length,
  testimonials: seedTestimonials.length,
  blog_categories: seedBlogCategories.length,
  blog_posts: seedBlogPosts.length,
  site_settings: seedSiteSettings.length,
};

console.log(`${existing ? "Updated" : "Created"} supabase/migrations/${filename}`);
for (const [table, count] of Object.entries(counts)) {
  console.log(`  ${String(count).padStart(3)}  ${table}`);
}
