"use client";
import { useActionState } from "react";
import { restoreContentRevision, type RestoreState } from "@/lib/cms/revisions/actions";
import { Button } from "@/components/ui/button";

const initial: RestoreState = { status: "idle", message: "" };
export function RevisionRestoreButton({ id, asDraft = true, crawlRules = false, practiceFacts = false }: { id: string; asDraft?: boolean; crawlRules?: boolean; practiceFacts?: boolean }) {
  const [state, action, pending] = useActionState(restoreContentRevision, initial);
  return <form action={action} onSubmit={(event) => {
    if (!window.confirm(asDraft ? "Restore this saved version as a draft? The current version remains in history. Review before publishing." : "Restore these saved fields to the live website immediately? The current values remain in history.")) event.preventDefault();
  }}>
    <input type="hidden" name="revisionId" value={id} />
    {crawlRules && <label className="mb-2 flex max-w-sm gap-2 text-xs"><input type="checkbox" name="confirmRestrictions" />I reviewed these crawl restrictions, including any public pages they block.</label>}
    {practiceFacts && <label className="mb-2 flex max-w-sm gap-2 text-xs"><input type="checkbox" name="confirmPracticeFacts" required />John has reviewed and confirmed these practice details.</label>}
    <Button size="sm" variant="outline" disabled={pending}>{pending ? "Restoring…" : asDraft ? "Restore as draft" : "Restore saved fields"}</Button>
    {state.message && <p role={state.status === "error" ? "alert" : "status"} className="mt-2 max-w-sm text-xs">{state.message}</p>}
  </form>;
}
