/**
 * The plain-text markup a long-form offence page is written in.
 *
 * Each section of a long-form page is a heading and a body, and the body is
 * written in this markup: ordinary paragraphs, with a few marks for the
 * structure the pages use. It is close to Markdown on purpose, so that John
 * can edit a page in the admin as a document rather than as a stack of form
 * fields:
 *
 *   ### Heading              a sub-heading within the section
 *   #### Title               a smaller heading; the title of a card, step or box
 *   ##### Label              small capitals above a title, e.g. "Mechanical Defect"
 *   ###### Note              small print, e.g. the source under a table
 *   - item                   a bulleted list, one item per line
 *   1. item                  a numbered list
 *   | a | b |                a table; the first row is the header
 *   ::: note … :::           a highlighted box (::: warning for the red one)
 *   ::: cards … :::          a grid of cards, separated by lines of ---
 *   ::: steps … :::          numbered stages, separated by lines of ---
 *
 * and, within any line, **bold**, *italic*, [link text](/services/speeding)
 * and <br> for a line break inside a table cell.
 *
 * Parsing is forgiving by design: the markup is typed by hand, and a missing
 * closing `:::` or a short table row must still produce a readable page rather
 * than an error. What cannot be understood is shown as text.
 *
 * No React and no server-only imports: the renderer, the admin editor's checks
 * and the SEO health checks all read the same parse.
 */

export type InlineNode =
  | { type: "text"; value: string }
  | { type: "strong"; children: InlineNode[] }
  | { type: "em"; children: InlineNode[] }
  | { type: "link"; href: string; children: InlineNode[] }
  | { type: "break" };

export type MarkupBlock =
  | { type: "paragraph"; text: string }
  /** `###` is depth 3 and `####` depth 4; the renderer picks the level. */
  | { type: "heading"; depth: 3 | 4; text: string }
  | { type: "label"; text: string }
  | { type: "small"; text: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "table"; head: string[]; rows: string[][] }
  | { type: "box"; tone: BoxTone; blocks: MarkupBlock[] }
  | { type: "cards"; items: MarkupBlock[][] }
  | { type: "steps"; items: MarkupBlock[][] };

export type BoxTone = "note" | "warning";

const containerKinds = ["cards", "steps", "note", "warning"] as const;
type ContainerKind = (typeof containerKinds)[number];

const fenceOpen = /^:::\s*([a-z]+)\s*$/i;
const fenceClose = /^:::\s*$/;
const itemDivider = /^-{3,}\s*$/;
const headingLine = /^(#{1,6})\s+(.*)$/;
const bulletLine = /^[-*•]\s+(.*)$/;
const numberLine = /^\d+[.)]\s+(.*)$/;
const tableLine = /^\|/;

// ---------------------------------------------------------------------------
// Blocks
// ---------------------------------------------------------------------------

/** Parse one section body. */
export function parseServiceMarkup(source: string): MarkupBlock[] {
  const lines = normaliseLines(source);

  return parseLines(lines, true);
}

function normaliseLines(source: string): string[] {
  // Browsers submit textareas with CRLF line endings.
  return source.replace(/\r\n?/g, "\n").split("\n");
}

function isContainerKind(value: string): value is ContainerKind {
  return (containerKinds as readonly string[]).includes(value);
}

function startsBlock(line: string): boolean {
  return (
    headingLine.test(line) ||
    bulletLine.test(line) ||
    numberLine.test(line) ||
    tableLine.test(line) ||
    fenceOpen.test(line) ||
    fenceClose.test(line)
  );
}

