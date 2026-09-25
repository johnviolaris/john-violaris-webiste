import Link from "next/link";
import { CookieSettingsButton } from "@/components/layout/analytics";
import { Container } from "@/components/ui/container";
import { Logo } from "@/components/layout/logo";
import type { Service } from "@/lib/content/services";
import { footerNav, type SiteConfig } from "@/lib/site-config";

export function SiteFooter({
  config,
  services,
}: {
  config: SiteConfig;
  /** The published catalogue, flat, for the services column. */
  services: Service[];
}) {
  return (
    <footer className="editorial-footer" data-track="footer">
      <Container>
        <div className="footer-grid">
          <div className="footer-identity">
            <Logo name={config.name} role={config.role} />
            <p>
              Personal representation.
              <br />
              Clear advice. Direct access.
            </p>
            <span>
              Criminal defence & motoring offences
              <br />
              Across England & Wales
            </span>
          </div>
          {footerNav(services).map((column) => (
            <nav
              key={column.heading}
              className={column.wide ? "footer-services" : undefined}
              aria-label={`Footer ${column.heading}`}
            >
              <p className="eyebrow">{column.heading}</p>
              <ul>
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
          <div className="footer-contact">
            <p className="eyebrow">Your next step</p>
            <p>
              A conversation with John.
              <br />
              Free, confidential and without obligation.
            </p>
            <Link href={config.bookingHref}>
              Arrange a consultation <span>↗</span>
            </Link>

            {/*
              The practical detail the reference firms all publish — how to
              reach someone, how quickly they answer, where they work. Only
              confirmed routes appear.
            */}
            <dl className="footer-facts">
              <div>
                <dt>Email</dt>
                <dd>
                  <a href={config.mailtoHref}>{config.email}</a>
                </dd>
              </div>
              {config.phoneE164 ? (
                <div>
                  <dt>Telephone</dt>
                  <dd>
                    <a href={config.telHref}>{config.phoneDisplay}</a>
                  </dd>
                </div>
              ) : null}
              <div>
                <dt>Response</dt>
                <dd>{config.responseTime}</dd>
              </div>
              <div>
                <dt>Coverage</dt>
                <dd>{config.jurisdiction}</dd>
              </div>
            </dl>
          </div>
        </div>
        <div className="footer-bottom">
          <p>
            © {new Date().getFullYear()} John Violaris. All rights reserved.
          </p>
          <span>
            {[
              config.qualifiedYear && `Qualified since ${config.qualifiedYear}`,
              config.sraNumber && `SRA no. ${config.sraNumber}`,
            ]
              .filter(Boolean)
              .join(" · ")}
          </span>
          <nav className="footer-bottom-links" aria-label="Legal">
            <Link href="/cookies">Cookie policy</Link>
            <CookieSettingsButton />
          </nav>
          <a href="#main">Back to top ↑</a>
        </div>
        <p className="footer-legal">
          The information on this website is general guidance and is not legal
          advice for your specific circumstances. No outcome is guaranteed in
          any case.
        </p>
      </Container>
    </footer>
  );
}
