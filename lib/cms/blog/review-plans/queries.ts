import "server-only";
import { createAuthorizedAdminClient } from "@/lib/auth";
import { isReviewPlanId, type ArticleReviewPlan } from "@/lib/cms/blog/review-plans/schema";

export async function listArticleReviewPlans(): Promise<{ available: boolean; plans: ArticleReviewPlan[] }> {
  const client = await createAuthorizedAdminClient();
  try {
    const { data, error } = await client.from("article_review_plans").select("id,blog_post_id,interval_months,next_due_on,version,created_at,updated_at").order("next_due_on").returns<ArticleReviewPlan[]>();
    const available = !error && Array.isArray(data);
    return { available, plans: available ? data : [] };
  } catch {
    return { available: false, plans: [] };
  }
}

export async function getArticleReviewPlan(postId: string): Promise<{ available: boolean; plan: ArticleReviewPlan | null }> {
  const client = await createAuthorizedAdminClient();
  if (!isReviewPlanId(postId)) return { available: false, plan: null };
  try {
    const { data, error } = await client.from("article_review_plans").select("id,blog_post_id,interval_months,next_due_on,version,created_at,updated_at").eq("blog_post_id", postId).maybeSingle<ArticleReviewPlan>();
    return { available: !error, plan: error ? null : data };
  } catch {
    return { available: false, plan: null };
  }
}
