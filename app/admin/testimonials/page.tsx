import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, Lock } from "lucide-react";

import { Stars } from "@/components/ui/stars";
import { testimonials } from "@/lib/content/home";
import { RevisionHistory } from "@/components/admin/revision-history";

export const metadata: Metadata = {
  title: "Reviews",
};

/**
 * The reviews, read only.
 *
 * Deliberately not an editor. Every review here was left by a client on
 * ReviewSolicitors and collected by them; it is presented on the site as an
 * independently verified review, and that is only true while nobody on this
 * side can alter the words. An edit form would quietly make the claim false,
 * so there is not one — correcting a review means taking it up with
 * ReviewSolicitors, and adding one means a client leaving one.
 *
 * What this page is for is seeing what the site is showing, which is a real
 * question John will have and one he should not have to answer by reading the
 * public page.
 *
 * The list comes from `lib/content/home.ts` because that is what the public
 * page renders. The `testimonials` table is seeded with the same reviews and
 * nothing reads it yet; pointing this page at the table instead would show
 * John rows the site does not use.
 */
export default function AdminTestimonialsPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-14 pb-12 md:px-8 md:pt-10">
      <header className="mb-6">
        <h1 className="font-display text-2xl font-semibold">Reviews</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          The reviews shown on the home page and the reviews page.
        </p>
      </header>

      <p className="mb-6 flex items-start gap-2.5 rounded-xl border bg-muted/40 px-4 py-3 text-sm">
        <Lock className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <span>
          <span className="font-medium">These cannot be edited here.</span>{" "}
          <span className="text-muted-foreground">
            They were left by clients on ReviewSolicitors and are collected and
            published by them. The site says so, and that stays true only while
            nobody can change the wording from this side. To correct or remove
            one, or to have new ones appear, go through ReviewSolicitors.
          </span>
        </span>
      </p>

      <ul className="space-y-3">
        {testimonials.map((review) => (
          <li key={review.quote} className="rounded-xl border p-4">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
              <span className="text-sm font-medium">{review.name}</span>
              <div className="flex items-center gap-3">
                {review.matter ? (
                  <span className="text-xs text-muted-foreground">
                    {review.matter}
                  </span>
                ) : null}
                <Stars rating={review.rating} />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              &ldquo;{review.quote}&rdquo;
            </p>
            {review.source ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Collected by {review.source}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
      <details className="mt-8 rounded-xl border p-4"><summary className="cursor-pointer font-medium">Database audit history (read only)</summary><p className="mt-2 text-sm text-muted-foreground">These are archived database records. Public verified reviews continue to use their independent source.</p><RevisionHistory entity="testimonials" id="" /></details>

      <p className="mt-6 text-sm text-muted-foreground">
        The wording framing this section — the heading above it and the note
        beneath the button — is editable under{" "}
        <Link
          href="/admin/website-content/home#testimonials"
          className="underline underline-offset-4 hover:text-foreground"
        >
          Website content
        </Link>
        .{" "}
        <a
          href="/reviews"
          target="_blank"
          rel="noopener"
          className="inline-flex items-center gap-1 underline underline-offset-4 hover:text-foreground"
        >
          See the reviews page
          <ExternalLink className="size-3" aria-hidden="true" />
        </a>
      </p>
    </div>
  );
}
