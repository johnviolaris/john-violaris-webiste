/** Publication times are entered in UK local time, never the browser's zone. */
const london = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/London",
  year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit", hourCycle: "h23",
});

export function londonInputValue(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  const parts = Object.fromEntries(london.formatToParts(date).map(({ type, value }) => [type, value]));
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

export function parseLondonDateTime(value: string):
  | { ok: true; value: string | null }
  | { ok: false; error: string } {
  if (!value) return { ok: true, value: null };
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
    return { ok: false, error: "Enter a valid date and time in Europe/London." };
  }
  const naive = new Date(`${value}:00Z`).getTime();
  if (!Number.isFinite(naive)) return { ok: false, error: "Enter a valid date and time." };
  // London uses GMT or BST. Matching the local clock also rejects impossible
  // calendar dates and the missing hour when clocks go forward.
  const candidates = [naive, naive - 60 * 60 * 1000]
    .filter((instant) => londonInputValue(new Date(instant).toISOString()) === value);
  if (candidates.length === 0) {
    return { ok: false, error: "That UK time does not exist. Check the date or choose a time after the clocks change." };
  }
  if (candidates.length > 1) {
    return { ok: false, error: "That UK time occurs twice when the clocks go back. Choose a time outside 01:00–01:59." };
  }
  return { ok: true, value: new Date(candidates[0]).toISOString() };
}

export type PublicationWindow = {
  published: boolean;
  published_at: string | null;
  unpublish_at?: string | null;
};

export function publicationStatus(row: PublicationWindow, now = new Date()): "draft" | "scheduled" | "expired" | "live" {
  if (!row.published) return "draft";
  if (row.unpublish_at && new Date(row.unpublish_at).getTime() <= now.getTime()) return "expired";
  if (row.published_at && new Date(row.published_at).getTime() > now.getTime()) return "scheduled";
  return "live";
}

export function isPubliclyVisible(row: PublicationWindow, now = new Date()): boolean {
  return publicationStatus(row, now) === "live";
}
