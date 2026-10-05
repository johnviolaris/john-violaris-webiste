"use client";
import { useState } from "react";
import { slugChangeConfirmation } from "@/lib/cms/slug-confirmation";

export function SlugChangeConfirmation({ previous, next, wasPublished, prefix }: {
  previous: string; next: string; wasPublished: boolean; prefix: "/blog/" | "/services/" | "/locations/";
}) {
  const [confirmed, setConfirmed] = useState("");
  if (!wasPublished || previous === next) return null;
  const token = slugChangeConfirmation(previous, next);
  return <label className="flex items-start gap-3 rounded-xl border border-gold/50 bg-gold/10 p-4 text-sm">
    <input type="checkbox" name="confirmSlugChange" value={token}
      checked={confirmed === token} onChange={(event) => setConfirmed(event.target.checked ? token : "")}
      className="mt-1 size-4 accent-primary" required />
    <span><span className="block font-medium">Confirm this URL change</span>
      <span className="mt-1 block font-mono text-xs">{prefix}{previous} → {prefix}{next}</span>
      <span className="mt-2 block text-muted-foreground">Saved links can be affected. A permanent redirect is created when both the old and new pages are publicly available. Review the new address before saving.</span>
    </span>
  </label>;
}
