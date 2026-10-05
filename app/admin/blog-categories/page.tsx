import type { Metadata } from "next";
import Link from "next/link";

import { BlogCategoryManager } from "@/components/admin/blog-category-manager";
import { RevisionHistory } from "@/components/admin/revision-history";
import {
  countPostsByCategory,
  listBlogCategories,
} from "@/lib/cms/admin-queries";

export const metadata: Metadata = {
  title: "Blog categories",
};

export default async function AdminBlogCategoriesPage() {
  const [categories, counts] = await Promise.all([
    listBlogCategories(),
    countPostsByCategory(),
  ]);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-14 pb-12 md:px-8 md:pt-10">
      <header className="mb-6">
        <h1 className="font-display text-2xl font-semibold">Blog categories</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          The label shown on each article card. Renaming one updates every
          article using it. Categories are optional — an article without one is
          simply listed without a label.{" "}
          <Link
            href="/admin/blog-posts"
            className="underline underline-offset-4 hover:text-foreground"
          >
            Back to articles
          </Link>
          .
        </p>
      </header>

      <BlogCategoryManager
        categories={categories.map((category) => ({
          id: category.id,
          name: category.name,
          slug: category.slug,
          postCount: counts[category.id] ?? 0,
        }))}
      />
      <RevisionHistory entity="blog_categories" id="" />
    </div>
  );
}
