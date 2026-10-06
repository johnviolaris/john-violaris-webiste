import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";

import { SectionForm } from "@/components/admin/section-form";
import { SeoTip } from "@/components/admin/seo-tip";
import { SeoPanel } from "@/components/admin/seo-panel";
import { getSectionEditorData } from "@/lib/cms/sections/draft-queries";
import { findGroup, pageGroups } from "@/lib/cms/sections/schema";
import { seoTips } from "@/lib/cms/seo-tips";
import { RevisionHistory } from "@/components/admin/revision-history";

export function generateStaticParams() {
  return pageGroups.map((group) => ({ page: group.key }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ page: string }>;
}): Promise<Metadata> {
  const { page } = await params;
  const group = findGroup(page);

  return { title: group ? `${group.label} content` : "Website content" };
}

export default async function AdminPageContentPage({
  params,
}: {
  params: Promise<{ page: string }>;
}) {
  const { page } = await params;
  const group = findGroup(page);

  if (!group) notFound();

  const { live: stored, drafts, available } = await getSectionEditorData(page);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-14 pb-12 md:px-8 md:pt-10">
      <header className="mb-8">
        <Link
          href="/admin/website-content"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          All website content
        </Link>
        <h1 className="font-display text-2xl font-semibold">{group.label}</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          {group.description} Save each section as a private draft, preview it,
          then publish explicitly when ready.
        </p>
        {group.seo ? (
          <SeoTip variant="section" className="mt-4">
            {group.seo} {seoTips.searchListing}{" "}
            <Link
              href="/admin/seo-metadata"
              className="font-medium underline underline-offset-4"
            >
              Open SEO Metadata
            </Link>
          </SeoTip>
        ) : null}
      </header>

      {page !== "shared" ? <SeoPanel path={page === "home" ? "/" : `/${page}`} /> : null}
      <div className="space-y-4">
        {group.sections.map((section) => {
          const edited = stored[section.key] !== undefined;

          return (
            /*
             * An accordion rather than one long page: a group can run to half a
             * dozen sections of a dozen fields each, and all of them open at
             * once is a wall. `id` on the <details> is what the index links to,
             * and the browser opens a details element it has been sent to by
             * fragment, so a link from the index lands on the right section
             * already expanded.
             */
            <details
              key={section.key}
              id={section.key}
              className="group rounded-xl border open:shadow-sm"
            >
              <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-xl px-4 py-3.5 transition-colors hover:bg-muted/50">
                <span className="min-w-0">
                  <span className="block font-display text-base font-semibold">
                    {section.label}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {section.description}
                  </span>
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {drafts[section.key] ? "Private draft saved" : edited ? "Live edited wording" : "Original wording"}
                </span>
              </summary>

              <div className="border-t px-4 py-4">
                <p className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                  <span>Appears on</span>
                  {section.appearsOn.includes("*") ? (
                    <span className="font-medium text-foreground">
                      every page
                    </span>
                  ) : (
                    section.appearsOn.map((route) => (
                      <a
                        key={route}
                        href={route}
                        target="_blank"
                        rel="noopener"
                        className="inline-flex items-center gap-1 font-medium text-foreground underline-offset-4 hover:underline"
                      >
                        {route}
                        <ExternalLink className="size-3" aria-hidden="true" />
                      </a>
                    ))
                  )}
                </p>

                {section.seo ? (
                  <SeoTip variant="section" className="mb-5">
                    {section.seo}
                  </SeoTip>
                ) : null}

                <SectionForm
                  page={page}
                  definition={section}
                  stored={stored[section.key]}
                  draft={drafts[section.key]}
                  available={available}
                />
                <RevisionHistory entity="page_sections" id={`${page}/${section.key}`} sectionWorkflow={{ liveContent: drafts[section.key] ? drafts[section.key].base_content : stored[section.key] ?? null, draftId: drafts[section.key]?.id ?? null, draftVersion: drafts[section.key]?.version ?? null }} />
                {available && <RevisionHistory entity="page_section_drafts" id={`${page}/${section.key}`} sectionWorkflow={{ liveContent: drafts[section.key] ? drafts[section.key].base_content : stored[section.key] ?? null, draftId: drafts[section.key]?.id ?? null, draftVersion: drafts[section.key]?.version ?? null }} />}
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}
