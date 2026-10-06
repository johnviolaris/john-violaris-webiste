"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/utils/supabase/server";
import { isReviewPlanId, readReviewPlanSubmission, reviewPlansUnavailable, type ArticleReviewPlan, type ReviewPlanState } from "@/lib/cms/blog/review-plans/schema";
import { getArticleReviewPlan } from "@/lib/cms/blog/review-plans/queries";

export async function refreshArticleReviewPlan(postId: string) {
  // Query helper independently verifies admin access before any protected read.
  return getArticleReviewPlan(postId);
}

export async function saveArticleReviewPlan(postId: string, previous: ReviewPlanState, form: FormData): Promise<ReviewPlanState> {
  // Independent of the admin page shell: this action is a public POST endpoint.
  await requireAdmin();
  const submission = readReviewPlanSubmission(form);
  if (!submission.ok) return { ...previous, status: "error", message: submission.error, values: submission.values };
  if (!isReviewPlanId(postId)) return { ...previous, status: "error", message: "Reload the article list before changing a review plan.", values: submission.values };
  let saved: ArticleReviewPlan | null;
  try {
    const client = await createClient();
    const { data, error } = await client.rpc("save_article_review_plan", {
      p_blog_post_id: postId, p_intent: submission.intent,
      p_interval_months: submission.intervalMonths, p_next_due_on: submission.nextDueOn,
      p_expected_id: submission.expectedId, p_expected_version: submission.expectedVersion,
    });
    if (error) {
      const message = error.code === "P0001" ? "The article or review plan changed. Reload and compare before saving."
        : ["42883", "42P01", "PGRST202", "PGRST205"].includes(error.code) ? reviewPlansUnavailable
          : "The review plan was not saved. Check your administrator session and reload before trying again.";
      return { ...previous, status: "error", message, values: submission.values };
    }
    saved = data as ArticleReviewPlan | null;
  } catch {
    return { ...previous, status: "error", message: "The review planning service could not be reached. Reload to check whether the plan was saved before trying again.", values: submission.values };
  }
  // A refresh failure must not misreport a confirmed database mutation as failed.
  let refreshMessage = "";
  try {
    revalidatePath(`/admin/blog-posts/${postId}`);
    revalidatePath("/admin/blog-posts");
  } catch {
    refreshMessage = " Reload the article list to refresh the planning summary.";
  }
  return { status: "success", message: (submission.intent === "clear" ? "Review plan cleared. Article content and Updated date are unchanged." : "Review plan saved. This records a due date, not a completed legal review.") + refreshMessage, values: submission.intent === "clear" ? { intervalMonths: "", nextDueOn: "" } : submission.values, plan: saved };
}
