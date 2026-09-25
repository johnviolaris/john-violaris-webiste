import type { ReactNode } from "react";

import { Analytics } from "@/components/layout/analytics";
import { MobileContactBar } from "@/components/layout/mobile-contact-bar";
import { ServiceCatalogueProvider } from "@/components/layout/service-catalogue-provider";
import { SiteConfigProvider } from "@/components/layout/site-config-provider";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { UtilityBar } from "@/components/layout/utility-bar";
import { ReviewSolicitorsWidget } from "@/components/ui/review-solicitors";
import {
  getServiceDescriptions,
  getServiceGroups,
  getSiteConfig,
} from "@/lib/cms/queries";

/**
 * The one place the site configuration and the service catalogue are read for
 * the public pages.
 *
 * Both reads are cached, so a page that wants either gets the same answer
 * without a second round trip — and the groups and the descriptions come from
 * the same query. The providers carry them to the client components in here —
 * the header, the menu, the docked contact bar — which cannot read them for
 * themselves.
 */
export default async function SiteLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [config, groups, descriptions] = await Promise.all([
    getSiteConfig(),
    getServiceGroups(),
    getServiceDescriptions(),
  ]);

  return (
    <SiteConfigProvider config={config}>
      <ServiceCatalogueProvider catalogue={{ groups, descriptions }}>
        <div className="flex min-h-full flex-col bg-cream">
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-100 focus:rounded-sharp focus:bg-gold focus:px-4 focus:py-2 focus:text-xs focus:font-bold focus:tracking-wider focus:text-navy focus:uppercase"
          >
            Skip to content
          </a>
          <UtilityBar config={config} />
          <SiteHeader />
          <main id="main" className="flex-1">
            {children}
          </main>
          <SiteFooter
            config={config}
            services={groups.flatMap((group) => group.services)}
          />
          <MobileContactBar />
          {/* Directly after the contact bar: the banner's CSS finds the bar
              with a sibling selector and sits above it, so the urgent-contact
              route is never hidden behind a cookie question (REQ-054). */}
          <Analytics />
          {/*
          ReviewSolicitors pins this to the right edge of the viewport, vertically
          centred, so it clears the contact bar docked along the bottom. It lives
          in the layout rather than on a page so the tab survives client-side
          navigation instead of reloading itself on every route change.
        */}
          <ReviewSolicitorsWidget widget="side" elementId="rswidget_35c26" />
        </div>
      </ServiceCatalogueProvider>
    </SiteConfigProvider>
  );
}
