import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle, ArrowRight } from "lucide-react";

import { EnquiryStatusBadge } from "@/components/admin/enquiry-status-badge";
import { requireCmsSession } from "@/lib/auth";
import {
  countEnquiries,
  countUndeliveredEnquiries,
  listEnquiries,
} from "@/lib/enquiries/queries";
import {
  enquiryFullName,
  enquiryStatusLabels,
  enquiryStatuses,
} from "@/lib/enquiries/schema";
import { formatUkShortDateTime } from "@/lib/format";

/** How many recent enquiries the dashboard lists. */
const recentLimit = 5;

export default async function AdminPage() {
  const session = await requireCmsSession();
  if (session.role !== "admin") redirect("/admin/seo-metadata");

  // Five rows and two numbers. Asking for the whole inbox and slicing it here
  // meant fetching every description on the way to a list that shows none.
  const [counts, latest, undelivered] = await Promise.all([
    countEnquiries(),
    listEnquiries("all", recentLimit),
    countUndeliveredEnquiries(),
  ]);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pt-14 pb-12 md:px-8 md:pt-10">
      <header className="mb-6">
        <h1 className="font-display text-2xl font-semibold">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {session?.email
            ? `Signed in as ${session.email}.`
            : "Welcome back."}{" "}
          {counts.new > 0
            ? `${counts.new} ${counts.new === 1 ? "enquiry needs" : "enquiries need"} your attention.`
            : "Nothing is waiting for a reply."}
        </p>
      </header>

      {undelivered > 0 ? (
        <p className="mb-6 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>
            {undelivered === 1
              ? "One enquiry could not be emailed out."
              : `${undelivered} enquiries could not be emailed out.`}{" "}
            They are safe in the inbox below — open one to see what went wrong.
          </span>
        </p>
      ) : null}

      <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {enquiryStatuses.map((status) => (
          <Link
            key={status}
            href={`/admin/enquiries?status=${status}`}
            className="rounded-xl border p-4 transition-colors hover:bg-muted/50"
          >
            <span className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
              {enquiryStatusLabels[status]}
            </span>
            <span className="mt-1.5 block font-display text-3xl font-semibold tabular-nums">
              {counts[status]}
            </span>
          </Link>
        ))}
      </div>

      <section aria-labelledby="recent-enquiries-heading">
        <div className="mb-3 flex items-baseline justify-between gap-4">
          <h2 id="recent-enquiries-heading" className="font-display text-lg font-semibold">
            Recent enquiries
          </h2>
          <Link
            href="/admin/enquiries"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            View all
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>

        {latest.length === 0 ? (
          <p className="rounded-xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
            No enquiries yet. Submissions from the contact form arrive here.
          </p>
        ) : (
          <ul className="divide-y rounded-xl border">
            {latest.map((enquiry) => (
              <li key={enquiry.id}>
                <Link
                  href={`/admin/enquiries/${enquiry.id}`}
                  className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 px-4 py-3 transition-colors hover:bg-muted/50"
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">
                      {enquiryFullName(enquiry)}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {enquiry.matter_type}
                    </span>
                  </span>
                  <span className="flex items-center gap-3">
                    <time
                      dateTime={enquiry.created_at}
                      className="text-xs whitespace-nowrap text-muted-foreground"
                    >
                      {formatUkShortDateTime(enquiry.created_at)}
                    </time>
                    <EnquiryStatusBadge status={enquiry.status} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
