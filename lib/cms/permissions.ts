/** Roles come from the caller's own RLS-protected profile, never user metadata. */
export type CmsRole = "admin" | "seo_editor";

export function cmsRole(value: unknown): CmsRole | null {
  return value === "admin" || value === "seo_editor" ? value : null;
}

export function canEditSeo(value: unknown): boolean {
  return cmsRole(value) !== null;
}

export function canManageContent(value: unknown): boolean {
  return value === "admin";
}
