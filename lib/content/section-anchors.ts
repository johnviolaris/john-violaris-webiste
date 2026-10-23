import type { ServiceSection } from "@/lib/content/service-detail";

/**
 * Ids the page already uses, which a long-form section's anchor must not take.
 */
export const reservedIds = [
  "main",
  "at-a-glance",
  "legal-framework",
  "your-options",
  "sentencing-and-outcomes",
  "ancillary-orders",
  "what-to-share",
  "personal-representation",
  "page-alert",
  "toc-heading",
  "cta-heading",
];

/**
 * An anchor for every titled section, from its eyebrow where it has one
 * ("the-offence") and its heading otherwise. Unique on the page; untitled
 * sections get none and stay out of the contents list.
 *
 * Shared with the tests, so an in-page link such as `#sentencing-guidelines`
 * is checked against the same ids the page renders.
 */
export function sectionAnchors(sections: ServiceSection[], reserved: string[]): (string | null)[] {
  const used = new Set(reserved);

  return sections.map((section) => {
    const heading = section.heading?.trim();

    if (!heading) return null;

    const base =
      slugify(section.eyebrow?.trim() || heading) || "section";
    let id = base;

    for (let suffix = 2; used.has(id); suffix += 1) id = `${base}-${suffix}`;

    used.add(id);

    return id;
  });
}

function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
}