function parseLines(lines: string[], allowContainers: boolean): MarkupBlock[] {
  const blocks: MarkupBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index].trim();

    if (!line) {
      index += 1;
      continue;
    }

    const open = fenceOpen.exec(line);

    if (open) {
      // Collect to the closing fence, or to the end if it was never closed.
      const inner: string[] = [];

      index += 1;

      while (index < lines.length && !fenceClose.test(lines[index].trim())) {
        inner.push(lines[index]);
        index += 1;
      }

      index += 1;

      const kind = open[1].toLowerCase();

      if (!allowContainers) {
        // A container inside a card or box: keep its contents, drop the fence.
        blocks.push(...parseLines(inner, false));
        continue;
      }

      blocks.push(containerBlock(isContainerKind(kind) ? kind : "note", inner));
      continue;
    }

    if (fenceClose.test(line)) {
      // A closing fence with nothing open: someone deleted the opening line.
      index += 1;
      continue;
    }

    const heading = headingLine.exec(line);

    if (heading) {
      const hashes = heading[1].length;
      const text = heading[2].trim();

      if (text) {
        if (hashes === 5) blocks.push({ type: "label", text });
        else if (hashes === 6) blocks.push({ type: "small", text });
        else blocks.push({ type: "heading", depth: hashes === 4 ? 4 : 3, text });
      }

      index += 1;
      continue;
    }

    if (bulletLine.test(line) || numberLine.test(line)) {
      const ordered = !bulletLine.test(line) && numberLine.test(line);
      const pattern = ordered ? numberLine : bulletLine;
      const items: string[] = [];

      while (index < lines.length) {
        const current = lines[index].trim();

        if (!current) break;

        const match = pattern.exec(current);

        if (match) {
          items.push(match[1].trim());
        } else if (startsBlock(current) || itemDivider.test(current)) {
          break;
        } else if (items.length > 0) {
          // A wrapped line belongs to the item above it.
          items[items.length - 1] += ` ${current}`;
        }

        index += 1;
      }

      blocks.push({ type: "list", ordered, items: items.filter(Boolean) });
      continue;
    }

    if (tableLine.test(line)) {
      const rows: string[][] = [];

      while (index < lines.length && tableLine.test(lines[index].trim())) {
        const cells = splitRow(lines[index].trim());

        if (!cells.every((cell) => /^:?-{2,}:?$/.test(cell))) rows.push(cells);

        index += 1;
      }

      const [head = [], ...body] = rows;
      const width = Math.max(head.length, ...body.map((row) => row.length));
      const pad = (row: string[]) => [
        ...row,
        ...Array.from({ length: width - row.length }, () => ""),
      ];

      blocks.push({ type: "table", head: pad(head), rows: body.map(pad) });
      continue;
    }

    if (itemDivider.test(line)) {
      // A divider outside cards or steps separates nothing.
      index += 1;
      continue;
    }

    const paragraph: string[] = [];

    while (index < lines.length) {
      const current = lines[index].trim();

      if (
        !current ||
        (paragraph.length > 0 && (startsBlock(current) || itemDivider.test(current)))
      ) {
        break;
      }

      paragraph.push(current);
      index += 1;
    }

    blocks.push({ type: "paragraph", text: paragraph.join(" ") });
  }

  return blocks;
}

function containerBlock(kind: ContainerKind, inner: string[]): MarkupBlock {
  if (kind === "note" || kind === "warning") {
    return { type: "box", tone: kind, blocks: parseLines(inner, false) };
  }

  const items: string[][] = [[]];

  for (const line of inner) {
    if (itemDivider.test(line.trim())) items.push([]);
    else items[items.length - 1].push(line);
  }

  const parsed = items
    .map((item) => parseLines(item, false))
    .filter((item) => item.length > 0);

  return kind === "cards"
    ? { type: "cards", items: parsed }
    : { type: "steps", items: parsed };
}

/** `| a | b \| c |` → ["a", "b | c"]. Escaped pipes stay in the cell. */
function splitRow(line: string): string[] {
  const cells: string[] = [];
  let current = "";

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];

    if (character === "\\" && index + 1 < line.length) {
      current += character + line[index + 1];
      index += 1;
    } else if (character === "|") {
      cells.push(current);
      current = "";
    } else {
      current += character;
    }
  }

  cells.push(current);

  // The leading and trailing pipes leave an empty cell at each end.
  if (cells.length > 1 && cells[0].trim() === "") cells.shift();
  if (cells.length > 1 && cells[cells.length - 1].trim() === "") cells.pop();

  return cells.map((cell) => cell.trim());
}

// ---------------------------------------------------------------------------
// Inline
// ---------------------------------------------------------------------------

const escapable = new Set(["\\", "*", "[", "]", "|", "#", "-", ":", "_", "<", ">", "(", ")"]);
const lineBreak = /^<br\s*\/?>/i;

/**
 * Whether an address is safe to put in an `href`. A site path, an in-page
 * anchor, a web address, an email or a phone number; nothing that could run
 * script.
 */
export function isSafeHref(href: string): boolean {
  if (/^\/(?!\/)/.test(href) || href.startsWith("#")) return true;

  return /^(https?:\/\/|mailto:|tel:)/i.test(href);
}

/** One line of text as inline nodes. */
export function parseInline(text: string): InlineNode[] {
  return mergeText(parseInlineRange(text, 0, text.length, null).nodes);
}

type Closer = "**" | "*" | "]";

