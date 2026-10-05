"use client";

import Link from "next/link";
import { useState, type ComponentProps } from "react";

/** Prefetch when a visitor points to or focuses a link, leaving first paint free. */
export function IntentLink({ onMouseEnter, onFocus, prefetch, ...props }: ComponentProps<typeof Link>) {
  const [intent, setIntent] = useState(false);

  return (
    <Link
      {...props}
      prefetch={prefetch ?? (intent ? null : false)}
      onMouseEnter={(event) => {
        onMouseEnter?.(event);
        if (!event.defaultPrevented) setIntent(true);
      }}
      onFocus={(event) => {
        onFocus?.(event);
        if (!event.defaultPrevented) setIntent(true);
      }}
    />
  );
}
