import assert from "node:assert/strict";
import test from "node:test";

import {
  normaliseReferrer,
  normaliseUtmValue,
  readEnquiryAttribution,
} from "../lib/enquiries/attribution.ts";

test("UTM and gclid values are trimmed, stripped of control characters, and capped", () => {
  assert.equal(normaliseUtmValue(" \tpaid\nsearch\u0000 "), "paidsearch");
  assert.equal(normaliseUtmValue("x".repeat(250)), "x".repeat(200));
  assert.equal(normaliseUtmValue(" \r\n\t "), null);
  assert.equal(normaliseUtmValue(null), null);
});

test("referrers accept HTTP(S) only and discard query strings and fragments", () => {
  assert.equal(
    normaliseReferrer(
      "https://search.example/results/legal-advice?q=private#result-1",
    ),
    "https://search.example/results/legal-advice",
  );
  assert.equal(
    normaliseReferrer("http://partner.example/referral?client=123"),
    "http://partner.example/referral",
  );
  assert.equal(normaliseReferrer("javascript:alert(1)"), null);
  assert.equal(normaliseReferrer("ftp://files.example/referral"), null);
  assert.equal(normaliseReferrer("not a url"), null);
});

test("FormData reading returns only the normalized attribution vocabulary", () => {
  const formData = new FormData();

  formData.set(
    "referrer",
    "https://google.example/search?q=sensitive#private",
  );
  formData.set("utm_source", " google ");
  formData.set("utm_medium", " paid\nsearch ");
  formData.set("utm_campaign", "motoring-law");
  formData.set("utm_term", "x".repeat(220));
  formData.set("utm_content", " ");
  formData.set("gclid", " click\u0000-id ");
  formData.set("arbitrary_query_parameter", "must-not-be-returned");

  assert.deepEqual(readEnquiryAttribution(formData), {
    referrer: "https://google.example/search",
    utm_source: "google",
    utm_medium: "paidsearch",
    utm_campaign: "motoring-law",
    utm_term: "x".repeat(200),
    utm_content: null,
    gclid: "click-id",
  });
});

