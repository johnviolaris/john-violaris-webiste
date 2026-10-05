"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { formError, formSuccess, readFields, type CmsFormState } from "@/lib/cms/form";
import { listSeoRoutes } from "@/lib/cms/seo/routes";

export async function rebuildPublicPages(_previous: CmsFormState<"path">, formData: FormData): Promise<CmsFormState<"path">> {
  await requireAdmin();
  const values = readFields(formData, ["path"] as const);
  if (values.path === "all") {
    revalidatePath("/", "layout");
    revalidatePath("/share-image");
  } else {
    const routes = await listSeoRoutes();
    if (!routes.some((route) => route.path === values.path)) return formError(values, { path: "Choose a published public page or the whole site." });
    revalidatePath(values.path);
  }
  revalidatePath("/sitemap.xml");
  return formSuccess(values, "Refresh requested. The selected pages and sitemap regenerate on their next visit.");
}
