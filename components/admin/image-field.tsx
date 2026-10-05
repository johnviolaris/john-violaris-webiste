"use client";

import Image from "next/image";
import { useId, useRef, useState, useTransition } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { chooseMediaAssets, uploadMediaImage } from "@/lib/cms/media/actions";
import { maxMediaImageBytes, shareImageWarning, type MediaAsset } from "@/lib/cms/media/schema";
import { Input } from "@/components/ui/input";
import { ImageCaptionField } from "@/components/admin/image-caption-field";
import type { CaptionFormat } from "@/lib/cms/media/caption";
import Link from "next/link";

/**
 * Choose, upload and preview an image — an article's featured image, or a
 * page's share image under SEO Metadata.
 *
 * The upload happens as soon as a file is chosen rather than on save, so the
 * preview is of the real stored object and the URL is already in the form by
 * the time the article is submitted. What the form carries is that URL, in a
 * hidden input — the file itself never rides along with the article save.
 *
 * The value is lifted, not local: the alt-text field beside this one is
 * required whenever an image is set, and the form needs to know.
 */
export function ImageField({
  name,
  value,
  onChange,
  describedBy,
  folder = "posts",
  canManageMedia = true,
}: {
  name: string;
  value: string;
  onChange: (url: string) => void;
  describedBy?: string;
  /**
   * Where the upload is stored: article images, pages' share images, or
   * images in the site's own sections, such as the hero portrait.
   */
  folder?: "posts" | "share" | "site";
  canManageMedia?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const id = useId();
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [filename, setFilename] = useState("");
  const [alt, setAlt] = useState("");
  const [decorative, setDecorative] = useState(false);
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [captionFormat, setCaptionFormat] = useState<CaptionFormat>("plain");
  const [assets, setAssets] = useState<MediaAsset[] | null>(null);
  const [pending, startTransition] = useTransition();

  function choose(file: File | undefined) {
    if (!file) return;

    setError(null);
    if (file.size > maxMediaImageBytes) {
      setError("That image is over 4 MB. Please resize it before uploading.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);
      formData.append("filename", filename);
      formData.append("altText", alt);
      formData.append("isDecorative", decorative ? "on" : "");
      formData.append("imageTitle", title);
      formData.append("imageCaption", caption);
      formData.append("captionFormat", captionFormat);

      const result = await uploadMediaImage(formData);

      if (result.ok) {
        onChange(result.url);
        setWarning(folder === "share" ? shareImageWarning(result.width, result.height) : null);
      } else {
        setError(result.error);
      }

      // Clearing the input is what lets the same file be chosen again after a
      // failure; a file input fires no change event for an unchanged value.
      if (inputRef.current) inputRef.current.value = "";
    });
  }

  return (
    <div>
      <input type="hidden" name={name} value={value} />

      {value ? (
        <div className="flex flex-wrap items-start gap-4">
          <div className="relative h-24 w-40 shrink-0 overflow-hidden rounded-lg border bg-muted">
            <Image
              src={value}
              alt=""
              fill
              sizes="160px"
              className="object-cover"
              // The preview is decorative here: the real description lives in
              // the alt-text field beside it, which is what gets published.
              unoptimized
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onChange("")}
          >
            <X aria-hidden="true" />
            Remove image
          </Button>
        </div>
      ) : null}

      {!canManageMedia && <label htmlFor={`${id}-url`} className="mt-3 block text-sm">Image URL<Input id={`${id}-url`} value={value} onChange={(event) => onChange(event.target.value)} maxLength={500} /><span className="mt-1 block text-xs text-muted-foreground">An administrator manages uploads and the media library. You may use an existing image URL in this SEO field.</span></label>}
      {canManageMedia && <details className="mt-3 rounded-lg border p-3">
        <summary className="cursor-pointer text-sm font-medium">Upload an image</summary>
        <div className="mt-3 space-y-3">
          <p className="text-xs text-muted-foreground">JPEG, PNG, WebP or AVIF, up to 4 MB. Images are publicly accessible to anyone with their URL. Upload website imagery only; never confidential case documents.</p>
          <label htmlFor={`${id}-filename`} className="block text-sm">Served filename <Input id={`${id}-filename`} value={filename} onChange={(event) => setFilename(event.target.value)} maxLength={72} placeholder="drink-driving-guide" /></label>
          <p className="text-xs text-muted-foreground">Optional. Lowercase words with hyphens, without an extension. Otherwise the original filename is cleaned. A short random suffix prevents overwriting another image.</p>
          <label htmlFor={`${id}-alt`} className="block text-sm">Image description <Input id={`${id}-alt`} value={alt} onChange={(event) => setAlt(event.target.value)} maxLength={200} disabled={decorative} /></label>
          <label className="flex gap-2 text-sm"><input type="checkbox" checked={decorative} onChange={(event) => setDecorative(event.target.checked)} />Decorative image (empty alt text)</label>
          <label htmlFor={`${id}-title`} className="block text-sm">Optional image title <Input id={`${id}-title`} value={title} onChange={(event) => setTitle(event.target.value)} maxLength={160} /></label>
          <ImageCaptionField id={`${id}-caption`} caption={caption} format={captionFormat} onCaptionChange={setCaption} onFormatChange={setCaptionFormat} />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() => inputRef.current?.click()}
        >
          {pending ? (
            <Loader2 className="animate-spin" aria-hidden="true" />
          ) : (
            <ImagePlus aria-hidden="true" />
          )}
          {pending ? "Uploading…" : "Choose file and upload"}
        </Button>
        </div>
      </details>}
      {canManageMedia && <div className="mt-3 flex gap-3 text-sm">
        <Button type="button" variant="outline" size="sm" disabled={pending} onClick={() => startTransition(async () => setAssets(await chooseMediaAssets()))}>Choose from library</Button>
        <Link href="/admin/media" className="self-center underline underline-offset-4">Manage images</Link>
      </div>}
      {assets && <div className="mt-3 max-h-72 overflow-auto rounded-lg border p-3">
        <p className="mb-2 text-xs text-muted-foreground">Library descriptions apply everywhere this image is used.</p>
        {assets.length === 0 ? <p className="text-sm">No images are available. Install the media migration, then upload an image.</p> : <ul className="space-y-2">{assets.map((asset) => <li key={asset.id}><button type="button" className="w-full rounded border p-2 text-left text-sm hover:bg-muted" onClick={() => { onChange(asset.url); setWarning(folder === "share" ? shareImageWarning(asset.width, asset.height) : null); setAssets(null); }}>{asset.filename} <span className="text-muted-foreground">· {asset.width}×{asset.height}</span></button></li>)}</ul>}
        <Button type="button" variant="ghost" size="sm" onClick={() => setAssets(null)}>Close library</Button>
      </div>}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="sr-only"
        aria-describedby={describedBy}
        tabIndex={-1}
        onChange={(event) => choose(event.target.files?.[0])}
      />

      {error ? (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {warning && <p role="status" className="mt-2 text-sm text-amber-700">{warning}</p>}
    </div>
  );
}
