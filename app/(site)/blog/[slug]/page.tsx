import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticlePageContent } from "@/components/pages/article-page-content";
import { getArticle, getArticles, getServices, getSiteConfig } from "@/lib/cms/queries";
import { redirectFromCms } from "@/lib/cms/redirects";
import { seoMetadataFor } from "@/lib/cms/seo/metadata";

// Refresh articles at publication and expiry boundaries without requiring a deploy.
export const revalidate = 60;

/**
 * Prerender every published article at build time.
 *
 * `dynamicParams` is left at its default, so an article published after the
 * build renders on first request rather than 404ing while it waits for a
 * deploy. The publish action revalidates its path either way.
 */
export async function generateStaticParams() {
  const articles = await getArticles();

  return articles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  // The headline, the excerpt and the featured image, from the route registry
  // and any SEO override. An unpublished or missing article gets nothing.
  return seoMetadataFor(`/blog/${slug}`);
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const path = `/blog/${slug}`;

  const [article, articles, services, config] = await Promise.all([
    getArticle(slug),
    getArticles(),
    getServices(),
    getSiteConfig(),
  ]);

  if (!article) {
    await redirectFromCms(path);
    notFound();
  }

  return <ArticlePageContent article={article} articles={articles} services={services} config={config} />;
}
