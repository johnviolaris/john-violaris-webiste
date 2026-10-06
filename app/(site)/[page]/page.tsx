import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InformationPageContent } from "@/components/pages/information-page-content";
import { getPagesContent, getSiteConfig } from "@/lib/cms/queries";
import { redirectFromCms } from "@/lib/cms/redirects";
import { seoMetadataFor, structuredDataFor } from "@/lib/cms/seo/metadata";
import { pageIntroDefaults } from "@/lib/content/pages";

const pages = pageIntroDefaults;
export function generateStaticParams() {
  return Object.keys(pages).map((page) => ({ page }));
}
export async function generateMetadata({ params }: { params: Promise<{ page: string }> }): Promise<Metadata> {
  const { page } = await params;
  return seoMetadataFor(`/${page}`);
}
export default async function InformationPage({ params }: { params: Promise<{ page: string }> }) {
  const { page } = await params;
  if (!pages[page]) {
    await redirectFromCms(`/${page}`);
    notFound();
  }
  const [groups, config, structured] = await Promise.all([
    getPagesContent(page, "about", "shared"),
    getSiteConfig(),
    structuredDataFor(`/${page}`, pages[page].eyebrow),
  ]);
  return <InformationPageContent page={page} groups={groups} config={config} structured={structured} />;
}
