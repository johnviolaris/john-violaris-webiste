import type { SiteSettings } from "@/lib/site-config";

export type PracticeFacts = Pick<SiteSettings, "practiceLegalName" | "practiceSraNumber" | "addressStreet" |
  "addressLocality" | "addressRegion" | "addressPostalCode" | "addressCountry" | "latitude" |
  "longitude" | "openingHours" | "practiceDetailsReviewedAt">;

const addressKeys = ["addressStreet", "addressLocality", "addressPostalCode", "addressCountry"] as const;
const days = "(?:Mo|Tu|We|Th|Fr|Sa|Su)";
const hoursPattern = new RegExp(`^${days}(?:-${days}|(?:,${days})*) (?:[01]\\d|2[0-3]):[0-5]\\d-(?:[01]\\d|2[0-3]):[0-5]\\d$`);

export function practiceFactsErrors(values: PracticeFacts, now = new Date()): Partial<Record<keyof PracticeFacts, string>> {
  const errors: Partial<Record<keyof PracticeFacts, string>> = {};
  const factKeys = ["practiceLegalName", "practiceSraNumber", "addressStreet", "addressLocality",
    "addressRegion", "addressPostalCode", "addressCountry", "latitude", "longitude", "openingHours"] as const;
  const hasFacts = factKeys.some((key) => values[key].trim());
  if (!hasFacts) return errors;
  const date = values.practiceDetailsReviewedAt;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(`${date}T00:00:00Z`)) ||
    new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date || date > now.toISOString().slice(0, 10)) {
    errors.practiceDetailsReviewedAt = "Record the date John confirmed these practice details (YYYY-MM-DD, today or earlier).";
  }
  const addressStarted = addressKeys.some((key) => values[key]) || Boolean(values.addressRegion);
  if (addressStarted) {
    for (const key of addressKeys) if (!values[key]) errors[key] = "Complete the confirmed address or clear every address field.";
    if (values.addressCountry && !/^[A-Z]{2}$/.test(values.addressCountry)) errors.addressCountry = "Use a two-letter country code, such as GB.";
  }
  if (values.latitude || values.longitude) {
    for (const [key, limit] of [["latitude", 90], ["longitude", 180]] as const) {
      const value = values[key];
      if (!value || !/^-?\d+(?:\.\d+)?$/.test(value) || Math.abs(Number(value)) > limit) errors[key] = `Enter a coordinate between -${limit} and ${limit}.`;
    }
    if (!addressKeys.every((key) => values[key])) errors.latitude = "Coordinates require the complete confirmed public address.";
  }
  if (values.practiceSraNumber && !/^\d{4,10}$/.test(values.practiceSraNumber)) errors.practiceSraNumber = "Enter the verified practice identifier using digits only.";
  if (values.openingHours && values.openingHours.split(";").some((entry) => !hoursPattern.test(entry.trim()))) {
    errors.openingHours = "Use hours such as Mo-Fr 09:00-18:00; Sa 09:00-12:00, or leave blank.";
  }
  return errors;
}

/** Direct database edits receive the same fail-closed guard as the form. */
export function verifiedPracticeFacts(values: PracticeFacts): PracticeFacts | null {
  return values.practiceDetailsReviewedAt && Object.keys(practiceFactsErrors(values)).length === 0 ? values : null;
}
