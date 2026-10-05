import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getServiceDescriptions, getServiceGroups, getSiteConfig } from "@/lib/cms/queries";
import { SiteConfigProvider } from "@/components/layout/site-config-provider";
import { ServiceCatalogueProvider } from "@/components/layout/service-catalogue-provider";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { UtilityBar } from "@/components/layout/utility-bar";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Private content preview",
  robots: { index: false, follow: false, noarchive: true },
};

export default async function PreviewLayout({ children }: { children: ReactNode }) {
  await requireAdmin();
  const [config, groups, descriptions] = await Promise.all([
    getSiteConfig(), getServiceGroups(), getServiceDescriptions(),
  ]);
  return (
    <SiteConfigProvider config={config}>
      <ServiceCatalogueProvider catalogue={{ groups, descriptions }}>
        <div className="min-h-screen bg-cream">
          <aside role="status" className="bg-navy px-4 py-3 text-center text-sm text-white">
            Private preview of saved content. Unsaved edits are not shown. {" "}
            <Link href="/admin" className="underline underline-offset-4">Return to dashboard</Link>
          </aside>
          <UtilityBar config={config} />
          <SiteHeader />
          <main id="main">{children}</main>
          <SiteFooter config={config} services={groups.flatMap((group) => group.services)} />
        </div>
      </ServiceCatalogueProvider>
    </SiteConfigProvider>
  );
}
