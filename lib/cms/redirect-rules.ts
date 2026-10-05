/** Redirects are routing facts, never arbitrary URLs or private-area shortcuts. */
export function isSameSitePath(value: string): boolean {
  return value.length <= 512 && /^\/[a-z0-9._~%+/-]*$/.test(value) &&
    !value.startsWith("//") && !/%(?:2f|5c|2e|00|0a|0d|25)/i.test(value) &&
    !value.split("/").some((segment) => segment === "." || segment === "..");
}

export function isPublicRedirectPath(value: string): boolean {
  if (!isSameSitePath(value)) return false;
  let decoded: string;
  try { decoded = decodeURIComponent(value); } catch { return false; }
  return isSameSitePath(decoded) && !/^\/(admin|auth|preview|api|_next)(\/|$)/.test(decoded) &&
    !/\.[a-z0-9]+$/.test(decoded) && decoded !== "/sitemap.xml" && decoded !== "/robots.txt";
}

export type RedirectRow = {
  source_path: string;
  destination_path: string;
  permanent: boolean;
  active: boolean;
  source_kind: string;
};

/** Defend against legacy cycles as well as the database's transactional checks. */
export function resolveRedirectTarget(source: string, destination: string, rows: RedirectRow[]): string | null {
  const visited = new Set([source]);
  let path = destination;
  for (let hop = 0; hop < 32; hop++) {
    if (!isPublicRedirectPath(path) || visited.has(path)) return null;
    visited.add(path);
    const next = rows.find((row) => row.active && row.source_path === path && row.source_path !== source);
    if (!next) return path;
    path = next.destination_path;
  }
  return null;
}
