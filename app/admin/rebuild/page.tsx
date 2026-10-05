import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { listSeoRoutes } from "@/lib/cms/seo/routes";
import { RebuildForm } from "@/components/admin/rebuild-form";

export const metadata: Metadata = { title: "Refresh pages" };
export default async function RebuildPage() {
  await requireAdmin();
  const routes = await listSeoRoutes();
  return <div className="mx-auto max-w-3xl space-y-6 px-4 pt-14 pb-12 md:px-8 md:pt-10"><header><h1 className="font-display text-2xl font-semibold">Refresh pages</h1><p className="mt-2 text-sm text-muted-foreground">CMS saves normally refresh the affected pages automatically. Use this if an external database change has left the website showing older content.</p></header><RebuildForm routes={routes.map(({ path, label }) => ({ path, label }))} /></div>;
}
