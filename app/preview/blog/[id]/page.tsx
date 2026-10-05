import { notFound } from "next/navigation";
import { ArticlePageContent } from "@/components/pages/article-page-content";
import { getBlogPost, listBlogCategories } from "@/lib/cms/admin-queries";
import { getArticles, getServices, getSiteConfig } from "@/lib/cms/queries";
import { toArticle } from "@/lib/cms/mappers";
import { getContentRevision } from "@/lib/cms/revisions/queries";
import type { BlogPostRow } from "@/lib/cms/types";
import { getMediaAssetForUrl } from "@/lib/cms/media/queries";
import { mediaPresentation } from "@/lib/cms/media/schema";

export default async function PreviewArticle({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ revision?: string }> }) {
  const { id } = await params;
  // Every draft read independently verifies the admin; layouts render in parallel.
  const current = await getBlogPost(id);
  if (!current) notFound();
  const { revision } = await searchParams;
  const post = revision
    ? await getContentRevision("blog_posts", id, revision) as BlogPostRow | null
    : current;
  if (!post) notFound();
  // The public page uses current library descriptions too. This lookup is
  // independently admin-authorized, so draft asset captions stay private.
  const asset = post.content.featuredImage ? await getMediaAssetForUrl(post.content.featuredImage) : null;
  const image = asset ? mediaPresentation(asset) : null;
  const presented = image ? { ...post, content: { ...post.content, featuredImageAlt: image.alt, featuredImageTitle: image.title, featuredImageCaption: image.caption, featuredImageCaptionFormat: image.captionFormat } } : post;
  const [categories, articles, services, config] = await Promise.all([
    listBlogCategories(), getArticles(), getServices(), getSiteConfig(),
  ]);
  const category = categories.find((item) => item.id === post.category_id)?.name ?? "Guides";
  return <>
    {revision && <p role="status" className="bg-gold px-4 py-3 text-center text-sm">Historical version preview. Article content is from this version; image descriptions use the current media library, as on the public website.</p>}
    <ArticlePageContent article={toArticle(presented, category)} articles={articles}
      services={services} config={config} preview updatedAt={post.updated_at} />
  </>;
}
