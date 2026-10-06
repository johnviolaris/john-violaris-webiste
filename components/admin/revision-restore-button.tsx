"use client";
import { useActionState } from "react";
import { restoreContentRevision, type RestoreState } from "@/lib/cms/revisions/actions";
import { Button } from "@/components/ui/button";
import type { SectionWorkflowToken } from "@/lib/cms/sections/drafts";

const initial: RestoreState = { status: "idle", message: "" };
export function RevisionRestoreButton({ id, asDraft = true, crawlRules = false, practiceFacts = false, sectionWorkflow }: { id: string; asDraft?: boolean; crawlRules?: boolean; practiceFacts?: boolean; sectionWorkflow?: SectionWorkflowToken }) {
  const [state, action, pending] = useActionState(restoreContentRevision, initial);
  return <form action={action} onSubmit={(event) => {
    if (!window.confirm(sectionWorkflow ? "Restore this section version as a private draft? Your current editor fields stay visible until you reload. Reloading replaces any unsaved edits; live content stays unchanged." : asDraft ? "Restore this saved version as a draft? The current version remains in history. Review before publishing." : "Restore these saved fields to the live website immediately? The current values remain in history.")) event.preventDefault();
  }}>
    <input type="hidden" name="revisionId" value={id} />
    {sectionWorkflow && <>
      <input type="hidden" name="workflowVersion" value="1" />
      <input type="hidden" name="intent" value="draft" />
      <input type="hidden" name="expectedLiveContent" value={JSON.stringify(sectionWorkflow.liveContent)} />
      <input type="hidden" name="expectedDraftId" value={sectionWorkflow.draftId ?? ""} />
      <input type="hidden" name="expectedDraftVersion" value={sectionWorkflow.draftVersion ?? ""} />
    </>}
    {crawlRules && <label className="mb-2 flex max-w-sm gap-2 text-xs"><input type="checkbox" name="confirmRestrictions" />I reviewed these crawl restrictions, including any public pages they block.</label>}
    {practiceFacts && <label className="mb-2 flex max-w-sm gap-2 text-xs"><input type="checkbox" name="confirmPracticeFacts" required />John has reviewed and confirmed these practice details.</label>}
    <Button size="sm" variant="outline" disabled={pending}>{pending ? "Restoring…" : asDraft ? "Restore as draft" : "Restore saved fields"}</Button>
    {state.message && <p role={state.status === "error" ? "alert" : "status"} className="mt-2 max-w-sm text-xs">{state.message}</p>}
    {sectionWorkflow && state.status === "success" && <button type="button" className="mt-2 block text-xs underline underline-offset-4" onClick={() => window.location.reload()}>Reload editor to review restored draft (discard unsaved edits)</button>}
  </form>;
}
