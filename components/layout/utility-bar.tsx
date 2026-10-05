import { IntentLink as Link } from "@/components/ui/intent-link";

import { Icon } from "@/components/ui/icons";
import { whatsappHref, type SiteConfig } from "@/lib/site-config";

/**
 * Slim contact rail above the masthead.
 *
 * Every reference firm surfaces a way to make contact before the visitor has
 * scrolled anywhere — a phone number in the masthead, a hours/response block,
 * a persistent chat tab. This is that idea in the site's own register: the
 * consultation promise on the left, live contact routes on the right.
 *
 * Only routes that are actually configured are rendered. A number that has not
 * been confirmed yet is simply absent rather than shown as a dead placeholder;
 * email always works, so the bar never renders empty.
 */
export function UtilityBar({ config }: { config: SiteConfig }) {
  const whatsapp = whatsappHref(config);

  return (
    <div
      className="utility-bar"
      data-track="utility_bar"
      role="region"
      aria-label="Contact details and consultation"
    >
      <div className="utility-bar-inner">
        <p className="utility-promise">
          <span className="utility-dot" aria-hidden="true" />
          Free initial consultation
          <span className="utility-response">
            <span aria-hidden="true">·</span> {config.responseTime}
          </span>
        </p>

        <div className="utility-actions">
          {config.phoneE164 ? (
            <a href={config.telHref}>
              <Icon name="call" size={13} />
              {config.phoneDisplay}
            </a>
          ) : (
            <Link href="/contact#urgent">
              <Icon name="call" size={13} />
              Urgent hearing or interview?
            </Link>
          )}
          <a href={config.mailtoHref} className="utility-email">
            <Icon name="mail" size={13} />
            {config.email}
          </a>
          {whatsapp ? (
            <a href={whatsapp} target="_blank" rel="noopener noreferrer">
              <Icon name="whatsapp" size={13} />
              WhatsApp
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