function parseInlineRange(
  text: string,
  start: number,
  end: number,
  closer: Closer | null,
): { nodes: InlineNode[]; next: number; closed: boolean } {
  const nodes: InlineNode[] = [];
  let index = start;
  let buffer = "";

  const flush = () => {
    if (buffer) nodes.push({ type: "text", value: buffer });
    buffer = "";
  };

  while (index < end) {
    const rest = text.slice(index, end);
    const character = text[index];

    if (character === "\\" && index + 1 < end && escapable.has(text[index + 1])) {
      buffer += text[index + 1];
      index += 2;
      continue;
    }

    if (closer && rest.startsWith(closer) && !(closer === "*" && rest.startsWith("**"))) {
      flush();

      return { nodes, next: index + closer.length, closed: true };
    }

    const breakMatch = lineBreak.exec(rest);

    if (breakMatch) {
      flush();
      nodes.push({ type: "break" });
      index += breakMatch[0].length;
      continue;
    }

    if (rest.startsWith("**") && closer !== "**") {
      const inner = parseInlineRange(text, index + 2, end, "**");

      if (inner.closed && inner.nodes.length > 0) {
        flush();
        nodes.push({ type: "strong", children: inner.nodes });
        index = inner.next;
        continue;
      }
    }

    if (character === "*" && !rest.startsWith("**") && closer !== "*") {
      const inner = parseInlineRange(text, index + 1, end, "*");

      if (inner.closed && inner.nodes.length > 0) {
        flush();
        nodes.push({ type: "em", children: inner.nodes });
        index = inner.next;
        continue;
      }
    }

    if (character === "[") {
      const label = parseInlineRange(text, index + 1, end, "]");

      if (label.closed && text[label.next] === "(") {
        const close = closingParenthesis(text, label.next, end);

        if (close !== -1) {
          const href = text.slice(label.next + 1, close).trim();

          flush();

          if (isSafeHref(href)) {
            nodes.push({ type: "link", href, children: label.nodes });
          } else {
            nodes.push(...label.nodes);
          }

          index = close + 1;
          continue;
        }
      }
    }

    buffer += character;
    index += 1;
  }

  flush();

  return { nodes, next: index, closed: false };
}

/**
 * The `)` that closes the `(` at `open`, allowing balanced pairs inside it —
 * addresses such as `/wiki/Act_(1988)` — or -1 if it never closes.
 */
function closingParenthesis(text: string, open: number, end: number): number {
  let depth = 0;

  for (let index = open; index < end; index += 1) {
    if (text[index] === "(") depth += 1;
    else if (text[index] === ")" && --depth === 0) return index;
  }

  return -1;
}

function mergeText(nodes: InlineNode[]): InlineNode[] {
  const merged: InlineNode[] = [];

  for (const node of nodes) {
    const previous = merged[merged.length - 1];

    if (node.type === "text" && previous?.type === "text") {
      merged[merged.length - 1] = { type: "text", value: previous.value + node.value };
    } else if (node.type === "strong" || node.type === "em" || node.type === "link") {
      merged.push({ ...node, children: mergeText(node.children) });
    } else {
      merged.push(node);
    }
  }

  return merged;
}

// ---------------------------------------------------------------------------
// Reading the parse back
// ---------------------------------------------------------------------------

/** The words of a line, without its marks. */
export function inlineText(text: string): string {
  const visit = (nodes: InlineNode[]): string =>
    nodes
      .map((node) => {
        if (node.type === "text") return node.value;
        if (node.type === "break") return " ";

        return visit(node.children);
      })
      .join("");

  return visit(parseInline(text));
}

/** Every line of text in a parse, in reading order and without marks. */
export function markupText(blocks: MarkupBlock[]): string[] {
  return blocks.flatMap((block): string[] => {
    switch (block.type) {
      case "paragraph":
      case "heading":
      case "label":
      case "small":
        return [inlineText(block.text)];
      case "list":
        return block.items.map(inlineText);
      case "table":
        return [...block.head, ...block.rows.flat()].map(inlineText);
      case "box":
        return markupText(block.blocks);
      case "cards":
      case "steps":
        return block.items.flatMap(markupText);
    }
  });
}

/** Every link address in a parse, for the broken-link check. */
export function markupLinks(blocks: MarkupBlock[]): string[] {
  const fromLine = (text: string): string[] => {
    const visit = (nodes: InlineNode[]): string[] =>
      nodes.flatMap((node) => {
        if (node.type === "link") return [node.href, ...visit(node.children)];
        if (node.type === "strong" || node.type === "em") return visit(node.children);

        return [];
      });

    return visit(parseInline(text));
  };

  return blocks.flatMap((block): string[] => {
    switch (block.type) {
      case "paragraph":
      case "heading":
      case "label":
      case "small":
        return fromLine(block.text);
      case "list":
        return block.items.flatMap(fromLine);
      case "table":
        return [...block.head, ...block.rows.flat()].flatMap(fromLine);
      case "box":
        return markupLinks(block.blocks);
      case "cards":
      case "steps":
        return block.items.flatMap(markupLinks);
    }
  });
}
