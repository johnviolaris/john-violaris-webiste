import assert from "node:assert/strict";
import test from "node:test";
import { duplicateLocationContext, emptyLocationValues, locationContentFrom, validateLocation } from "../lib/cms/locations/schema.ts";

const services = new Set(["/services/speeding"]);
const draft = { ...emptyLocationValues, slug: "example-area", location: "Example area", title: "Defence advice in Example area" };
const publishable = { ...draft, description: "Bespoke legal advice for people facing allegations in this area.", intro: "John advises people in this area about their case and the steps before a hearing.", localContext: "Verifiable local context helps residents prepare for a hearing. ".repeat(10), body: "Useful factual advice explains preparation evidence hearings and individual circumstances. ".repeat(25) + "\n\n" + "The court decides each case on its evidence and the applicable law. ".repeat(10), relatedServices: "/services/speeding" };

test("location drafts need no invented content, but require stable identifiers", () => {
  assert.deepEqual(validateLocation(draft, false, false, services), {});
  assert.ok(validateLocation({ ...draft, slug: "Bad Slug" }, false, false, services).slug);
  assert.ok(validateLocation({ ...draft, title: "" }, false, false, services).title);
});
test("location publication requires local context, substantial body and legal review", () => {
  const invalid = validateLocation(draft, true, false, services);
  for (const key of ["description", "intro", "localContext", "body", "relatedServices"]) assert.ok(invalid[key], key);
  assert.deepEqual(validateLocation(publishable, true, true, services), {});
  assert.ok(validateLocation(publishable, true, false, services).body);
});
test("unknown related services and outcome promises block location publication", () => {
  assert.ok(validateLocation({ ...publishable, relatedServices: "/services/withdrawn" }, true, true, services).relatedServices);
  assert.ok(validateLocation({ ...publishable, intro: "Guaranteed success. " + publishable.intro }, true, true, services).body);
});
test("location body is plain paragraph data with deduplicated service links", () => {
  const content = locationContentFrom({ ...publishable, relatedServices: "/services/speeding\n/services/speeding\n" });
  assert.equal(content.body.length, 2);
  assert.deepEqual(content.relatedServices, ["/services/speeding"]);
  assert.equal("address" in content, false);
});
test("changing only a city name does not create publishable bespoke local context", () => {
  const one = { ...publishable, location: "Alpha", localContext: "Alpha residents can use the court entrance on First Street and should check hearing notices for the correct building. The listed hearing centre serves this area and travel arrangements should be confirmed in advance." };
  const peer = { slug: "beta", location: "Beta", content: { localContext: [one.localContext.replaceAll("Alpha", "Beta")] } };
  assert.equal(duplicateLocationContext(one, [peer]), "beta");
  assert.equal(duplicateLocationContext(one, [{ ...peer, content: { localContext: ["Different useful facts about accessible parking and verifying a new court venue from the actual summons."] } }]), null);
});
