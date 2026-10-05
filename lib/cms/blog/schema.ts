import { isIconName } from "@/components/ui/icons";
import {
  initialCmsFormState,
  readLines,
  readParagraphs,
  writeLines,
  writeParagraphs,
  type CmsFormState,
  type FieldRule,
} from "@/lib/cms/form";
import type { BlogPostRow } from "@/lib/cms/types";
import type { ArticleBlock } from "@/lib/content/blog";
import { londonInputValue } from "@/lib/cms/publication";

/**
 * The blog editor's field list, rules and encoding.
 *
 * Shared by the form and the action that receives it, the same way
 * `lib/enquiries/schema.ts` is shared by the contact form and its action, so
 * the two cannot drift apart.
 *
 * No server-only imports: the editor is a client component and renders the
 * field errors this file's rules produce.
 */

export const blogPostFields = [
  "title",
  "slug",
  "categoryId",
  "excerpt",
  "standfirst",
  "readTime",
  "icon",
  "relatedService",
  "featuredImage",
  "featuredImageAlt",
  "featuredImageTitle",
  "featuredImageCaption",
  "publishedAt",
  "unpublishAt",
] as const;

export type BlogPostField = (typeof blogPostFields)[number];

export type BlogPostValues = Record<BlogPostField, string>;

export const emptyBlogPostValues: BlogPostValues = {
  title: "",
  slug: "",
  categoryId: "",
  excerpt: "",
  standfirst: "",
  readTime: "",
  icon: "document",
  relatedService: "",
  featuredImage: "",
  featuredImageAlt: "",
  featuredImageTitle: "",
  featuredImageCaption: "",
  publishedAt: "",
  unpublishAt: "",
};

/**
 * Limits are what the card and the search result can actually show.
 *
 * `excerpt` doubles as the meta description, where Google truncates somewhere
 * around 160 characters; 300 leaves room to write past that deliberately
 * without letting a whole opening paragraph land in the field by accident.
 */
export const blogPostRules: Record<BlogPostField, FieldRule> = {
  title: { label: "Title", required: true, maxLength: 160 },
  slug: { label: "URL slug", required: true, maxLength: 120, format: "slug" },
  categoryId: { label: "Category" },
  excerpt: { label: "Excerpt", required: true, maxLength: 300 },
  standfirst: { label: "Standfirst", required: true, maxLength: 600 },
  // Filled in from the word count when left blank — see `estimateReadTime`.
  readTime: { label: "Read time", maxLength: 24 },
  icon: { label: "Icon", required: true, maxLength: 24 },
  relatedService: { label: "Related service", maxLength: 120 },
  featuredImage: { label: "Featured image", maxLength: 400 },
  featuredImageAlt: { label: "Image description", maxLength: 200 },
  featuredImageTitle: { label: "Image title", maxLength: 160 },
  featuredImageCaption: { label: "Image caption", maxLength: 1000 },
  publishedAt: { label: "Publication date and time", maxLength: 32 },
  unpublishAt: { label: "Unpublish date and time", maxLength: 32 },
};

/**
 * The editor's state, and its starting value.
 *
 * Here rather than beside the actions that consume them: every export of a
 * `"use server"` module has to be an async function, so a plain constant in
 * `actions.ts` fails the build the moment a Server Component imports from it.
 */
export type BlogPostFormState = CmsFormState<BlogPostField> & {
  /** Keyed by section index, because the fields are positional. */
  sectionErrors: Record<number, string>;
  faqError?: string;
};

export const initialBlogPostFormState: BlogPostFormState = {
  ...initialCmsFormState(emptyBlogPostValues),
  sectionErrors: {},
};

// ---------------------------------------------------------------------------
// Body sections
// ---------------------------------------------------------------------------

/**
 * A body is a list of sections, each a heading with prose and an optional list
 * — the shape `lib/content/blog.ts` already defines and `/blog/[slug]` already
 * renders. Storing structure rather than markup is what lets the article page
 * keep its own typography and its own contents rail.
 *
 * Sections arrive in a `FormData` as indexed fields. The index is positional
 * and not stored: reordering in the editor renumbers, and what the database
 * sees is simply a different array order.
 */
export const sectionCountField = "sectionCount";

export function sectionField(
  index: number,
  part: "heading" | "paragraphs" | "list",
): string {
  return `section.${index}.${part}`;
}

/** An editor row, before it becomes an `ArticleBlock`. */
export type SectionValues = {
  heading: string;
  paragraphs: string;
  list: string;
};

