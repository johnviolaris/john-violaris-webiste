"use client";
import { useActionState, useState } from "react";
import { ImageField } from "@/components/admin/image-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageCaptionField } from "@/components/admin/image-caption-field";
import type { CaptionFormat } from "@/lib/cms/media/caption";
import { saveMediaMetadata } from "@/lib/cms/media/actions";
import type { MediaAsset } from "@/lib/cms/media/schema";

export function MediaUpload() {
  const [url, setUrl] = useState("");
  return <ImageField name="uploadedImage" value={url} onChange={setUrl} folder="site" />;
}
export function MediaMetadataForm({ asset }: { asset: MediaAsset }) {
  const [state, action, pending] = useActionState(saveMediaMetadata, { message: "", ok: false });
  const [decorative, setDecorative] = useState(asset.is_decorative);
  const [caption, setCaption] = useState(asset.caption);
  const [captionFormat, setCaptionFormat] = useState<CaptionFormat>(asset.caption_format ?? "plain");
  return <form action={action} className="mt-6 space-y-4">
    <input type="hidden" name="id" value={asset.id} />
    <label htmlFor="altText" className="block text-sm font-medium">Alt text<Input id="altText" name="altText" defaultValue={asset.alt_text} maxLength={200} required={!decorative} disabled={decorative} /></label>
    <label className="flex gap-2 text-sm"><input name="isDecorative" type="checkbox" checked={decorative} onChange={(event) => setDecorative(event.target.checked)} />Decorative image: render an empty alt attribute</label>
    <label htmlFor="imageTitle" className="block text-sm font-medium">Image title<Input id="imageTitle" name="imageTitle" defaultValue={asset.title} maxLength={160} /></label>
    <ImageCaptionField id="imageCaption" caption={caption} format={captionFormat} onCaptionChange={setCaption} onFormatChange={setCaptionFormat} named />
    <p className="text-xs text-muted-foreground">These descriptions apply to article and home portrait uses of this URL. Share-image titles and descriptions remain editable under SEO.</p>
    <Button disabled={pending}>{pending ? "Saving…" : "Save image descriptions"}</Button>
    {state.message && <p role={state.ok ? "status" : "alert"} className="text-sm">{state.message}</p>}
  </form>;
}
