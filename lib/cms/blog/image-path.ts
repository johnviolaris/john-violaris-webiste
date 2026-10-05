import { slugify } from "@/lib/slug";

/** Keep a readable basename while removing path/control characters and collisions. */
export function imageUploadPath(folder: string, filename: string, mimeType: string, suffix: string): string {
  const basename = filename.split(/[\\/]/).pop() ?? "";
  const stem = slugify(basename.replace(/\.[^.]*$/, "")).slice(0, 72).replace(/-+$/, "") || "image";
  const extensions: Record<string, string> = {
    "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif",
  };
  const extension = extensions[mimeType];
  if (!extension || !["posts", "share", "site"].includes(folder) || !/^[a-f0-9]{8}$/i.test(suffix)) {
    throw new Error("Invalid image upload path.");
  }
  return `${folder}/${stem}-${suffix.toLowerCase()}.${extension}`;
}
