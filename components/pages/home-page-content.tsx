import { CtaBanner } from "@/components/layout/cta-banner";
import { FeesPreview } from "@/components/sections/fees-preview";
import { Hero } from "@/components/sections/hero";
import { MeetJohn } from "@/components/sections/meet-john";
import { PoliceStation } from "@/components/sections/police-station";
import { ProcessSteps } from "@/components/sections/process-steps";
import { ServicesGrid } from "@/components/sections/services-grid";
import { Testimonials } from "@/components/sections/testimonials";
import { WhyInstruct } from "@/components/sections/why-instruct";
import { JsonLd } from "@/components/ui/json-ld";
import { graph, webPageNode } from "@/lib/cms/seo/json-ld";
import { structuredDataFor } from "@/lib/cms/seo/metadata";
import { resolveFrom } from "@/lib/cms/sections/resolve";
import {
  ctaDefaults,
  feesPreviewDefaults,
  heroDefaults,
  meetJohnDefaults,
  offenceStripDefaults,
  policeStationDefaults,
  processDefaults,
  servicesIntroDefaults,
  testimonialsIntroDefaults,
  whyInstructDefaults,
} from "@/lib/content/pages";

import type { PageContentGroups } from "@/lib/cms/sections/drafts";
import type { SiteConfig } from "@/lib/site-config";

export function HomePageContent({ content, config, structured }: { content: PageContentGroups; config: SiteConfig; structured?: Awaited<ReturnType<typeof structuredDataFor>> }) {
  const home = resolveFrom(content.home);
  const about = resolveFrom(content.about);
  const fees = resolveFrom(content.fees);
  const police = resolveFrom(content["police-station"]);
  const services = resolveFrom(content.services);
  const shared = resolveFrom(content.shared);

  return (
    <>
      {/* The practice and John, and nothing page-specific: the home page has
          no breadcrumb, and its questions are marked up on /fees, where they
          are edited, since Google wants a repeated FAQ marked up once. */}
      {structured && <JsonLd
        data={graph([
          ...structured.site,
          webPageNode({ page: structured.page, hasBreadcrumb: false }),
        ])}
      />}
      <Hero
        config={config}
        content={home("hero", heroDefaults)}
        strip={home("offence-strip", offenceStripDefaults)}
      />
      <ServicesGrid content={services("explorer", servicesIntroDefaults)} />
      <MeetJohn content={about("meet-john", meetJohnDefaults)} />
      <WhyInstruct content={home("why-instruct", whyInstructDefaults)} />
      <PoliceStation content={police("feature", policeStationDefaults)} />
      <ProcessSteps content={shared("process", processDefaults)} />
      <Testimonials content={home("testimonials", testimonialsIntroDefaults)} />
      <FeesPreview content={fees("preview", feesPreviewDefaults)} />
      <CtaBanner content={shared("cta", ctaDefaults)} config={config} />
    </>
  );
}
