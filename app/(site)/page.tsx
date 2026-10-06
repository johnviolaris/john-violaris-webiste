import type { Metadata } from "next";
import { HomePageContent } from "@/components/pages/home-page-content";
import { getPagesContent, getSiteConfig } from "@/lib/cms/queries";
import { seoMetadataFor, structuredDataFor } from "@/lib/cms/seo/metadata";

export function generateMetadata(): Promise<Metadata> {
  return seoMetadataFor("/");
}

export default async function HomePage() {
  const config = await getSiteConfig();
  const structured = await structuredDataFor("/", config.name);
  const content = await getPagesContent("home", "about", "fees", "police-station", "services", "shared");
  return <HomePageContent content={content} config={config} structured={structured} />;
}
