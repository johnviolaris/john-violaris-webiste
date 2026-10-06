import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BlogPostForm } from "@/components/admin/blog-post-form";
import { getBlogPost } from "@/lib/cms/admin-queries";
import { loadEditorData } from "@/lib/cms/blog/editor-data";
import {
  blogPostValuesFrom,
  sectionValuesFrom,
} from "@/lib/cms/blog/schema";
import { formatUkShortDateTime } from "@/lib/format";
import { publicationStatus } from "@/lib/cms/publication";
import { RevisionHistory } from "@/components/admin/revision-history";
import { SeoPanel } from "@/components/admin/seo-panel";
import { ArticleReviewPlanPanel } from "@/components/admin/article-review-plan-panel";

export const metadata: Metadata = {
  title: "Edit article",
};

export default async function EditBlogPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [post, { categories, services }] = await Promise.all([
    getBlogPost(id),
    loadEditorData(),
  ]);

  if (!post) notFound();

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pt-14 pb-12 md:px-8 md:pt-10">
      <header className="mb-6">
        <h1 className="font-display text-2xl font-semibold">Edit article</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Last edited{" "}
          <time dateTime={post.updated_at}>
            {formatUkShortDateTime(post.updated_at)}
          </time>
          .{" "}
          {publicationStatus(post) === "scheduled"
            ? "Publication is scheduled. This article is not yet visible to visitors."
            : publicationStatus(post) === "expired"
              ? "The publication window has ended. This article is not visible to visitors."
              : post.published ? "This article is live on the site."
                : "This article is a draft and is not visible to visitors."}
        </p>
      </header>

      <BlogPostForm
        // Keyed by id so navigating between two articles rebuilds the editor
        // rather than carrying the previous article's section rows across.
        key={post.id}
        post={{
          id: post.id,
          values: blogPostValuesFrom(post),
          sections: (post.content.body ?? []).map(sectionValuesFrom),
          faqItems: post.content.faqItems,
          published: post.published,
        }}
        categories={categories}
        services={services}
      />
      <ArticleReviewPlanPanel postId={post.id} />
      <RevisionHistory entity="blog_posts" id={post.id} previewPath={`/preview/blog/${post.id}`} />
      <SeoPanel path={`/blog/${post.slug}`} />
    </div>
  );
}
