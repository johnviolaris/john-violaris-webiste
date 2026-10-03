/**
 * Enquiry form shape, validation and workflow vocabulary.
 *
 * Deliberately free of server-only imports: the contact form, the server action
 * and the admin inbox all read their field list, matter types and status labels
 * from here, so the three never drift apart.
 *
 * Validation is hand-rolled rather than schema-library driven, matching
 * `app/auth/actions.ts`. Messages are written to be shown to an anxious visitor
 * — they say what to do, not what failed.
 */

export const enquiryFields = [
  "firstName",
  "lastName",
  "phone",
  "email",
  "matterType",
  "courtDate",
  "courtLocation",
  "description",
] as const;

export type EnquiryField = (typeof enquiryFields)[number];

export type EnquiryValues = Record<EnquiryField, string>;

/** Bot trap. A real visitor never sees this input, so a filled one is spam. */
export const honeypotField = "company";

export const emptyEnquiryValues: EnquiryValues = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  matterType: "",
  courtDate: "",
  courtLocation: "",
  description: "",
};

/**
 * Offered in the "Type of matter" select. Mirrors the service catalogue but
 * stays a plain list — a visitor picking a category is not choosing a service
 * page, and "Other / not sure" has to remain a valid answer.
 */
export const matterTypes = [
  "Drink driving",
  "Drug driving",
  "Totting up / 12+ points",
  "Exceptional hardship",
  "Special reasons",
  "Speeding",
  "Dangerous driving",
  "Careless driving",
  "Mobile phone whilst driving",
  "Driving without insurance",
  "Failing to stop or report",
  "Section 172 / driver details",
  "Police station — motoring",
  "Police station — another offence",
  "Other / not sure",
] as const;

export const enquiryStatuses = ["new", "read", "replied", "archived"] as const;

export type EnquiryStatus = (typeof enquiryStatuses)[number];

export const enquiryStatusLabels: Record<EnquiryStatus, string> = {
  new: "New",
  read: "Read",
  replied: "Replied",
  archived: "Archived",
};

export function isEnquiryStatus(value: unknown): value is EnquiryStatus {
  return (
    typeof value === "string" &&
    (enquiryStatuses as readonly string[]).includes(value)
  );
}

/**
 * A stored enquiry, as the admin inbox and the emails see it.
 *
 * `ip_hash` is intentionally absent: it exists only for the rate limiter and
 * nothing outside that query should select it.
 */
export type Enquiry = {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  matter_type: string;
  court_date: string | null;
  court_location: string | null;
  description: string;
  status: EnquiryStatus;
  admin_notified_at: string | null;
  visitor_confirmed_at: string | null;
  email_error: string | null;
  source_path: string | null;
  referrer: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  gclid: string | null;
  created_at: string;
  updated_at: string;
};

/** Columns making up an `Enquiry`, for `.select()`. */
export const enquirySelect =
  "id, first_name, last_name, phone, email, matter_type, court_date, court_location, description, status, admin_notified_at, visitor_confirmed_at, email_error, source_path, referrer, utm_source, utm_medium, utm_campaign, utm_term, utm_content, gclid, created_at, updated_at";

/**
 * What a row in the inbox list or on the dashboard actually shows.
 *
 * `description` runs to 5,000 characters and none of it appears until an
 * enquiry is opened, so a list of 200 would otherwise ship — and serialise into
 * the payload — most of a megabyte of prose nobody reads.
 */
export type EnquiryListItem = Pick<
  Enquiry,
  | "id"
  | "first_name"
  | "last_name"
  | "email"
  | "matter_type"
  | "court_date"
  | "status"
  | "email_error"
  | "created_at"
>;

/** Columns making up an `EnquiryListItem`, for `.select()`. */
export const enquiryListSelect =
  "id, first_name, last_name, email, matter_type, court_date, status, email_error, created_at";

/** Returned by the submit action and consumed by `useActionState`. */
export type EnquiryFormState = {
  status: "idle" | "success" | "error";
  message: string | null;
  fieldErrors: Partial<Record<EnquiryField, string>>;
  /** Echoed back so a rejected submission does not empty the form. */
  values: EnquiryValues;
};

export const initialEnquiryFormState: EnquiryFormState = {
  status: "idle",
  message: null,
  fieldErrors: {},
  values: emptyEnquiryValues,
};

/**
 * Column limits. Postgres would accept more; these keep a single submission
 * from filling the inbox, and match what the form tells the visitor.
 */
const limits: Record<EnquiryField, number> = {
  firstName: 80,
  lastName: 80,
  phone: 40,
  email: 254,
  matterType: 80,
  courtDate: 120,
  courtLocation: 160,
  description: 5000,
};

export const descriptionMaxLength = limits.description;

/** Deliberately permissive. Rejecting unusual but valid addresses costs a lead. */
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type EnquiryValidationResult =
  | { ok: true; values: EnquiryValues }
  | { ok: false; fieldErrors: Partial<Record<EnquiryField, string>> };

export function validateEnquiry(input: EnquiryValues): EnquiryValidationResult {
  const values = { ...emptyEnquiryValues };
  for (const field of enquiryFields) {
    values[field] = input[field].trim().slice(0, limits[field]);
  }

  const fieldErrors: Partial<Record<EnquiryField, string>> = {};

  if (!values.firstName) fieldErrors.firstName = "Enter your first name.";
  if (!values.lastName) fieldErrors.lastName = "Enter your last name.";

  if (!values.phone) {
    fieldErrors.phone = "Enter a telephone number John can reach you on.";
  } else if ((values.phone.match(/\d/g) ?? []).length < 7) {
    fieldErrors.phone = "Enter a complete telephone number.";
  }

  if (!values.email) {
    fieldErrors.email = "Enter your email address.";
  } else if (!emailPattern.test(values.email)) {
    fieldErrors.email = "Check your email address and try again.";
  }

  if (!values.matterType) {
    fieldErrors.matterType = "Choose the type of matter, or 'Other / not sure'.";
  } else if (!(matterTypes as readonly string[]).includes(values.matterType)) {
    fieldErrors.matterType = "Choose one of the listed options.";
  }

  if (!values.description) {
    fieldErrors.description = "Tell John briefly what has happened.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors };
  }

  return { ok: true, values };
}

/** "Jane Smith", for email subjects and the inbox list. */
export function enquiryFullName(enquiry: {
  first_name: string;
  last_name: string;
}) {
  return `${enquiry.first_name} ${enquiry.last_name}`.trim();
}
