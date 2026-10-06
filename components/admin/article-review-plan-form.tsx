"use client";

import { useEffect, useReducer, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { refreshArticleReviewPlan, saveArticleReviewPlan } from "@/lib/cms/blog/review-plans/actions";
import { initialReviewPlanEditor, reviewPlanEditorReducer, reviewPlansUnavailable, type ArticleReviewPlan, type ReviewPlanValues } from "@/lib/cms/blog/review-plans/schema";

function PlanFields({ disabled, values, onEdit }: { disabled: boolean; values: ReviewPlanValues; onEdit: (field: keyof ReviewPlanValues, value: string) => void }) {
  const { pending } = useFormStatus();
  return <fieldset disabled={disabled || pending} className="grid gap-4 sm:grid-cols-2">
    <div className="space-y-2">
      <Label htmlFor="review-interval">Review interval (months)</Label>
      <Input id="review-interval" name="intervalMonths" type="number" min="1" max="36" step="1" required value={values.intervalMonths} onChange={(event) => onEdit("intervalMonths", event.currentTarget.value)} />
    </div>
    <div className="space-y-2">
      <Label htmlFor="review-due">Next review due</Label>
      <Input id="review-due" name="nextDueOn" type="date" min="1900-01-01" max="9999-12-31" required value={values.nextDueOn} onChange={(event) => onEdit("nextDueOn", event.currentTarget.value)} aria-describedby="review-calendar-help" />
      <p id="review-calendar-help" className="text-xs text-muted-foreground">Calendar date in Europe/London. Past dates remain visible as overdue.</p>
    </div>
  </fieldset>;
}

function PlanButtons({ disabled, hasPlan }: { disabled: boolean; hasPlan: boolean }) {
  const { pending } = useFormStatus();
  return <div className="flex flex-wrap gap-2">
    <Button type="submit" name="intent" value="save" disabled={disabled || pending}>{pending ? "Saving…" : "Save review plan"}</Button>
    <Button type="submit" name="intent" value="clear" variant="outline" formNoValidate disabled={disabled || pending || !hasPlan}>Clear review plan</Button>
  </div>;
}

export function ArticleReviewPlanForm({ postId, plan, available }: { postId: string; plan: ArticleReviewPlan | null; available: boolean }) {
  // Pin the displayed values and their token together. A different session's
  // update must require deliberate adoption, not silently replace typed fields.
  const [state, dispatch] = useReducer(reviewPlanEditorReducer, plan, initialReviewPlanEditor);
  const [refreshing, refresh] = useTransition();
  useEffect(() => { dispatch({ type: "server", plan }); }, [plan]);
  const disabled = !available || state.conflict || refreshing;
  async function action(form: FormData) {
    dispatch({ type: "saved", result: await saveArticleReviewPlan(postId, state, form) });
  }
  function adoptLatest() {
    refresh(async () => {
      try {
        const result = await refreshArticleReviewPlan(postId);
        dispatch(result.available ? { type: "adopt", plan: result.plan, serverPlan: plan } : { type: "refresh-error", message: reviewPlansUnavailable });
      } catch {
        dispatch({ type: "refresh-error", message: "The current review plan could not be loaded. Your planning fields were kept." });
      }
    });
  }
  return <section className="mt-8 rounded-xl border p-5" aria-labelledby="article-review-plan-heading">
    <h2 id="article-review-plan-heading" className="font-display text-lg font-semibold">Private review planning</h2>
    <p className="mt-2 text-sm text-muted-foreground">Record an article’s review interval and next due date. This plan is visible only to administrators. Saving it leaves article content and the public Updated date unchanged.</p>
    <p className="mt-2 text-sm text-muted-foreground">A due date does not confirm that anyone reviewed the law or approved the article. No reviewer or completed-review claim is recorded here.</p>
    {!available && <p className="mt-4 text-sm text-destructive" role="alert">{reviewPlansUnavailable}</p>}
    {(state.conflict || state.status === "error") && <div className="mt-4 rounded-lg border border-amber-500/50 p-3 text-sm">
      {state.conflict && <p role="alert">This plan changed in another session. Your typed fields are preserved. Load the current plan to compare before saving.</p>}
      <p>Loading replaces only unsaved planning fields. Article and SEO editor fields are preserved.</p>
      <Button type="button" variant="outline" className="mt-2" disabled={refreshing} onClick={adoptLatest}>{refreshing ? "Loading…" : "Load current review plan"}</Button>
    </div>}
    {state.message && <p className={`mt-4 text-sm ${state.status === "error" ? "text-destructive" : "text-muted-foreground"}`} role={state.status === "error" ? "alert" : "status"}>{state.message}</p>}
    <form action={action} className="mt-4 space-y-4">
      <input type="hidden" name="reviewPlanWorkflow" value="1" />
      <input type="hidden" name="expectedPlanId" value={state.plan?.id ?? ""} />
      <input type="hidden" name="expectedPlanVersion" value={state.plan?.version ?? ""} />
      <PlanFields disabled={disabled} values={state.values} onEdit={(field, value) => dispatch({ type: "edit", field, value })} />
      <PlanButtons disabled={disabled} hasPlan={!!state.plan} />
    </form>
  </section>;
}
