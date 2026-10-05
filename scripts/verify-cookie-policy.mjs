import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import { pathToFileURL } from "node:url";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import { defaultIntegrationSettings, integrationDescriptors, resolvedIntegrationSettings } from "../lib/cms/seo/integrations.ts";

const rootUrl = pathToFileURL(`${process.cwd()}/`).href;
const urls = Object.fromEntries(["lib/analytics.ts", "lib/cms/seo/integration-queries.ts", "components/layout/analytics.tsx"].map((path) => [path, new URL(path, rootUrl).href]));
const hooks = registerHooks({
  load(url, context, nextLoad) {
    if (url === urls["lib/analytics.ts"]) return { format: "module", shortCircuit: true, source: `
      export const consentStorageKey = "jv-cookie-consent";
      export let gaMeasurementId = "";
      export function setFixtureId(id) { gaMeasurementId = id; }
    ` };
    if (url === urls["lib/cms/seo/integration-queries.ts"]) return { format: "module", shortCircuit: true, source: `
      let settings = { ga4: false, reviewsolicitors: false };
      export function setFixtureSettings(value) { settings = value; }
      export async function getIntegrationSettings() { return settings; }
    ` };
    if (url === urls["components/layout/analytics.tsx"]) return { format: "module", shortCircuit: true, source: `
      import { createElement } from "react";
      export function CookieSettingsButton(props) { return createElement("button", props, "Cookie settings"); }
    ` };
    if (url.startsWith(rootUrl) && url.endsWith(".tsx")) return { format: "module", shortCircuit: true, source: ts.transpileModule(readFileSync(new URL(url), "utf8"), { compilerOptions: { module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }).outputText };
    return nextLoad(url, context);
  },
});

let CookiePolicy;
let analytics;
let integrations;
try {
  ({ CookiePolicy } = await import("../components/sections/cookie-policy.tsx"));
  analytics = await import(urls["lib/analytics.ts"]);
  integrations = await import(urls["lib/cms/seo/integration-queries.ts"]);
} finally {
  hooks.deregister();
}

async function policy(settings, measurementId) {
  integrations.setFixtureSettings(settings);
  analytics.setFixtureId(measurementId);
  return renderToStaticMarkup(await CookiePolicy());
}

test("configured and CMS-enabled GA4 policy describes cookies, controls and consent-gated performance measurements", async () => {
  const html = await policy(resolvedIntegrationSettings(undefined), "G-FIXTURE123");
  assert.match(html, /Google Analytics sets two cookies/);
  assert.match(html, /<code>_ga_FIXTURE123<\/code>/);
  assert.match(html, /campaign attribution for this tab/);
  assert.match(html, /Cookie settings/);
  assert.match(html, /With your consent, it also measures page loading, responsiveness and layout movement\./);
});

test("CMS-disabled or invalid GA4 configuration omits analytics cookie and measurement claims despite a configured ID", async () => {
  const disabled = integrationDescriptors({ ...defaultIntegrationSettings, ga4: false });
  for (const value of [disabled, null, [{ id: "unknown", enabled: true }]]) {
    const html = await policy(resolvedIntegrationSettings(value), "G-FIXTURE123");
    assert.match(html, /does not use analytics or advertising cookies/);
    assert.doesNotMatch(html, /Google Analytics sets|<code>_ga|Cookies and storage|What analytics is used for|Cookie settings|measures page loading/);
  }
});

test("an enabled integration without a measurement ID still describes no visitor analytics storage", async () => {
  for (const measurementId of ["", null]) {
    const html = await policy(defaultIntegrationSettings, measurementId);
    assert.match(html, /sets no cookies or campaign-attribution storage for visitors/);
    assert.doesNotMatch(html, /<code>_ga|What analytics is used for|Cookie settings|measures page loading/);
  }
});
