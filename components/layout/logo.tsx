import { IntentLink as Link } from "@/components/ui/intent-link";

import { siteSettingsDefaults } from "@/lib/site-config";

/**
 * The wordmark.
 *
 * Takes the name and role as props rather than reading the configuration
 * itself, because it is rendered from both sides: the masthead is a Client
 * Component and the footer is a Server Component, and neither the hook nor the
 * async read works in both. The defaults keep it rendering for a caller that
 * passes neither.
 */
export function Logo({
  compact = false,
  name = siteSettingsDefaults.name,
  role = siteSettingsDefaults.role,
}: {
  compact?: boolean;
  name?: string;
  role?: string;
}) {
  // The label names everything the link shows, in the order it shows it, so
  // someone using voice control can say what they see (WCAG 2.5.3), and adds
  // where it goes. The space between the two lines is for the same reason:
  // without it the text reads "John ViolarisCriminal Defence Solicitor".
  const label = compact ? `${name} — home` : `${name}, ${role} — home`;

  return (
    <Link href="/" className="wordmark" aria-label={label}>
      <span>{name}</span>
      {!compact && <> <small>{role}</small></>}
    </Link>
  );
}
