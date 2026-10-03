"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { after } from "next/server";

import { sendEnquiryEmails } from "@/lib/email/enquiry";
import { readEnquiryAttribution } from "@/lib/enquiries/attribution";
import {
  emptyEnquiryValues,
  enquiryFields,
  enquirySelect,
  honeypotField,
  validateEnquiry,
  type Enquiry,
  type EnquiryFormState,
  type EnquiryValues,
} from "@/lib/enquiries/schema";
import { deployment } from "@/lib/site-config";
import { createAdminClient } from "@/utils/supabase/admin";

/**
 * Public enquiry submission (PRD §7).
 *
 * The order matters. The enquiry is written to the database first and the
 * visitor is told it arrived as soon as that succeeds; the two emails are sent
 * afterwards, once the response has already gone out. Email is the notification
 * channel, not the record — if Resend is down, John still has the enquiry.
 *
 * This action is the ONLY way into `public.enquiries`: the table grants nothing
 * to `anon`, so the honeypot, the validation and the rate limit below cannot be
 * stepped around by posting at the Data API with the publishable key.
 */

/** Maximum submissions accepted from one hashed address inside the window. */
const rateLimitMax = 3;
const rateLimitWindowMinutes = 15;

function errorState(
  values: EnquiryValues,
  message: string,
  fieldErrors: EnquiryFormState["fieldErrors"] = {},
): EnquiryFormState {
  return { status: "error", message, fieldErrors, values };
}

/**
 * Identifies a submitter for rate limiting without retaining their IP address.
 * Salted so the stored digest is not a lookup table away from the raw address;
 * returns null when no address is available, which simply skips the limit.
 */
function hashIpAddress(forwardedFor: string | null, realIp: string | null) {
  const address = (forwardedFor?.split(",")[0] ?? realIp ?? "").trim();

  if (!address) return null;

  const salt = process.env.ENQUIRY_IP_SALT ?? "";

  return createHash("sha256").update(`${salt}:${address}`).digest("hex");
}

export async function submitEnquiry(
  _previousState: EnquiryFormState,
  formData: FormData,
): Promise<EnquiryFormState> {
  const submitted = { ...emptyEnquiryValues };
  for (const field of enquiryFields) {
    const value = formData.get(field);
    submitted[field] = typeof value === "string" ? value : "";
  }

  // A filled honeypot is a bot. Report success so it learns nothing, and store
  // nothing. A real visitor never sees the field, so cannot reach this branch.
  if (formData.get(honeypotField)) {
    return {
      status: "success",
      message: null,
      fieldErrors: {},
      values: emptyEnquiryValues,
    };
  }

  const validation = validateEnquiry(submitted);

  if (!validation.ok) {
    return errorState(
      submitted,
      "Check the highlighted fields and send again.",
      validation.fieldErrors,
    );
  }

  const values = validation.values;

  const requestHeaders = await headers();
  const ipHash = hashIpAddress(
    requestHeaders.get("x-forwarded-for"),
    requestHeaders.get("x-real-ip"),
  );

  const sourcePathValue = formData.get("sourcePath");
  const sourcePath =
    typeof sourcePathValue === "string" && sourcePathValue.startsWith("/")
      ? sourcePathValue.slice(0, 255)
      : null;

  let supabase;
  try {
    supabase = createAdminClient();
  } catch {
    return errorState(
      submitted,
      "The enquiry form is temporarily unavailable. Please call or email John directly.",
    );
  }

  if (ipHash) {
    const since = new Date(
      Date.now() - rateLimitWindowMinutes * 60 * 1000,
    ).toISOString();

    const { count, error } = await supabase
      .from("enquiries")
      .select("id", { count: "exact", head: true })
      .eq("ip_hash", ipHash)
      .gte("created_at", since);

    // A failed count must not block a genuine enquiry, so only a definite
    // over-limit result rejects.
    if (!error && (count ?? 0) >= rateLimitMax) {
      return errorState(
        submitted,
        "Several enquiries have already been sent from this connection. If your matter is urgent, please call John rather than send another.",
      );
    }
  }

  const { data, error } = await supabase
    .from("enquiries")
    .insert({
      first_name: values.firstName,
      last_name: values.lastName,
      phone: values.phone,
      email: values.email,
      matter_type: values.matterType,
      court_date: values.courtDate || null,
      court_location: values.courtLocation || null,
      description: values.description,
      source_path: sourcePath,
      ip_hash: ipHash,
      ...readEnquiryAttribution(formData),
    })
    .select(enquirySelect)
    .single<Enquiry>();

  if (error || !data) {
    console.error("Failed to store enquiry", error);

    return errorState(
      submitted,
      "Your enquiry could not be sent just now. Please try again, or call or email John directly.",
    );
  }

  const enquiry = data;

  // Origin of this request, so the dashboard link in John's email works in
  // every environment rather than only on the production domain.
  const forwardedProto = requestHeaders.get("x-forwarded-proto");
  const host = requestHeaders.get("host");
  const origin = host
    ? `${forwardedProto ?? (host.startsWith("localhost") ? "http" : "https")}://${host}`
    : deployment.url;

  // Runs once the visitor already has their confirmation screen.
  after(async () => {
    const outcome = await sendEnquiryEmails(
      enquiry,
      `${origin}/admin/enquiries/${enquiry.id}`,
    );

    if (outcome.error) {
      console.error(`Enquiry ${enquiry.id} email failure: ${outcome.error}`);
    }

    const { error: updateError } = await supabase
      .from("enquiries")
      .update({
        admin_notified_at: outcome.adminNotifiedAt,
        visitor_confirmed_at: outcome.visitorConfirmedAt,
        email_error: outcome.error,
      })
      .eq("id", enquiry.id);

    if (updateError) {
      console.error(
        `Could not record email delivery for enquiry ${enquiry.id}`,
        updateError,
      );
    }
  });

  return {
    status: "success",
    message: null,
    fieldErrors: {},
    values: emptyEnquiryValues,
  };
}
