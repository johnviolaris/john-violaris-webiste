import { createElement, Fragment, type ReactNode } from "react";
import { parseImageCaption, type CaptionNode } from "@/lib/cms/media/caption";

function renderNodes(nodes: CaptionNode[]): ReactNode[] {
  return nodes.map((node, index) => {
    if (node.type === "text") return node.text;
    if (node.type === "link") return createElement("a", { key: index, href: node.href, className: "underline underline-offset-2", rel: "noopener noreferrer" }, renderNodes(node.children));
    return createElement(node.type, { key: index }, renderNodes(node.children));
  });
}

/** React escapes all text; HTML, image embeds and scripts are never interpreted. */
export function ImageCaption({ caption, format }: { caption: string; format?: unknown }) {
  return createElement(Fragment, null, renderNodes(parseImageCaption(caption, format).nodes));
}
