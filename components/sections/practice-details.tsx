import type { SiteConfig } from "@/lib/site-config";
import { verifiedPracticeFacts } from "@/lib/cms/settings/practice-facts";

export function PracticeDetails({ config }: { config: SiteConfig }) {
  const facts = verifiedPracticeFacts(config);
  if (!facts || !(facts.practiceLegalName || facts.practiceSraNumber || facts.addressStreet || facts.openingHours)) return null;
  return (
    <section aria-labelledby="practice-details-heading" className="mt-8 space-y-3 border-t pt-6">
      <h2 id="practice-details-heading" className="font-display text-xl">Practice details</h2>
      {facts.practiceLegalName ? <p>{facts.practiceLegalName}</p> : null}
      {facts.addressStreet ? <address className="not-italic">
        {[facts.addressStreet, facts.addressLocality, facts.addressRegion, facts.addressPostalCode, facts.addressCountry].filter(Boolean).join(", ")}
      </address> : null}
      {facts.practiceSraNumber ? <p>Practice SRA identifier: <a className="underline underline-offset-4" href={`https://www.sra.org.uk/consumers/register/organisation/?sraNumber=${facts.practiceSraNumber}`}>{facts.practiceSraNumber}</a></p> : null}
      {facts.openingHours ? <div><p>Opening hours</p><ul>{facts.openingHours.split(";").map((hours) => <li key={hours.trim()}>{hours.trim()}</li>)}</ul></div> : null}
    </section>
  );
}