export const emptySection: SectionValues = {
  heading: "",
  paragraphs: "",
  list: "",
};

/** Stored block -> editor row. */
export function sectionValuesFrom(block: ArticleBlock): SectionValues {
  return {
    heading: block.heading,
    paragraphs: writeParagraphs(block.paragraphs),
    list: writeLines(block.list),
  };
}

/**
 * Read the section rows out of a submission.
 *
 * `sectionCount` bounds the scan rather than probing until a gap: a section
 * deleted from the middle of the editor would end the scan early otherwise, and
 * silently truncate the article.
 *
 * A row with no heading and no prose is dropped. That is the empty row the
 * editor adds when "Add section" is clicked and then nothing is typed, and
 * saving it would put a blank heading on the page.
 */
export function readSections(formData: FormData): ArticleBlock[] {
  const declared = Number(formData.get(sectionCountField) ?? 0);
  const count = Number.isFinite(declared)
    ? Math.min(Math.max(Math.trunc(declared), 0), maxSections)
    : 0;

  const sections: ArticleBlock[] = [];

  for (let index = 0; index < count; index += 1) {
    const read = (part: "heading" | "paragraphs" | "list") => {
      const value = formData.get(sectionField(index, part));

      return typeof value === "string" ? value.trim() : "";
    };

    const heading = read("heading");
    const paragraphs = readParagraphs(read("paragraphs"));
    const list = readLines(read("list"));

    if (!heading && paragraphs.length === 0 && list.length === 0) continue;

    sections.push({
      heading,
      paragraphs,
      ...(list.length > 0 ? { list } : {}),
    });
  }

  return sections;
}

/** A ceiling on the scan above, so a forged `sectionCount` cannot spin the loop. */
const maxSections = 60;

/**
 * Which sections are incomplete, keyed by index.
 *
 * A section needs a heading and something under it. Checked separately from
 * `validateFields` because the fields are positional and the messages have to
 * name the section rather than the field.
 */
export function validateSections(
  sections: ArticleBlock[],
): Record<number, string> {
  const errors: Record<number, string> = {};

  sections.forEach((section, index) => {
    if (!section.heading) {
      errors[index] = "This section needs a heading.";
    } else if (section.paragraphs.length === 0 && !section.list?.length) {
      errors[index] = "This section needs some text or a list beneath it.";
    }
  });

  return errors;
}

// ---------------------------------------------------------------------------
// Derived values
// ---------------------------------------------------------------------------

/** Words a minute. Deliberately unhurried — this is dense legal prose. */
const wordsPerMinute = 200;

/**
 * "8 min read", from the body.
 *
 * Only used when the field is left blank, so a hand-written estimate is never
 * overwritten. The six seeded articles keep the read times they were written
 * with until someone edits one.
 */
export function estimateReadTime(sections: ArticleBlock[]): string {
  const words = sections.reduce((total, section) => {
    const text = [...section.paragraphs, ...(section.list ?? [])].join(" ");

    return total + (text.match(/\S+/g)?.length ?? 0);
  }, 0);

  return `${Math.max(1, Math.round(words / wordsPerMinute))} min read`;
}

/** Row -> editor values. */
export function blogPostValuesFrom(row: BlogPostRow): BlogPostValues {
  const { content } = row;

  return {
    title: row.title,
    slug: row.slug,
    categoryId: row.category_id ?? "",
    excerpt: content.excerpt ?? "",
    standfirst: content.standfirst ?? "",
    readTime: content.readTime ?? "",
    icon: isIconName(content.icon) ? content.icon : "document",
    relatedService: content.relatedService ?? "",
    featuredImage: content.featuredImage ?? "",
    featuredImageAlt: content.featuredImageAlt ?? "",
    featuredImageTitle: content.featuredImageTitle ?? "",
    featuredImageCaption: content.featuredImageCaption ?? "",
    publishedAt: londonInputValue(row.published_at),
    unpublishAt: londonInputValue(row.unpublish_at),
  };
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export const blogCategoryFields = ["name", "slug"] as const;

export type BlogCategoryField = (typeof blogCategoryFields)[number];

export const emptyBlogCategoryValues: Record<BlogCategoryField, string> = {
  name: "",
  slug: "",
};

export const blogCategoryRules: Record<BlogCategoryField, FieldRule> = {
  name: { label: "Name", required: true, maxLength: 80 },
  slug: { label: "URL slug", required: true, maxLength: 80, format: "slug" },
};

export const initialBlogCategoryFormState = initialCmsFormState(
  emptyBlogCategoryValues,
);
