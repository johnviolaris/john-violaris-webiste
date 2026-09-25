"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Icon } from "@/components/ui/icons";
import type { IconName } from "@/components/ui/icons";
import { useSiteConfig } from "@/components/layout/site-config-provider";
import { whatsappHref } from "@/lib/site-config";

type Action = {
  label: string;
  href: string;
  icon: IconName;
  external?: boolean;
};

/**
 * Persistent contact bar for small screens.
 *
 * Adapted from the always-available contact affordance the reference firms keep
 * on screen (a masthead call number on desktop, a docked chat tab). Someone
 * reading this site has often just been arrested or served with a court date;
 * they should never have to hunt for the way to make contact.
 *
 * It stays out of the way until the hero has been scrolled past, so it does not
 * compete with the opening statement, and it only offers routes that are
 * configured — the consultation link is the constant.
 */
export function MobileContactBar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 420);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const config = useSiteConfig();
  const whatsapp = whatsappHref(config);

  const actions: Action[] = [];
  if (config.phoneE164) {
    actions.push({ label: "Call", href: config.telHref, icon: "call" });
  }
  if (whatsapp) {
    actions.push({
      label: "WhatsApp",
      href: whatsapp,
      icon: "whatsapp",
      external: true,
    });
  }
  if (actions.length === 0) {
    actions.push({ label: "Email", href: config.mailtoHref, icon: "mail" });
  }

  return (
    <div
      className="mobile-contact-bar"
      data-track="mobile_bar"
      data-visible={visible ? "true" : "false"}
      // Hidden from assistive technology while off screen; every link here is
      // also reachable from the header drawer and the footer.
      aria-hidden={!visible}
      inert={!visible}
    >
      <Link href={config.bookingHref} className="mobile-contact-primary">
        <Icon name="calendar" size={16} />
        Free consultation
      </Link>
      {actions.map((action) => (
        <a
          key={action.label}
          href={action.href}
          {...(action.external
            ? { target: "_blank", rel: "noopener noreferrer" }
            : {})}
          className="mobile-contact-secondary"
        >
          <Icon name={action.icon} size={16} />
          {action.label}
        </a>
      ))}
    </div>
  );
}
