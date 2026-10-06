import { notFound } from "next/navigation";
import { HomePageContent } from "@/components/pages/home-page-content";
import { InformationPageContent } from "@/components/pages/information-page-content";
import { getSectionDraftPreview } from "@/lib/cms/sections/draft-queries";
import { getSiteConfig } from "@/lib/cms/queries";

export default async function PreviewStaticPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ path?: string; revision?: string }> }) {
  const { id } = await params;
  const { path, revision } = await searchParams;
  const preview = await getSectionDraftPreview(id, path, revision);
  if (!preview) notFound();
  const config = await getSiteConfig();
  return <>
    <p role="status" className="bg-gold px-4 py-3 text-center text-sm">
      {preview.historical ? "Historical section version." : "Saved section draft."} This section is shown on {preview.path} with current live surrounding content and current image-library descriptions. Other drafts and unsaved edits are not shown.
      {preview.path === "/contact" ? " The enquiry form is disabled in this private preview." : ""}
    </p>
    {preview.path === "/" ? <HomePageContent content={preview.groups} config={config} /> :
      <InformationPageContent page={preview.path.slice(1)} groups={preview.groups} config={config} preview />}
  </>;
}
