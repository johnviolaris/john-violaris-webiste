import type { Metadata } from "next";
import Link from "next/link";

import { ClickableRow } from "@/components/admin/clickable-row";
import { listSeoMetadataForEditor as listSeoMetadata } from "@/lib/cms/seo/admin-queries";
import { getSiteConfig } from "@/lib/cms/queries";
import { titleSuffix } from "@/lib/cms/seo/resolve";
import {
  listSeoRoutes,
  type SeoRoute,
  type SeoRouteGroup,
} from "@/lib/cms/seo/routes";
import type { SeoContent } from "@/lib/cms/types";

export const metadata: Metadata = {
  title: "SEO metadata",
};

const groups: { key: SeoRouteGroup; description: string }[] = [
  { key: "Pages", description: "The fixed pages of the site." },
  { key: "Services", description: "One for each published service." },
  { key: "Articles", description: "One for each published article." },
  { key: "Locations", description: "Bespoke, reviewed location pages only. Drafts are private." },
];

/** The link to a route's editor. Paths contain slashes, so they ride the query. */
function editHref(path: string): string {
  return `/admin/seo-metadata/edit?path=${encodeURIComponent(path)}`;
}

export default async function AdminSeoPage() {
  const [routes, rows, config] = await Promise.all([
    listSeoRoutes(),
    listSeoMetadata(),
    getSiteConfig(),
  ]);

  const overrides = new Map(rows.map((row) => [row.path, row.content]));
  const suffix = titleSuffix(config.name);
  const customised = routes.filter((route) => overrides.has(route.path)).length;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-14 pb-12 md:px-8 md:pt-10">
      <header className="mb-6">
        <h1 className="font-display text-2xl font-semibold">SEO metadata</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          How each page appears in Google and when its link is shared — on
          WhatsApp, for instance. Every page already has a title and a
          description from its own heading and standfirst; set one here only
          to say something different.{" "}
          {customised === 0
            ? "No page has been customised yet."
            : `${customised} of ${routes.length} ${customised === 1 ? "page has" : "pages have"} been customised.`}
        </p>
        <Link href="/admin/seo-metadata/health" className="mt-3 inline-block text-sm font-medium underline underline-offset-4">Review SEO health</Link>
        <Link href="/admin/seo-metadata/robots" className="mt-3 ml-5 inline-block text-sm font-medium underline underline-offset-4">Crawl rules</Link>
      </header>

      <div className="space-y-8">
        {groups.map(({ key, description }, groupIndex) => {
          const members = routes.filter((route) => route.group === key);

          if (members.length === 0) return null;

          return (
            <section key={key} aria-labelledby={`seo-group-${groupIndex}`}>
              <div className="mb-2 flex flex-wrap items-baseline gap-x-3">
                <h2
                  id={`seo-group-${groupIndex}`}
                  className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase"
                >
                  {key}
                </h2>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
              <div className="overflow-x-auto rounded-xl border">
                <table className="w-full min-w-[48rem] border-collapse text-sm">
                  <caption className="sr-only">
                    {key}, with the title and description each shows in search
                  </caption>
                  <thead>
                    <tr className="border-b bg-muted/50 text-left">
                      <th scope="col" className="w-56 px-4 py-2.5 font-medium">
                        Page
                      </th>
                      <th scope="col" className="px-4 py-2.5 font-medium">
                        In search results
                      </th>
                      <th scope="col" className="w-36 px-4 py-2.5 font-medium">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((route) => (
                      <Row
                        key={route.path}
                        route={route}
                        override={overrides.get(route.path) ?? null}
                        suffix={suffix}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })}
      </div>

      <p className="mt-6 max-w-2xl text-sm text-muted-foreground">
        Pages appear here once they are published. The sitemap search engines
        read, <span className="font-mono">/sitemap.xml</span>, is built from
        this same list and leaves out any page hidden from search.
      </p>
    </div>
  );
}

function Row({
  route,
  override,
  suffix,
}: {
  route: SeoRoute;
  override: SeoContent | null;
  suffix: string;
}) {
  const title = override?.title ?? route.defaults.title;
  const description = override?.description ?? route.defaults.description;
  const href = editHref(route.path);

  return (
    <ClickableRow href={href}>
      <td className="px-4 py-3 align-top">
        <Link
          href={href}
          className="font-medium underline-offset-4 hover:underline focus-visible:underline"
        >
          {route.label}
        </Link>
        <span className="mt-0.5 block font-mono text-xs break-all text-muted-foreground">
          {route.path}
        </span>
      </td>
      <td className="px-4 py-3 align-top">
        <span className="block">
          {title}
          <span className="text-muted-foreground">{suffix}</span>
        </span>
        <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">
          {description ?? "No description — search engines will choose one."}
        </span>
      </td>
      <td className="px-4 py-3 align-top">
        <span className="flex flex-col items-start gap-1">
          <Badge tone={override ? "custom" : "default"}>
            {override ? "Customised" : "Defaults"}
          </Badge>
          {override?.noIndex ? (
            <Badge tone="warning">Hidden from search</Badge>
          ) : null}
        </span>
      </td>
    </ClickableRow>
  );
}

function Badge({
  tone,
  children,
}: {
  tone: "custom" | "default" | "warning";
  children: React.ReactNode;
}) {
  const styles = {
    custom: "border-primary/30 bg-primary/10 text-primary",
    default: "border-border bg-muted/50 text-muted-foreground",
    warning: "border-destructive/30 bg-destructive/5 text-destructive",
  }[tone];

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${styles}`}
    >
      {children}
    </span>
  );
}
