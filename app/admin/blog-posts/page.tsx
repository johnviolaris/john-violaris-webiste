import type { Metadata } from "next";
import Link from "next/link";
import { FileText, Plus } from "lucide-react";

import { PublishToggle } from "@/components/admin/publish-toggle";
import { ClickableRow } from "@/components/admin/clickable-row";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "cn";
import { listBlogPosts } from "@/lib/cms/admin-queries";
import { setBlogPostPublished } from "@/lib/cms/blog/actions";
import { formatUkShortDateTime } from "@/lib/format";
import { publicationStatus } from "@/lib/cms/publication";

export const metadata: Metadata = {
  title: "Blog posts",
};

type Filter = "all" | "published" | "draft";

const filters: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "published", label: "Published" },
  { value: "draft", label: "Drafts" },
];

function isFilter(value: unknown): value is Filter {
  return value === "all" || value === "published" || value === "draft";
}

export default async function AdminBlogPostsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const filter: Filter = isFilter(status) ? status : "all";

  // Filtered here rather than in the query: the whole list is one small read,
  // and the counts on the tabs need every row anyway.
  const all = await listBlogPosts();
  const posts = all.filter((post) =>
    filter === "all" ? true : filter === "published" ? post.published : !post.published,
  );

  const counts = {
    all: all.length,
    published: all.filter((post) => post.published).length,
    draft: all.filter((post) => !post.published).length,
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-14 pb-12 md:px-8 md:pt-10">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold">Blog posts</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            The guides published under Resources. A draft is invisible to
            visitors — write it here, publish it when it is ready, and unpublish
            it again at any time.
          </p>
        </div>
        <Link
          href="/admin/blog-posts/new"
          className={cn(buttonVariants({ size: "sm" }), "shrink-0")}
        >
          <Plus aria-hidden="true" />
          New article
        </Link>
      </header>

      <nav className="mb-5 flex flex-wrap gap-1.5" aria-label="Filter articles">
        {filters.map((item) => {
          const isActive = item.value === filter;

          return (
            <Link
              key={item.value}
              href={
                item.value === "all"
                  ? "/admin/blog-posts"
                  : `/admin/blog-posts?status=${item.value}`
              }
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors",
                isActive
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background hover:bg-muted",
              )}
            >
              {item.label}
              <span
                className={cn(
                  "text-xs tabular-nums",
                  isActive ? "opacity-70" : "text-muted-foreground",
                )}
              >
                {counts[item.value]}
              </span>
            </Link>
          );
        })}
      </nav>

      {posts.length === 0 ? (
        <div className="grid place-items-center gap-3 rounded-xl border border-dashed px-6 py-16 text-center">
          <FileText className="size-7 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm font-medium">
            {filter === "all" ? "No articles yet." : `No ${filter} articles.`}
          </p>
          <p className="max-w-sm text-sm text-muted-foreground">
            {filter === "all"
              ? "Write the first one and it will appear under Resources once published."
              : "Try another filter to see the rest."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[44rem] border-collapse text-sm">
            <caption className="sr-only">
              Articles, most recently edited first
            </caption>
            <thead>
              <tr className="border-b bg-muted/50 text-left">
                <th scope="col" className="px-4 py-2.5 font-medium">
                  Status
                </th>
                <th scope="col" className="px-4 py-2.5 font-medium">
                  Title
                </th>
                <th scope="col" className="px-4 py-2.5 font-medium">
                  Category
                </th>
                <th scope="col" className="px-4 py-2.5 font-medium">
                  Last edited
                </th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <ClickableRow key={post.id} href={`/admin/blog-posts/${post.id}`}>
                  <td className="px-4 py-3 align-top">
                    <PublishToggle
                      id={post.id}
                      label={post.title}
                      published={post.published}
                      action={setBlogPostPublished}
                    />
                    <span className="mt-1 block text-xs capitalize text-muted-foreground">{publicationStatus(post)}</span>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <Link
                      href={`/admin/blog-posts/${post.id}`}
                      className="font-medium underline-offset-4 hover:underline focus-visible:underline"
                    >
                      {post.title}
                    </Link>
                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                      /blog/{post.slug}
                    </span>
                  </td>
                  <td className="px-4 py-3 align-top text-muted-foreground">
                    {post.blog_categories?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 align-top whitespace-nowrap text-muted-foreground">
                    <time dateTime={post.updated_at}>
                      {formatUkShortDateTime(post.updated_at)}
                    </time>
                  </td>
                </ClickableRow>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
