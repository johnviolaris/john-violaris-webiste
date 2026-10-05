import { parseImageCaption, type CaptionNode } from "@/lib/cms/media/caption";

/** Optional CMS FAQs use a small rich-text subset: emphasis and safe web links. */
export type FaqItem = { question: string; answer: string };
export const faqLimits = { items: 20, question: 240, answer: 4000 } as const;
export const faqCountField = "faqCount";
export const faqRepairField = "replaceInvalidFaqs";
export const faqField = (index: number, part: keyof FaqItem) => `faq.${index}.${part}`;
export type FaqResult = { ok: true; items: FaqItem[] } | { ok: false; error: string };

/** A missing legacy field is empty. Explicit malformed data must never be silently saved. */
export function validateFaqItems(value: unknown): FaqResult {
  if (value === undefined) return { ok: true, items: [] };
  if (!Array.isArray(value) || value.length > faqLimits.items) return { ok: false, error: `Use an FAQ list of up to ${faqLimits.items} questions.` };
  const items: FaqItem[] = [];
  const questions = new Set<string>();
  for (const [index, item] of value.entries()) {
    if (!item || typeof item !== "object" || Array.isArray(item) || Object.keys(item).some((key) => !["question", "answer"].includes(key)) || typeof item.question !== "string" || typeof item.answer !== "string") {
      return { ok: false, error: `FAQ ${index + 1} needs a text question and answer.` };
    }
    const question = item.question.trim();
    const answer = item.answer.trim();
    if (!question || !answer) return { ok: false, error: `Complete both parts of FAQ ${index + 1}, or remove it.` };
    if (question.length > faqLimits.question || answer.length > faqLimits.answer) return { ok: false, error: `FAQ ${index + 1} exceeds the ${faqLimits.question}-character question or ${faqLimits.answer.toLocaleString("en-GB")}-character answer limit.` };
    const key = question.replace(/\s+/g, " ").toLocaleLowerCase("en-GB");
    if (questions.has(key)) return { ok: false, error: `FAQ ${index + 1} repeats a question. Keep each question once.` };
    questions.add(key);
    if (parseImageCaption(answer, "markdown").invalidLinks) return { ok: false, error: `FAQ ${index + 1} contains an unsafe link. Use an ordinary http/https URL, site path or anchor without credentials or spaces.` };
    if (!faqAnswerText(answer).trim()) return { ok: false, error: `FAQ ${index + 1} needs visible answer text, beyond formatting.` };
    items.push({ question, answer });
  }
  return { ok: true, items };
}

/** Older clients preserve saved FAQs; an explicit zero removes them. No truncation. */
export function readFaqItems(form: FormData, previous?: unknown): FaqResult {
  const saved = validateFaqItems(previous);
  if (!saved.ok && form.get(faqRepairField) !== "on") return { ok: false, error: "Saved FAQs are invalid. Confirm their replacement in the FAQ editor before clearing or repairing them." };
  if (!form.has(faqCountField)) return validateFaqItems(previous);
  const declared = form.get(faqCountField);
  if (typeof declared !== "string" || !/^(?:0|[1-9]\d*)$/.test(declared) || Number(declared) > faqLimits.items) return { ok: false, error: `Use up to ${faqLimits.items} FAQ rows.` };
  const items: FaqItem[] = [];
  for (let index = 0; index < Number(declared); index += 1) {
    const question = form.get(faqField(index, "question"));
    const answer = form.get(faqField(index, "answer"));
    if (typeof question !== "string" || typeof answer !== "string") return { ok: false, error: `FAQ ${index + 1} could not be read. Reload the editor before saving.` };
    if (!question.trim() && !answer.trim()) continue;
    items.push({ question, answer });
  }
  return validateFaqItems(items);
}

/** Public rendering fails closed for manually stored or historic malformed data. */
export function resolveFaqItems(value: unknown): FaqItem[] {
  const result = validateFaqItems(value);
  return result.ok ? result.items : [];
}

function nodeText(nodes: CaptionNode[]): string {
  return nodes.map((node) => node.type === "text" ? node.text : nodeText(node.children)).join("");
}

/** The schema answer is precisely the visible rich-text content, without markup/URLs. */
export function faqAnswerText(answer: string): string {
  return nodeText(parseImageCaption(answer, "markdown").nodes);
}

export function faqSectionId(usedIds: string[] = []): string {
  const base = "frequently-asked-questions";
  let id = base;
  for (let suffix = 2; usedIds.includes(id) || usedIds.includes(`${id}-heading`); suffix += 1) id = `${base}-${suffix}`;
  return id;
}
