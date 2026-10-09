import Link from "next/link";
import type { ReactNode } from "react";

import { Icon } from "@/components/ui/icons";
import {
  markupText,
  parseInline,
  parseServiceMarkup,
  type InlineNode,
  type MarkupBlock,
} from "@/lib/content/service-markup";

/**
 * One section body of a long-form offence page, in the site's own styles.
 *
 * The markup and its parse live in `lib/content/service-markup.ts`; this is
 * only how each block looks. It renders on the server and ships no script.
 *
 * Headings start beneath the section's own `h2`. A `###` is always an `h3`;
 * a `####` — the title of a card, a step or a box, or a smaller heading — is
 * an `h4` once the section has had an `h3`, and an `h3` before then. That
 * keeps the outline free of skipped levels whichever marks were used.
 */
export function ServiceMarkup({ source, label }: { source: string; label: string }) {
  const context: RenderContext = { hasSubheading: false, label };

  return <>{renderBlocks(parseServiceMarkup(source), context)}</>;
}

/** A single line of the markup — bold, italic, links — for the lead and the boxes. */
export function InlineMarkup({ text }: { text: string }) {
  return <>{renderInline(parseInline(text))}</>;
}

type RenderContext = {
  /** Whether this section has had an `h3` yet. */
  hasSubheading: boolean;
  /** The section's heading, which names its tables for assistive technology. */
  label: string;
};

function renderBlocks(blocks: MarkupBlock[], context: RenderContext): ReactNode[] {
  return blocks.map((block, index) => renderBlock(block, context, index));
}

function renderBlock(block: MarkupBlock, context: RenderContext, key: number): ReactNode {
  switch (block.type) {
    case "paragraph":
      return <p key={key}>{renderInline(parseInline(block.text))}</p>;

    case "heading": {
      const content = renderInline(parseInline(block.text));

      if (block.depth === 3) {
        context.hasSubheading = true;

        return (
          <h3 key={key} className="sp-h3">
            {content}
          </h3>
        );
      }

      return context.hasSubheading ? (
        <h4 key={key} className="sp-h4">
          {content}
        </h4>
      ) : (
        <h3 key={key} className="sp-h4">
          {content}
        </h3>
      );
    }

    case "label":
      return (
        <p key={key} className="sp-label">
          {renderInline(parseInline(block.text))}
        </p>
      );

    case "small":
      return (
        <p key={key} className="sp-small">
          {renderInline(parseInline(block.text))}
        </p>
      );

    case "list": {
      const items = block.items.map((item, index) => (
        <li key={index}>{renderInline(parseInline(item))}</li>
      ));

      return block.ordered ? (
        <ol key={key} className="sp-list sp-list--ordered" role="list">
          {items}
        </ol>
      ) : (
        <ul key={key} className="sp-list" role="list">
          {items}
        </ul>
      );
    }

    case "table":
      return (
        <div
          key={key}
          className="sp-table-wrap"
          role="region"
          aria-label={`${context.label} — table`}
          tabIndex={0}
        >
          <table className="sp-table">
            <thead>
              <tr>
                {block.head.map((cell, index) => (
                  <th key={index} scope="col">
                    {renderInline(parseInline(cell))}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, index) => (
                    <td key={index}>{renderInline(parseInline(cell))}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case "box":
      return (
        <div key={key} className={`sp-box sp-box--${block.tone}`} role="note">
          <Icon
            name={block.tone === "warning" ? "alert" : "bulb"}
            size={18}
            className="sp-box-icon"
          />
          <div className="sp-box-body">{renderBlocks(block.blocks, context)}</div>
        </div>
      );

    case "cards":
      return (
        <ul key={key} className={`sp-cards sp-cards--${cardColumns(block.items)}`} role="list">
          {block.items.map((item, index) => (
            <li key={index} className="sp-card">
              {renderBlocks(item, context)}
            </li>
          ))}
        </ul>
      );

    case "steps":
      return (
        <ol key={key} className="sp-steps" role="list">
          {block.items.map((item, index) => (
            <li key={index} className="sp-step">
              <span className="sp-step-number" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="sp-step-body">{renderBlocks(item, context)}</div>
            </li>
          ))}
        </ol>
      );
  }
}

/**
 * How many columns a set of cards can take in the text column.
 *
 * Short cards sit three abreast when they come in threes; cards carrying
 * whole paragraphs need the full measure to stay readable.
 */
function cardColumns(items: MarkupBlock[][]): 1 | 2 | 3 {
  const words = items.map(
    (item) => markupText(item).join(" ").split(/\s+/).filter(Boolean).length,
  );
  const longest = Math.max(0, ...words);

  if (items.length === 1 || longest > 130) return 1;
  if (items.length % 3 === 0 && longest <= 55) return 3;

  return 2;
}

function renderInline(nodes: InlineNode[]): ReactNode[] {
  return nodes.map((node, index) => {
    switch (node.type) {
      case "text":
        return node.value;
      case "break":
        return <br key={index} />;
      case "strong":
        return <strong key={index}>{renderInline(node.children)}</strong>;
      case "em":
        return <em key={index}>{renderInline(node.children)}</em>;
      case "link": {
        const children = renderInline(node.children);

        if (node.href.startsWith("/") || node.href.startsWith("#")) {
          return (
            <Link key={index} href={node.href} className="sp-link">
              {children}
            </Link>
          );
        }

        const external = /^https?:/i.test(node.href);

        return (
          <a
            key={index}
            href={node.href}
            className="sp-link"
            {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          >
            {children}
          </a>
        );
      }
    }
  });
}
