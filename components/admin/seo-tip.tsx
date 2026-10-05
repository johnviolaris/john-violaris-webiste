import { Search } from "lucide-react";

import { cn } from "cn";

/**
 * Search guidance, set apart from the plain hints around it.
 *
 * A hint says what a field is; this says how to write it for Google, so it
 * gets its own mark and tint and reads as a different kind of note. The words
 * themselves mostly come from `lib/cms/seo-tips.ts`.
 *
 * `field` is the one-line tip under a single control. `section` is the
 * slightly larger note opening a section or page, about the whole of it.
 */
export function SeoTip({
  children,
  variant = "field",
  className,
}: {
  children: React.ReactNode;
  variant?: "field" | "section";
  className?: string;
}) {
  return (
    <p
      className={cn(
        "flex gap-1.5 rounded-md bg-accent/60 text-accent-foreground",
        variant === "field"
          ? "px-2 py-1.5 text-xs"
          : "px-3 py-2.5 text-sm",
        className,
      )}
    >
      <Search
        className={cn(
          "shrink-0 opacity-70",
          variant === "field" ? "mt-px size-3" : "mt-0.5 size-3.5",
        )}
        aria-hidden="true"
      />
      <span>
        <span className="font-semibold">SEO tip:</span> {children}
      </span>
    </p>
  );
}
