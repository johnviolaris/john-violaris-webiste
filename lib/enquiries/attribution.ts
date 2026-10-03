/**
 * The small, explicit attribution vocabulary accepted with an enquiry:
 * referrer, standard UTM values and Google Ads click id. Arbitrary query
 * parameters are intentionally excluded.
 */
export const enquiryAttributionFields = [
  "referrer",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "gclid",
] as const;

/** Browser key used for consented, tab-scoped first-touch attribution. */
export const enquiryAttributionStorageKey = "jv_enquiry_attribution";

export type EnquiryAttributionField =
  (typeof enquiryAttributionFields)[number];

export type EnquiryAttributionValues = Record<
  EnquiryAttributionField,
  string
>;

export const emptyEnquiryAttribution: EnquiryAttributionValues = {
  referrer: "",
  utm_source: "",
  utm_medium: "",
  utm_campaign: "",
  utm_term: "",
  utm_content: "",
  gclid: "",
};

const controlCharacters = /[\u0000-\u001f\u007f]/g;

/** Standard UTM text only; compact enough to display safely in the inbox. */
export function normaliseUtmValue(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const normalised = value.replace(controlCharacters, "").trim().slice(0, 200);

  return normalised || null;
}

/**
 * Keep only an HTTP(S) referrer's origin and path. Query strings and fragments
 * can contain search terms or other information that has no place in a legal
 * enquiry record.
 */
export function normaliseReferrer(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;

  try {
    const parsed = new URL(value);

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }

    return `${parsed.origin}${parsed.pathname}`.slice(0, 500);
  } catch {
    return null;
  }
}

/** Read and normalise the hidden attribution fields received by the action. */
export function readEnquiryAttribution(
  formData: FormData,
): Record<EnquiryAttributionField, string | null> {
  return {
    referrer: normaliseReferrer(formData.get("referrer")),
    utm_source: normaliseUtmValue(formData.get("utm_source")),
    utm_medium: normaliseUtmValue(formData.get("utm_medium")),
    utm_campaign: normaliseUtmValue(formData.get("utm_campaign")),
    utm_term: normaliseUtmValue(formData.get("utm_term")),
    utm_content: normaliseUtmValue(formData.get("utm_content")),
    gclid: normaliseUtmValue(formData.get("gclid")),
  };
}

