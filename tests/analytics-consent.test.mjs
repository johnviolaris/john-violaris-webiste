import assert from "node:assert/strict";
import test from "node:test";

test("withdrawal in another tab stops enquiry events and regrant avoids a second page configuration", async () => {
  const previousId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const previousWindow = globalThis.window;
  const previousDocument = globalThis.document;
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = "G-FIXTURE1234";
  let choice = "granted";
  const cookies = [];
  globalThis.window = {
    location: { hostname: "johnviolaris.com", pathname: "/contact" },
    localStorage: { getItem: () => choice },
  };
  globalThis.document = {
    get cookie() { return "_ga=fixture; _ga_FIXTURE1234=fixture; essential=keep"; },
    set cookie(value) { cookies.push(value); },
  };
  try {
    const { startAnalytics, stopAnalytics, track } = await import("../lib/analytics.ts?consent-regression");
    startAnalytics("G-FIXTURE1234");
    track("form_submit", {});
    const calls = () => window.dataLayer.map((entry) => Array.from(entry));
    assert.equal(calls().filter(([command]) => command === "config").length, 1);
    assert.deepEqual(calls().find(([command]) => command === "config")[2], {
      allow_google_signals: false, allow_ad_personalization_signals: false,
    });
    assert.equal(calls().filter(([command]) => command === "event").length, 1);

    // Storage changes before React's subscription handles the other tab's choice.
    choice = "denied";
    track("form_submit", {});
    assert.equal(calls().filter(([command]) => command === "event").length, 1);
    stopAnalytics("G-FIXTURE1234");
    assert.equal(window["ga-disable-G-FIXTURE1234"], true);
    assert.deepEqual(calls().at(-1), ["consent", "update", { analytics_storage: "denied" }]);
    assert.equal(cookies.length, 6);
    assert.ok(cookies.every((value) => value.startsWith("_ga")));

    startAnalytics("G-FIXTURE1234");
    assert.equal(window["ga-disable-G-FIXTURE1234"], true);
    choice = "granted";
    startAnalytics("G-FIXTURE1234");
    assert.equal(window["ga-disable-G-FIXTURE1234"], false);
    assert.equal(calls().filter(([command]) => command === "config").length, 1);
    track("phone_click", { location: "footer" });
    assert.equal(calls().filter(([command]) => command === "event").length, 2);
  } finally {
    if (previousId === undefined) delete process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
    else process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = previousId;
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
    if (previousDocument === undefined) delete globalThis.document;
    else globalThis.document = previousDocument;
  }
});
