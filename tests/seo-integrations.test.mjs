import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { integrationDefinitions, integrationDescriptors, resolvedIntegrationSettings, validateIntegrationsRevision } from "../lib/cms/seo/integrations.ts";

test("only an absent configuration preserves current integration behavior", () => {
  assert.deepEqual(resolvedIntegrationSettings(undefined), { ga4: true, reviewsolicitors: true });
  for (const input of [null, false, {}, [], "<script src='https://example.test/payload.js'></script>"]) assert.deepEqual(resolvedIntegrationSettings(input), { ga4: false, reviewsolicitors: false });
});

test("current and historical settings accept independent known-provider toggles", () => {
  const value = integrationDescriptors({ ga4: false, reviewsolicitors: true });
  assert.deepEqual(validateIntegrationsRevision(value), { ok: true, value });
  assert.deepEqual(resolvedIntegrationSettings(value), { ga4: false, reviewsolicitors: true });
  assert.deepEqual(validateIntegrationsRevision([...value].reverse()), { ok: true, value });
  assert.deepEqual(resolvedIntegrationSettings(integrationDescriptors({ ga4: false, reviewsolicitors: false })), { ga4: false, reviewsolicitors: false });
  assert.equal(value[0].src, "https://www.googletagmanager.com/gtag/js");
  assert.equal(value[1].src, "https://www.reviewsolicitors.co.uk/widget/rs.js");
});

test("new vendors, URLs, loading policies and script payloads cannot enter through restores", () => {
  const value = integrationDescriptors({ ga4: true, reviewsolicitors: true });
  const invalid = [
    [...value, { id: "new-vendor", name: "New vendor", src: "https://example.test/script.js", strategy: "afterInteractive", enabled: true }],
    [value[0], value[0]],
    [value[0]],
    [{ ...value[0], src: "https://www.googletagmanager.com.evil.test/gtag/js" }, value[1]],
    [{ ...value[0], src: `${value[0].src}?id=G-OTHER123` }, value[1]],
    [{ ...value[0], strategy: "beforeInteractive" }, value[1]],
    [{ ...value[0], enabled: "false" }, value[1]],
    [{ ...value[0], code: "alert(1)" }, value[1]],
    [{ ...value[0], name: "Fake provider" }, value[1]],
  ];
  for (const input of invalid) {
    assert.equal(validateIntegrationsRevision(input).ok, false);
    assert.deepEqual(resolvedIntegrationSettings(input), { ga4: false, reviewsolicitors: false });
  }
  assert.equal(integrationDefinitions.length, 2);
});

test("disabling GA blocks a loaded tag and cannot be overridden by granting consent", async () => {
  const previousId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const previousWindow = globalThis.window;
  const previousDocument = globalThis.document;
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = "G-FIXTURE1234";
  let choice = "granted";
  const cookies = [];
  globalThis.window = { location: { hostname: "johnviolaris.com", pathname: "/contact" }, localStorage: { getItem: () => choice } };
  globalThis.document = { get cookie() { return "_ga=fixture; essential=keep"; }, set cookie(value) { cookies.push(value); } };
  try {
    const { startAnalytics, setAnalyticsIntegrationEnabled, track } = await import("../lib/analytics.ts?integration-disabled-regression");
    const calls = () => window.dataLayer.map((entry) => Array.from(entry));
    startAnalytics("G-FIXTURE1234");
    track("generate_lead", {});
    assert.equal(calls().filter(([command]) => command === "event").length, 1);
    setAnalyticsIntegrationEnabled(false, "G-FIXTURE1234");
    assert.equal(window["ga-disable-G-FIXTURE1234"], true);
    assert.ok(cookies.length > 0);
    // A tag or another caller changing Google's switch still cannot bypass the app guard.
    window["ga-disable-G-FIXTURE1234"] = false;
    startAnalytics("G-FIXTURE1234");
    track("generate_lead", {});
    assert.equal(calls().filter(([command]) => command === "event").length, 1);
    choice = "denied";
    setAnalyticsIntegrationEnabled(true, "G-FIXTURE1234");
    startAnalytics("G-FIXTURE1234");
    track("generate_lead", {});
    assert.equal(calls().filter(([command]) => command === "event").length, 1);
    choice = "granted";
    startAnalytics("G-FIXTURE1234");
    track("generate_lead", {});
    assert.equal(calls().filter(([command]) => command === "event").length, 2);
    assert.equal(calls().filter(([command]) => command === "config").length, 1);
  } finally {
    if (previousId === undefined) delete process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
    else process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = previousId;
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
    if (previousDocument === undefined) delete globalThis.document;
    else globalThis.document = previousDocument;
  }
});

test("integration writes and editor reads require admin while public rendering stays anonymous", async () => {
  const root = new URL("../", import.meta.url);
  const [action, queries, widget, layout] = await Promise.all(["lib/cms/seo/integration-actions.ts", "lib/cms/seo/integration-queries.ts", "components/ui/review-solicitors.tsx", "app/(site)/layout.tsx"].map((path) => readFile(new URL(path, root), "utf8")));
  assert.ok(action.indexOf("await createAuthorizedAdminClient()") < action.indexOf('.from("site_settings")'));
  assert.match(action, /key: "scripts"/);
  const publicRead = queries.slice(queries.indexOf("export const getIntegrationSettings"), queries.indexOf("export async function getIntegrationsForAdmin"));
  assert.match(publicRead, /await publicClient\(\)/);
  assert.doesNotMatch(publicRead, /Authorized|createClient|SECRET|SERVICE_ROLE/);
  assert.match(publicRead, /if \(error\) return \{ \.\.\.disabledIntegrationSettings \}/);
  assert.match(queries.slice(queries.indexOf("export async function getIntegrationsForAdmin")), /await createAuthorizedAdminClient\(\)/);
  assert.match(layout, /<IntegrationProvider settings=\{integrations\}>/);
  assert.match(widget, /if \(!enabled \|\| mounted\.current/);
  assert.match(widget, /\{enabled && <Script/);
});
