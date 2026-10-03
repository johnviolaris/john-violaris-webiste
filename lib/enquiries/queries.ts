import "server-only";

import { cache } from "react";

import { createAuthorizedAdminClient } from "@/lib/auth";
import {
  enquiryListSelect,
  enquirySelect,
  enquiryStatuses,
  type Enquiry,
  type EnquiryListItem,
  type EnquiryStatus,
} from "@/lib/enquiries/schema";

/**
 * Admin-side reads for the enquiry inbox.
 *
 * These go through the cookie-backed client, not the secret key, so the
 * "Admins can read enquiries" policy is what actually authorises them. A
 * non-admin session returns no rows rather than an error — which is why the
 * `createAuthorizedAdminClient()` verifies the role before the query begins;
 * the admin layout remains a shared UI guard, not the security boundary.
 *
 * Kept apart from `admin-actions.ts` on purpose: a file marked `"use server"`
 * publishes every export as a callable endpoint, and reads have no business
 * being one.
 *
 * Every read is wrapped in `cache()`. The admin layout and the page inside it
 * are rendered in the same request, and a Server Action re-renders that whole
 * tree immediately after its write — deduping means one round trip to Supabase
 * where there would otherwise be two or three identical ones.
 */

export type EnquiryFilter = EnquiryStatus | "all";

/** Newest first. Capped — pagination arrives when the volume asks for it. */
const listLimit = 200;

export const listEnquiries = cache(async function listEnquiries(
  filter: EnquiryFilter = "all",
  limit: number = listLimit,
): Promise<EnquiryListItem[]> {
  const supabase = await createAuthorizedAdminClient();

  let query = supabase
    .from("enquiries")
    .select(enquiryListSelect)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (filter !== "all") {
    query = query.eq("status", filter);
  }

  const { data, error } = await query.returns<EnquiryListItem[]>();

  if (error) {
    console.error("Failed to list enquiries", error);

    return [];
  }

  return data ?? [];
});

export const getEnquiry = cache(async function getEnquiry(
  id: string,
): Promise<Enquiry | null> {
  const supabase = await createAuthorizedAdminClient();

  const { data, error } = await supabase
    .from("enquiries")
    .select(enquirySelect)
    .eq("id", id)
    .maybeSingle<Enquiry>();

  if (error) {
    console.error(`Failed to load enquiry ${id}`, error);

    return null;
  }

  return data;
});

export type EnquiryCounts = Record<EnquiryFilter, number>;

/**
 * Counts for the filter tabs and the sidebar badge. Head-only requests, so
 * Postgres counts against the status index without returning any rows.
 */
export const countEnquiries = cache(async function countEnquiries(): Promise<EnquiryCounts> {
  const supabase = await createAuthorizedAdminClient();

  const results = await Promise.all(
    enquiryStatuses.map(async (status) => {
      const { count } = await supabase
        .from("enquiries")
        .select("id", { count: "exact", head: true })
        .eq("status", status);

      return [status, count ?? 0] as const;
    }),
  );

  const counts = Object.fromEntries(results) as Record<EnquiryStatus, number>;

  return {
    ...counts,
    all: results.reduce((total, [, count]) => total + count, 0),
  };
});

/** Just the unactioned count, for the sidebar badge. */
export const countNewEnquiries = cache(async function countNewEnquiries(): Promise<number> {
  const supabase = await createAuthorizedAdminClient();

  const { count } = await supabase
    .from("enquiries")
    .select("id", { count: "exact", head: true })
    .eq("status", "new");

  return count ?? 0;
});

/**
 * Enquiries whose outbound email failed, for the dashboard warning. A count
 * rather than a scan of the list: the dashboard only needs the number, and the
 * rows it shows are the five most recent, not every row ever received.
 */
export const countUndeliveredEnquiries = cache(
  async function countUndeliveredEnquiries(): Promise<number> {
    const supabase = await createAuthorizedAdminClient();

    const { count } = await supabase
      .from("enquiries")
      .select("id", { count: "exact", head: true })
      .not("email_error", "is", null);

    return count ?? 0;
  },
);
