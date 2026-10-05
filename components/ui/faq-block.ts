import { createElement } from "react";
import { ImageCaption } from "@/components/ui/image-caption";
import { resolveFaqItems, faqSectionId } from "@/lib/cms/faq";

/** Shared by public pages and authenticated previews. No FAQ is invented for empty data. */
export function FaqBlock({ items, id = faqSectionId() }: { items: unknown; id?: string }) {
  const questions = resolveFaqItems(items);
  if (!questions.length) return null;
  return createElement("section", { id, "aria-labelledby": `${id}-heading`, className: "mt-10" },
    createElement("h2", { id: `${id}-heading`, className: "service-section-heading" }, "Frequently asked questions"),
    ...questions.map((item, index) => createElement("details", { key: index, className: "border-b border-line py-4" },
      createElement("summary", { className: "cursor-pointer font-semibold" }, item.question),
      createElement("div", { className: "mt-3 whitespace-pre-wrap" }, createElement(ImageCaption, { caption: item.answer, format: "markdown" })),
    )),
  );
}
