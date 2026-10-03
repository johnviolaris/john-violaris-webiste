import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Mail,
  Phone,
} from "lucide-react";

import { DeleteEnquiryButton } from "@/components/admin/delete-enquiry-button";
import {
  EnquiryStatusActions,
  EnquiryStatusHeaderBadge,
  EnquiryStatusProvider,
} from "@/components/admin/enquiry-status-control";
import { Button } from "@/components/ui/button";
import { getEnquiry } from "@/lib/enquiries/queries";
import { enquiryFullName } from "@/lib/enquiries/schema";
import { formatUkDateTime } from "@/lib/format";

export const metadata: Metadata = {
  title: "Enquiry",
};

export default async function AdminEnquiryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const enquiry = await getEnquiry(id);

  if (!enquiry) notFound();

  const name = enquiryFullName(enquiry);
  const replySubject = encodeURIComponent("Your enquiry — John Violaris");

  return (
    // The status badge and the status buttons sit at opposite ends of the page
    // but show one value, so the optimistic state lives above both. Everything
    // inside stays server-rendered — it is passed through as `children`.
    <EnquiryStatusProvider id={enquiry.id} status={enquiry.status}>
      <div className="mx-auto w-full max-w-4xl px-4 pt-14 pb-12 md:px-8 md:pt-10">
        <Link
          href="/admin/enquiries"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          All enquiries
        </Link>

        <header className="mt-4 mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-semibold">{name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {enquiry.matter_type} · received{" "}
              <time dateTime={enquiry.created_at}>
                {formatUkDateTime(enquiry.created_at)}
              </time>
            </p>
          </div>
          <EnquiryStatusHeaderBadge className="mt-1.5" />
        </header>

        <div className="mb-6 flex flex-wrap gap-2">
          <Button asChild size="lg">
            <a href={`mailto:${enquiry.email}?subject=${replySubject}`}>
              <Mail aria-hidden="true" />
              Reply by email
            </a>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href={`tel:${enquiry.phone.replace(/\s+/g, "")}`}>
              <Phone aria-hidden="true" />
              {enquiry.phone}
            </a>
          </Button>
        </div>

        <section
          className="mb-6 rounded-xl border p-4"
          aria-labelledby="enquiry-status-heading"
        >
          <h2
            id="enquiry-status-heading"
            className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase"
          >
            Status
          </h2>
          <EnquiryStatusActions />
        </section>

        <section
          className="mb-6 rounded-xl border"
          aria-labelledby="enquiry-details-heading"
        >
          <h2 id="enquiry-details-heading" className="sr-only">
            Enquiry details
          </h2>
          <dl className="divide-y">
            <DetailRow label="Telephone">{enquiry.phone}</DetailRow>
            <DetailRow label="Email">{enquiry.email}</DetailRow>
            <DetailRow label="Type of matter">{enquiry.matter_type}</DetailRow>
            <DetailRow label="Court / interview date">
              {enquiry.court_date || "Not given"}
            </DetailRow>
            <DetailRow label="Court / police station">
              {enquiry.court_location || "Not given"}
            </DetailRow>
            <DetailRow label="Description">
              {/* Visitor-written text: preserve their line breaks rather than
                  collapsing a structured account into one paragraph. */}
              <span className="whitespace-pre-wrap">{enquiry.description}</span>
            </DetailRow>
            <DetailRow label="Sent from">
              {enquiry.source_path || "Unknown page"}
            </DetailRow>
            {enquiry.referrer ? (
              <DetailRow label="External referrer">{enquiry.referrer}</DetailRow>
            ) : null}
            {enquiry.utm_source ? (
              <DetailRow label="UTM source">{enquiry.utm_source}</DetailRow>
            ) : null}
            {enquiry.utm_medium ? (
              <DetailRow label="UTM medium">{enquiry.utm_medium}</DetailRow>
            ) : null}
            {enquiry.utm_campaign ? (
              <DetailRow label="UTM campaign">{enquiry.utm_campaign}</DetailRow>
            ) : null}
            {enquiry.utm_term ? (
              <DetailRow label="UTM term">{enquiry.utm_term}</DetailRow>
            ) : null}
            {enquiry.utm_content ? (
              <DetailRow label="UTM content">{enquiry.utm_content}</DetailRow>
            ) : null}
            {enquiry.gclid ? (
              <DetailRow label="Google Ads click ID">{enquiry.gclid}</DetailRow>
            ) : null}
          </dl>
        </section>

        <section
          className="mb-8 rounded-xl border p-4"
          aria-labelledby="enquiry-delivery-heading"
        >
          <h2
            id="enquiry-delivery-heading"
            className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase"
          >
            Email delivery
          </h2>
          <ul className="mt-3 grid gap-2 text-sm">
            <DeliveryRow
              label="Notification to John"
              sentAt={enquiry.admin_notified_at}
            />
            <DeliveryRow
              label="Confirmation to the sender"
              sentAt={enquiry.visitor_confirmed_at}
            />
          </ul>
          {enquiry.email_error ? (
            <p className="mt-3 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
              {enquiry.email_error}
            </p>
          ) : null}
        </section>

        <div className="flex justify-end border-t pt-5">
          <DeleteEnquiryButton id={enquiry.id} name={name} />
        </div>
      </div>
    </EnquiryStatusProvider>
  );
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-1 px-4 py-3 sm:grid-cols-[13rem_1fr] sm:gap-4">
      <dt className="text-xs font-semibold tracking-[0.1em] text-muted-foreground uppercase sm:pt-0.5">
        {label}
      </dt>
      <dd className="text-sm break-words">{children}</dd>
    </div>
  );
}

function DeliveryRow({
  label,
  sentAt,
}: {
  label: string;
  sentAt: string | null;
}) {
  return (
    <li className="flex flex-wrap items-center gap-2">
      {sentAt ? (
        <CheckCircle2
          className="size-4 text-emerald-600"
          aria-hidden="true"
        />
      ) : (
        <AlertTriangle className="size-4 text-amber-600" aria-hidden="true" />
      )}
      <span>{label}</span>
      <span className="text-muted-foreground">
        {sentAt ? `sent ${formatUkDateTime(sentAt)}` : "not sent"}
      </span>
    </li>
  );
}
