"use server";

import { revalidatePath } from "next/cache";
import { createAuthorizedSeoClient } from "@/lib/auth";
import { describeDatabaseError, formError, formFailure, formSuccess, readCheckbox, type CmsFormState } from "@/lib/cms/form";
import { listSeoMetadataForEditor } from "@/lib/cms/seo/admin-queries";
import { listSeoRoutes } from "@/lib/cms/seo/routes";
import { defaultCrawlSettings, isCrawlBlocked, noIndexCrawlConflicts, parseCrawlSettings } from "@/lib/cms/seo/robots";

export async function saveCrawlRules(_previous: CmsFormState<"rules">, formData: FormData): Promise<CmsFormState<"rules">> {
  const supabase = await createAuthorizedSeoClient();
  const reset = formData.get("intent") === "reset";
  const raw = formData.get("rules");
  const values = { rules: reset ? JSON.stringify(defaultCrawlSettings, null, 2) : typeof raw === "string" ? raw.trim() : "" };
  const checked = parseCrawlSettings(values.rules);
  if (!checked.ok) return formError(values, { rules: checked.error });
  const [routes, rows] = await Promise.all([listSeoRoutes(), listSeoMetadataForEditor()]);
  const conflicts = noIndexCrawlConflicts(checked.settings, rows.filter((row) => row.content.noIndex).map((row) => row.path));
  if (conflicts.length) return formError(values, { rules: `These pages use noindex and must stay crawlable: ${conflicts.join(", ")}. Remove their crawl block or their noindex setting.` });
  const blocked = routes.filter((route) => checked.settings.rules.some((rule) => isCrawlBlocked(route.path, checked.settings, rule.userAgent)));
  if (blocked.length && !readCheckbox(formData, "confirmRestrictions")) return formError(values, { rules: `These rules block ${blocked.length} public pages for at least one crawler. Review the preview and confirm that restriction before saving.` });
  try {
    const { data, error } = await supabase.from("site_settings").upsert({ key: "robots", value: checked.settings }, { onConflict: "key" }).select("key");
    if (error) return formFailure(values, describeDatabaseError(error));
    if (!data?.length) return formFailure(values, "No crawl settings were saved. Reload and check your access.");
    revalidatePath("/robots.txt");
    revalidatePath("/admin/seo-metadata/robots");
    revalidatePath("/admin/seo-metadata/health");
    return formSuccess({ rules: JSON.stringify(checked.settings, null, 2) }, reset ? "Default crawl rules restored." : "Crawl rules saved. Search engines may cache the previous file for a while.");
  } catch { return formFailure(values, "Crawl settings could not be saved. Try again when the database is available."); }
}
