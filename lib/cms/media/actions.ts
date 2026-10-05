"use server";
import { revalidatePath } from "next/cache";
import { createAuthorizedAdminClient } from "@/lib/auth";
import { maxMediaImageBytes, uploadFilename, validateImageMetadata, type ImageMetadata, type MediaAsset } from "@/lib/cms/media/schema";
import { listMediaAssets } from "@/lib/cms/media/queries";
import { inspectImage } from "@/lib/cms/media/inspect";

type Result = { ok: true; url: string; width: number; height: number } | { ok: false; error: string };
function metadataFrom(form: FormData): ImageMetadata {
  const read = (key: string) => typeof form.get(key) === "string" ? String(form.get(key)).trim() : "";
  return { alt_text: read("altText"), is_decorative: form.get("isDecorative") === "on", title: read("imageTitle"), caption: read("imageCaption"), caption_format: (read("captionFormat") || "plain") as ImageMetadata["caption_format"] };
}
export async function chooseMediaAssets(): Promise<MediaAsset[]> {
  return (await listMediaAssets()).assets;
}
export async function uploadMediaImage(form: FormData): Promise<Result> {
  const client = await createAuthorizedAdminClient();
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Choose an image to upload." };
  if (file.size > maxMediaImageBytes) return { ok: false, error: "That image is over 4 MB. Please resize it and try again." };
  const formats: Record<string, string> = { "image/jpeg": "jpeg", "image/png": "png", "image/webp": "webp", "image/avif": "heif" };
  if (!formats[file.type]) return { ok: false, error: "Images must be JPEG, PNG, WebP or AVIF." };
  const values = metadataFrom(form);
  const invalid = validateImageMetadata(values);
  if (invalid) return { ok: false, error: invalid };
  let path: string;
  try { path = uploadFilename(file.name, String(form.get("filename") ?? ""), String(form.get("folder") ?? "posts"), file.type, crypto.randomUUID().slice(0, 8)); }
  catch (error) { return { ok: false, error: error instanceof Error ? error.message : "Check the filename." }; }
  let width: number; let height: number;
  const bytes = Buffer.from(await file.arrayBuffer());
  try {
    const decoded = await inspectImage(bytes, file.type);
    width = decoded.width; height = decoded.height;
  } catch { return { ok: false, error: "The image could not be decoded, has too many pixels, or does not match its file type. Use a still JPEG, PNG, WebP or AVIF image." }; }
  // Fail before storing an orphan when the media migration is not installed.
  const { error: readiness } = await client.from("media_assets").select("id,caption_format").limit(1);
  if (readiness) return { ok: false, error: "Install the media-library and caption migrations before uploading images." };
  const { error } = await client.storage.from("blog-images").upload(path, bytes, { contentType: file.type, upsert: false });
  if (error) return { ok: false, error: "The image could not be uploaded. Please try again." };
  const { data } = client.storage.from("blog-images").getPublicUrl(path);
  const { error: saved } = await client.from("media_assets").insert({ url: data.publicUrl, storage_path: path, filename: path.split("/").pop(), mime_type: file.type, width, height, ...values });
  if (saved) {
    await client.storage.from("blog-images").remove([path]);
    return { ok: false, error: "The image description could not be saved. Please try again." };
  }
  revalidatePath("/admin/media");
  return { ok: true, url: data.publicUrl, width, height };
}
export async function saveMediaMetadata(_previous: { message: string; ok: boolean }, form: FormData) {
  const client = await createAuthorizedAdminClient();
  const id = form.get("id");
  if (typeof id !== "string" || !/^[0-9a-f-]{36}$/i.test(id)) return { ok: false, message: "Reload this image before saving." };
  const values = metadataFrom(form);
  const invalid = validateImageMetadata(values);
  if (invalid) return { ok: false, message: invalid };
  const { data, error } = await client.from("media_assets").update(values).eq("id", id).select("id").maybeSingle();
  if (error || !data) return { ok: false, message: "The image description could not be saved." };
  revalidatePath("/", "layout"); revalidatePath("/sitemap.xml"); revalidatePath("/admin/media"); revalidatePath(`/admin/media/${id}`);
  return { ok: true, message: "Image descriptions saved. Every use of this image will refresh." };
}
