/**
 * Where an emailed sign-in link may send the visitor once it has been
 * verified.
 *
 * The `next` parameter travels in a URL anyone can write, so it is honoured
 * only when it is a plain path on this site. Anything else falls back: an
 * absolute URL, a protocol-relative `//host`, a backslash, or whitespace and
 * control characters (a browser strips a tab from `/\t/host`, which turns it
 * into `//host`). Query strings are refused too; no destination needs one.
 */
const plainPath = /^\/(?:[A-Za-z0-9._~-]+(?:\/[A-Za-z0-9._~-]+)*\/?)?$/;

export function safeNextPath(
  value: string | null | undefined,
  fallback: string,
): string {
  if (!value || value.startsWith("//") || !plainPath.test(value)) {
    return fallback;
  }

  return value;
}
