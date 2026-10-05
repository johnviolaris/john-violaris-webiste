export type CaptionFormat = "plain" | "markdown";
export type CaptionNode =
  | { type: "text"; text: string }
  | { type: "strong" | "em"; children: CaptionNode[] }
  | { type: "link"; href: string; children: CaptionNode[] };

/** Captions deliberately support only emphasis and ordinary web links. */
export function safeCaptionHref(value: string): string | null {
  if (!value || /[\s\\<>"'\u0000-\u001f\u007f]/.test(value)) return null;
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  if (/^#[a-z0-9_-]+$/i.test(value)) return value;
  if (!/^https?:\/\//i.test(value)) return null;
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) return null;
    return url.href;
  } catch { return null; }
}

export function parseImageCaption(caption: string, format: unknown = "plain"): { nodes: CaptionNode[]; invalidLinks: boolean } {
  if (format !== "markdown") return { nodes: [{ type: "text", text: caption }], invalidLinks: false };
  let invalidLinks = false;
  function inline(text: string, depth = 0, links = true): CaptionNode[] {
    // Bound nesting and input work; malformed syntax always remains escaped text.
    if (depth >= 4) return [{ type: "text", text }];
    const nodes: CaptionNode[] = [];
    let buffer = "";
    const flush = () => { if (buffer) { nodes.push({ type: "text", text: buffer }); buffer = ""; } };
    for (let index = 0; index < text.length;) {
      if (text[index] === "\\" && /[\\*\[\]()]/.test(text[index + 1] ?? "")) {
        buffer += text[index + 1]; index += 2; continue;
      }
      if (links && text[index] === "[" && text[index - 1] !== "!") {
        const labelEnd = text.indexOf("](", index + 1);
        const targetEnd = labelEnd < 0 ? -1 : text.indexOf(")", labelEnd + 2);
        if (labelEnd > index + 1 && targetEnd >= 0) {
          const label = text.slice(index + 1, labelEnd);
          const href = safeCaptionHref(text.slice(labelEnd + 2, targetEnd));
          if (href && !label.includes("[")) {
            flush(); nodes.push({ type: "link", href, children: inline(label, depth + 1, false) });
          } else {
            invalidLinks = true; buffer += text.slice(index, targetEnd + 1);
          }
          index = targetEnd + 1; continue;
        }
      }
      if (text[index] === "*") {
        const delimiter = text.startsWith("**", index) ? "**" : "*";
        let end = text.indexOf(delimiter, index + delimiter.length);
        // A lone * does not consume either half of a ** marker.
        while (delimiter === "*" && end >= 0 && (text[end - 1] === "*" || text[end + 1] === "*")) end = text.indexOf("*", end + 1);
        if (end > index + delimiter.length) {
          flush(); nodes.push({ type: delimiter === "**" ? "strong" : "em", children: inline(text.slice(index + delimiter.length, end), depth + 1, links) });
          index = end + delimiter.length; continue;
        }
      }
      buffer += text[index]; index += 1;
    }
    flush(); return nodes;
  }
  const nodes = inline(caption);
  return { nodes, invalidLinks };
}

export function validateCaption(caption: string, format: unknown = "plain"): string | null {
  if (format !== "plain" && format !== "markdown") return "Choose plain text or simple caption formatting.";
  if (caption.length > 1000) return "Keep the caption within 1,000 characters, including formatting.";
  if (format === "markdown" && parseImageCaption(caption, format).invalidLinks) return "Caption links must use an ordinary http/https URL, a site path or an anchor, without spaces or sign-in credentials.";
  return null;
}
