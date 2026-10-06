import { ArticleReviewPlanForm } from "@/components/admin/article-review-plan-form";
import { getArticleReviewPlan } from "@/lib/cms/blog/review-plans/queries";

export async function ArticleReviewPlanPanel({ postId }: { postId: string }) {
  const result = await getArticleReviewPlan(postId);
  return <ArticleReviewPlanForm key={postId} postId={postId} plan={result.plan} available={result.available} />;
}
