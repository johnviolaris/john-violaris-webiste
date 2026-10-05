import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getMediaAsset } from "@/lib/cms/media/queries";
import { MediaMetadataForm } from "@/components/admin/media-form";
import { RevisionHistory } from "@/components/admin/revision-history";
export const metadata = { title: "Image descriptions" };
export default async function EditMediaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const asset = await getMediaAsset(id); if (!asset) notFound();
  return <div className="mx-auto max-w-3xl px-4 pt-14 pb-12 md:px-8 md:pt-10"><Link href="/admin/media" className="text-sm underline">All images</Link><h1 className="mt-3 break-all font-display text-xl font-semibold">{asset.filename}</h1><div className="relative mt-5 h-72"><Image src={asset.url} alt="" fill sizes="700px" className="object-contain" unoptimized /></div><p className="mt-2 text-sm text-muted-foreground">{asset.width}×{asset.height}. Upload a new file to change the served filename; the existing URL remains available, so published references keep working.</p><MediaMetadataForm asset={asset} /><RevisionHistory entity="media_assets" id={id} /></div>;
}
