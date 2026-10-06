import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { Icon } from "@/components/ui/icons";
import { SectionLabel } from "@/components/ui/section-label";
/*
 * The static configuration. The 404 renders outside the site layout, so there
 * is no provider to read from, and a not-found page is the wrong place to
 * start a query.
 */
import { fallbackSiteConfig } from "@/lib/site-config";

export default function NotFound() {
  return (
    <section className="flex min-h-[70vh] items-center bg-navy">
      <Container className="py-20 lg:py-24">
        <div className="max-w-xl">
          <SectionLabel>Page not found</SectionLabel>
          <h1 className="mt-4 font-display text-4xl font-bold text-cream">
            This page isn&rsquo;t here.
          </h1>
          <p className="mt-4 text-[15px] leading-[1.75] text-cream/60">
            The page you were looking for may have moved. If your matter is
            urgent — a court hearing tomorrow or a police interview today —
            please call rather than email.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <ButtonLink href="/" size="lg">
              Back to home
            </ButtonLink>
            {/*
              Until a number is confirmed this routes to the contact page
              rather than rendering the placeholder as a phone number.
            */}
            <ButtonLink href={fallbackSiteConfig.telHref} variant="outline" size="lg">
              <Icon name="call" size={15} />
              {fallbackSiteConfig.phoneE164
                ? `Call ${fallbackSiteConfig.phoneDisplay}`
                : "Urgent? Contact John"}
            </ButtonLink>
            <ButtonLink href="/services" variant="outline" size="lg">
              Explore services
            </ButtonLink>
            <ButtonLink href="/contact" variant="outline" size="lg">
              Contact John
            </ButtonLink>
          </div>
        </div>
      </Container>
    </section>
  );
}
