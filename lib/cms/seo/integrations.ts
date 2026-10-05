/** Existing integrations only. Provider addresses and loading policy are code-owned. */
export const integrationDefinitions = [
  { id: "ga4", name: "Google Analytics 4", src: "https://www.googletagmanager.com/gtag/js", strategy: "afterInteractive" },
  { id: "reviewsolicitors", name: "ReviewSolicitors", src: "https://www.reviewsolicitors.co.uk/widget/rs.js", strategy: "lazyOnload" },
] as const;

export type IntegrationId = (typeof integrationDefinitions)[number]["id"];
export type IntegrationSettings = Record<IntegrationId, boolean>;
export type IntegrationDescriptor = { id: IntegrationId; name: string; src: string; strategy: "afterInteractive" | "lazyOnload"; enabled: boolean };

export const defaultIntegrationSettings: IntegrationSettings = { ga4: true, reviewsolicitors: true };
export const disabledIntegrationSettings: IntegrationSettings = { ga4: false, reviewsolicitors: false };

export function integrationDescriptors(settings: IntegrationSettings): IntegrationDescriptor[] {
  return integrationDefinitions.map((definition) => ({ ...definition, enabled: settings[definition.id] }));
}

/** The same strict policy applies to ordinary saves and historical restores. */
export function validateIntegrationsRevision(input: unknown): { ok: true; value: IntegrationDescriptor[] } | { ok: false; error: string } {
  const invalid = { ok: false as const, error: "Use only the two existing integrations with their fixed provider addresses and loading strategies. Each enabled setting must be true or false." };
  if (!Array.isArray(input) || input.length !== integrationDefinitions.length) return invalid;
  const settings = { ...disabledIntegrationSettings };
  const seen = new Set<IntegrationId>();
  const keys = ["id", "name", "src", "strategy", "enabled"];
  for (const entry of input) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry) || Object.keys(entry).some((key) => !keys.includes(key))) return invalid;
    const definition = integrationDefinitions.find((candidate) => candidate.id === entry.id);
    if (!definition || seen.has(definition.id) || entry.name !== definition.name || entry.src !== definition.src || entry.strategy !== definition.strategy || typeof entry.enabled !== "boolean") return invalid;
    seen.add(definition.id);
    settings[definition.id] = entry.enabled;
  }
  return { ok: true, value: integrationDescriptors(settings) };
}

/** An absent row preserves current behavior; malformed legacy rows load nothing. */
export function resolvedIntegrationSettings(input: unknown): IntegrationSettings {
  if (input === undefined) return { ...defaultIntegrationSettings };
  const checked = validateIntegrationsRevision(input);
  if (!checked.ok) return { ...disabledIntegrationSettings };
  return Object.fromEntries(checked.value.map((entry) => [entry.id, entry.enabled])) as IntegrationSettings;
}
