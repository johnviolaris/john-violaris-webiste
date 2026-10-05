"use client";

import { ImageCaption } from "@/components/ui/image-caption";
import { Textarea } from "@/components/ui/textarea";
import { validateCaption, type CaptionFormat } from "@/lib/cms/media/caption";

export function ImageCaptionField({ id, caption, format, onCaptionChange, onFormatChange, named = false }: {
  id: string; caption: string; format: CaptionFormat; onCaptionChange: (value: string) => void;
  onFormatChange: (value: CaptionFormat) => void; named?: boolean;
}) {
  const invalid = validateCaption(caption, format);
  return <div className="space-y-2">
    <label htmlFor={id} className="block text-sm font-medium">Optional visible caption or credit</label>
    <Textarea id={id} name={named ? "imageCaption" : undefined} value={caption} onChange={(event) => onCaptionChange(event.target.value)} maxLength={1000} rows={3} aria-describedby={`${id}-help`} />
    <label htmlFor={`${id}-format`} className="block text-sm">Caption format</label>
    <select id={`${id}-format`} name={named ? "captionFormat" : undefined} value={format} onChange={(event) => onFormatChange(event.target.value as CaptionFormat)} className="w-full rounded border bg-background px-3 py-2 text-sm">
      <option value="plain">Plain text</option>
      <option value="markdown">Simple formatting: bold, italic and links</option>
    </select>
    <p id={`${id}-help`} className="text-xs text-muted-foreground">{format === "markdown" ? "Use **bold**, *italic* and [credit label](https://example.com). HTML, images and scripts are displayed as text. Escape a formatting marker with a backslash." : "Existing captions stay literal plain text. Choose simple formatting to add bold, italic or a web link."}</p>
    {invalid && <p role="alert" className="text-xs text-destructive">{invalid}</p>}
    {caption && <div className="rounded border bg-muted/30 p-3 text-sm"><p className="mb-1 text-xs text-muted-foreground">Caption preview</p><p className="whitespace-pre-wrap"><ImageCaption caption={caption} format={format} /></p></div>}
  </div>;
}
