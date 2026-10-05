import { imageUploadPath } from "@/lib/cms/blog/image-path";
import { validateCaption, type CaptionFormat } from "@/lib/cms/media/caption";

export type MediaAsset = {
  id: string; url: string; storage_path: string | null; filename: string;
  mime_type: string; width: number; height: number; alt_text: string;
  is_decorative: boolean; title: string; caption: string; caption_format?: CaptionFormat;
};
export const maxMediaImageBytes = 4 * 1024 * 1024;
export type ImageMetadata = Pick<MediaAsset, "alt_text" | "is_decorative" | "title" | "caption" | "caption_format">;
export function validateImageMetadata(value: ImageMetadata): string | null {
  if (!value.is_decorative && !value.alt_text.trim()) return "Describe this image or explicitly mark it as decorative.";
  if (value.alt_text.length > 200 || value.title.length > 160 || value.caption.length > 1000) return "Use at most 200 characters for alt text, 160 for the title and 1,000 for the caption.";
  return validateCaption(value.caption, value.caption_format ?? "plain");
}
export function uploadFilename(original: string, requested: string, folder: string, mime: string, suffix: string): string {
  if (requested && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(requested)) throw new Error("Use lowercase letters, numbers and single hyphens for the filename, without an extension.");
  if (requested.length > 72) throw new Error("Keep the filename within 72 characters.");
  return imageUploadPath(folder, requested ? `${requested}.image` : original, mime, suffix);
}
export function shareImageWarning(width: number, height: number): string | null {
  return width < 1200 || height < 630 ? `This image is ${width}×${height}. Share images should be at least 1200×630.` : null;
}
/** Library descriptions apply everywhere a registered URL is used. */
export function mediaPresentation(asset: ImageMetadata) {
  return { alt: asset.is_decorative ? "" : asset.alt_text, title: asset.title || undefined, caption: asset.caption || undefined, captionFormat: asset.caption_format ?? "plain" };
}
