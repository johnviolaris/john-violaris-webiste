/**
 * Date formatting.
 *
 * Everything is rendered in `Europe/London` regardless of where the server
 * runs. A court date read off a Vercel box in another timezone is worse than
 * useless, and "yesterday at 23:40" shifting by an hour costs John a real day
 * of context.
 */

function toDate(value: Date | string) {
  return typeof value === "string" ? new Date(value) : value;
}

/** "14 September 2026" */
export function formatUkDate(value: Date | string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "long",
    timeZone: "Europe/London",
  }).format(toDate(value));
}

/** "14 September 2026 at 21:04" */
export function formatUkDateTime(value: Date | string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Europe/London",
  }).format(toDate(value));
}

/** "14 Sep 2026, 21:04" — the compact form used in table cells. */
export function formatUkShortDateTime(value: Date | string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/London",
  }).format(toDate(value));
}
