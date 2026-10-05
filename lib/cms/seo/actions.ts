"use server";

import { requireSeoEditor } from "@/lib/auth";
import { listSeoMetadataForEditor as listSeoMetadata } from "@/lib/cms/seo/admin-queries";
import { getSiteConfig, getSiteSettings } from "@/lib/cms/queries";
import { analyseSeoHealth } from "@/lib/cms/seo/health";
import {
  formError,
  formFailure,
  readCheckbox,
  readFields,
} from "@/lib/cms/form";
import { listSeoRoutes } from "@/lib/cms/seo/routes";
import { findEditableSeoRoute } from "@/lib/cms/seo/admin-routes";
import { publicationSeoWarnings } from "@/lib/cms/seo/publication-warnings";
import { noIndexCrawlConflicts, resolvedCrawlSettings } from "@/lib/cms/seo/robots";
import { validateSeoContent } from "@/lib/cms/seo/content-validation";
import { deployment } from "@/lib/site-config";
import {
  emptySeoValues,
  seoFields,
  type SeoFormState,
} from "@/lib/cms/seo/schema";
import { seoWrite } from "@/lib/cms/seo/write";

/**
 * SEO override mutations.
 *
 * An override is keyed by the page's path, and the path arrives in the form.
 * A Server Action is a public endpoint, so the path is looked up in the route
 * registry before anything is written: an address that is not a public page is
 * refused, rather than accepted into a table the site then reads from.
 *
 * `revalidate.ts` already rebuilds the sitemap for this entity; each write adds
 * the page itself.
 */

function readPath(formData: FormData): string {
  const value = formData.get("path");

  return typeof value === "string" ? value : "";
}

export async function saveSeo(
  _previous: SeoFormState,
  formData: FormData,
): Promise<SeoFormState> {
  await requireSeoEditor();

  const path = readPath(formData);
  const submitted = readFields(formData, seoFields);

  const route = await findEditableSeoRoute(path);
  if (!route) {
    return formFailure(
      submitted,
      "That page is not one this site publishes. Reload the list and try again.",
    );
  }

  /*
   * "Reset to defaults" is this form's second submit button rather than a form
   * of its own, so its answer comes back through the editor's state — which
   * is how the editor knows to empty the fields that still hold the override
   * it just removed. Deleting rather than blanking, for the reason below.
   */
  if (formData.get("intent") === "reset") {
    const state = await seoWrite({
      values: emptySeoValues,
      successMessage: "Reset. The page uses its defaults again.",
      paths: [path],
      allowEmpty: true,
      run: async (supabase) =>
        supabase.from("seo_metadata").delete().eq("path", path).select("path"),
    });

    return {
      status: state.status,
      message: state.message,
      fieldErrors: state.fieldErrors,
      values: state.status === "success" ? emptySeoValues : submitted,
      reset: state.status === "success",
    };
  }

  const noIndex = readCheckbox(formData, "noIndex");
  const noFollow = readCheckbox(formData, "noFollow");

  const checked = validateSeoContent({ ...submitted, noIndex, noFollow }, path, deployment.url);
  if (!checked.ok) return formError(submitted, checked.fieldErrors, checked.error);
  const { values, content } = checked;

  const isEmpty = Object.keys(content).length === 0;

  const state = await seoWrite({
    values,
    successMessage: isEmpty
      ? "Saved. With nothing overridden, the page uses its defaults."
      : "SEO settings saved.",
    paths: [path],
    allowEmpty: isEmpty,
    // An override with nothing in it is no override: the row is removed rather
    // than kept empty, so "has this page been customised?" is simply "does it
    // have a row?" — which is what the list shows.
    run: async (supabase) =>
      isEmpty
        ? supabase.from("seo_metadata").delete().eq("path", path).select("path")
        : supabase
            .from("seo_metadata")
            .upsert({ path, content }, { onConflict: "path" })
            .select("path"),
  });

  let warnings: string[] = [];
  if (state.status === "success") {
    const [routes, rows, config, settings] = await Promise.all([listSeoRoutes(), listSeoMetadata(), getSiteConfig(), getSiteSettings()]);
    warnings = analyseSeoHealth({ routes, overrides: Object.fromEntries(rows.map((row) => [row.path, row.content])), siteName: config.name, siteUrl: deployment.url })
      .filter((issue) => issue.path === path && issue.code.startsWith("duplicate-"))
      .map((issue) => issue.message);
    warnings.push(...publicationSeoWarnings({ path, defaults: route.defaults, override: content, siteName: config.name, siteUrl: deployment.url, knownRoutes: routes }));
    if (content.noIndex && noIndexCrawlConflicts(resolvedCrawlSettings(settings.robots), [path]).length) warnings.push("This page is blocked by crawl rules, so crawlers cannot read its noindex directive. Remove the crawl block when hiding it from search.");
    warnings = [...new Set(warnings)];
  }

  // Rebuilt field by field rather than spread: `data` stays on the server.
  return {
    status: state.status,
    message: state.message,
    fieldErrors: state.fieldErrors,
    values: state.values,
    warnings,
  };
}
