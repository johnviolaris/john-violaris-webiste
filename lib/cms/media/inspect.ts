import sharp from "sharp";
/** Decode actual bytes, rather than trusting the browser-provided MIME label. */
export async function inspectImage(bytes: Buffer, mimeType: string) {
  const formats: Record<string, string> = { "image/jpeg": "jpeg", "image/png": "png", "image/webp": "webp", "image/avif": "heif" };
  const decoded = await sharp(bytes, { limitInputPixels: 40_000_000 }).metadata();
  if (!formats[mimeType] || decoded.format !== formats[mimeType] || !decoded.width || !decoded.height || decoded.width > 20000 || decoded.height > 20000 || decoded.width * decoded.height > 40_000_000 || (decoded.pages ?? 1) > 1) throw new Error("Unsupported image");
  // Metadata alone can accept a header with a corrupt/truncated pixel payload.
  await sharp(bytes, { limitInputPixels: 40_000_000 }).resize(1, 1).raw().toBuffer();
  return { width: decoded.width, height: decoded.height };
}
