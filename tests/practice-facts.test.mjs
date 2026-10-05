import assert from "node:assert/strict";
import test from "node:test";
import { siteSettingsDefaults, resolveSiteConfig } from "@/lib/site-config.ts";
import { practiceFactsErrors, verifiedPracticeFacts } from "@/lib/cms/settings/practice-facts.ts";

test("existing site configuration needs no fabricated practice details or confirmation", () => {
  assert.deepEqual(practiceFactsErrors(siteSettingsDefaults), {});
  assert.equal(verifiedPracticeFacts(resolveSiteConfig()), null);
});
test("unconfirmed and incomplete practice facts fail closed", () => {
  const value = { ...siteSettingsDefaults, addressStreet: "Fixture street" };
  assert.ok(practiceFactsErrors(value).practiceDetailsReviewedAt);
  assert.ok(practiceFactsErrors(value).addressLocality);
  assert.equal(verifiedPracticeFacts(value), null);
  assert.ok(practiceFactsErrors({ ...value, practiceDetailsReviewedAt: "2026-02-30" }).practiceDetailsReviewedAt);
});
test("coordinates require a complete reviewed address and physical coordinate ranges", () => {
  const base = { ...siteSettingsDefaults, practiceDetailsReviewedAt: "2026-10-01", addressStreet: "Fixture street", addressLocality: "Fixture town", addressPostalCode: "AA1 1AA", addressCountry: "GB" };
  assert.deepEqual(practiceFactsErrors({ ...base, latitude: "51.5", longitude: "-0.12" }), {});
  assert.ok(practiceFactsErrors({ ...base, latitude: "91", longitude: "-0.12" }).latitude);
  assert.ok(practiceFactsErrors({ ...base, latitude: "51.5", longitude: "" }).longitude);
  assert.ok(practiceFactsErrors({ ...base, latitude: "51.5", longitude: "-0.12", addressStreet: "" }).latitude);
  assert.ok(practiceFactsErrors({ ...base, openingHours: "Every day all day" }).openingHours);
  assert.deepEqual(practiceFactsErrors({ ...base, openingHours: "Mo-Fr 09:00-18:00; Sa 09:00-12:00" }), {});
});
