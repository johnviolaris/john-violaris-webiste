import Image from "next/image";
import Link from "next/link";
import { listMediaAssets } from "@/lib/cms/media/queries";
import { MediaUpload } from "@/components/admin/media-form";
export const metadata = { title: "Media library" };
export default async function MediaLibraryPage() {
  const { assets, available } = await listMediaAssets();
  return <div className="mx-auto max-w-5xl px-4 pt-14 pb-12 md:px-8 md:pt-10"><h1 className="font-display text-2xl font-semibold">Media library</h1><p className="mt-2 mb-6 text-sm text-muted-foreground">Upload once, reuse from every image picker, and manage descriptions in one place. Served URLs stay stable when descriptions change.</p>
    {!available ? <p role="status">Install the local media-library migration before using this editor.</p> : <><MediaUpload /><ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{assets.map((asset) => <li key={asset.id} className="rounded-xl border p-3"><div className="relative h-40"><Image src={asset.url} alt="" fill sizes="300px" className="object-contain" unoptimized /></div><Link href={`/admin/media/${asset.id}`} className="mt-3 block break-all font-medium underline underline-offset-4">{asset.filename}</Link><p className="mt-1 text-xs text-muted-foreground">{asset.width}×{asset.height} · {asset.is_decorative ? "Decorative" : asset.alt_text}</p></li>)}</ul></>}
  </div>;
}
