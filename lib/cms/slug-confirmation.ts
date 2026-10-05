/** Bind URL-change confirmation to both slugs so stale approvals cannot apply. */
export function slugChangeConfirmation(previous: string, next: string): string {
  return `${previous}=>${next}`;
}

export function hasConfirmedSlugChange(previous: string, next: string, wasPublished: boolean, submitted: unknown): boolean {
  return !wasPublished || previous === next || submitted === slugChangeConfirmation(previous, next);
}
