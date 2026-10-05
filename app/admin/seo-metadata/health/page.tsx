import type { Metadata } from "next";
import Link from "next/link";
import { getSeoHealthReport } from "@/lib/cms/seo/health-report";

export const metadata: Metadata = { title: "SEO health" };

export default async function SeoHealthPage() {
  const { routes, issues } = await getSeoHealthReport();
  const counts = { error: 0, warning: 0, info: 0 };
  for (const issue of issues) counts[issue.severity]++;
  const groups = routes.map((route) => ({ ...route, issues: issues.filter((issue) => issue.path === route.path) })).filter((route) => route.issues.length > 0);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-14 pb-12 md:px-8 md:pt-10">
      <header className="mb-6">
        <Link href="/admin/seo-metadata" className="text-sm text-muted-foreground underline underline-offset-4">SEO metadata</Link>
        <h1 className="mt-2 font-display text-2xl font-semibold">SEO health</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">Checks the current published content and effective metadata for {routes.length} pages. Use this to spot missing or repeated search copy, image descriptions, invalid custom schema, links to unpublished pages and possible outcome promises.</p>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">These are CMS checks. They do not crawl external sites, test image dimensions, confirm rankings or replace review of legal accuracy and search engine structured-data eligibility. A warning needs review; deliberate noindex and alternate canonicals are informational.</p>
      </header>
      <dl className="mb-8 grid gap-3 sm:grid-cols-3">
        {(["error", "warning", "info"] as const).map((severity) => <div key={severity} className="rounded-xl border p-4"><dt className="text-sm capitalize text-muted-foreground">{severity === "info" ? "Information" : `${severity}s`}</dt><dd className="mt-1 text-3xl font-semibold tabular-nums">{counts[severity]}</dd></div>)}
      </dl>
      {groups.length === 0 ? <p className="rounded-xl border p-5">No issues were found in these checks.</p> : <div className="space-y-5">{groups.map((route) => <section key={route.path} className="rounded-xl border p-5" aria-labelledby={`health-${encodeURIComponent(route.path)}`}>
        <h2 id={`health-${encodeURIComponent(route.path)}`} className="font-display text-lg font-semibold"><Link href={`/admin/seo-metadata/edit?path=${encodeURIComponent(route.path)}`} className="underline underline-offset-4">{route.label}</Link></h2>
        <p className="mt-1 font-mono text-xs text-muted-foreground">{route.path}</p>
        <ul className="mt-3 space-y-2 text-sm">{route.issues.map((issue, index) => <li key={`${issue.code}-${index}`} className="flex items-start gap-2"><span className={`shrink-0 rounded border px-2 py-0.5 text-xs capitalize ${issue.severity === "error" ? "border-destructive/30 text-destructive" : issue.severity === "warning" ? "border-amber-600/30 text-amber-800 dark:text-amber-300" : "text-muted-foreground"}`}>{issue.severity === "info" ? "Info" : issue.severity}</span><span>{issue.message}</span></li>)}</ul>
      </section>)}</div>}
      <p className="mt-6 text-sm text-muted-foreground">Content findings are edited under <Link href="/admin/service-pages" className="underline underline-offset-4">Service pages</Link>, <Link href="/admin/blog-posts" className="underline underline-offset-4">Blog posts</Link> or <Link href="/admin/website-content" className="underline underline-offset-4">Website content</Link>. Reload this page after saving to check again.</p>
    </div>
  );
}
