import assert from "node:assert/strict";
import test from "node:test";
import { duplicateLocationContext, emptyLocationValues, locationContentFrom, validateLocation } from "../lib/cms/locations/schema.ts";
import { execFileSync } from "node:child_process";
import { courtCountField, courtField, courtFields, courtRepairField, readCourtDetails, readLocationStructuredContent, relationRepairField, resolveLocationStructuredContent, safeCourtUrl, validateCourtDetails, validateLocationStructuredContent } from "../lib/cms/locations/structured.ts";
import { validateLocationRevision } from "../lib/cms/locations/revision-validation.ts";
import { faqCountField, faqRepairField } from "../lib/cms/faq.ts";
import { publicationSeoWarnings } from "../lib/cms/seo/publication-warnings.ts";
import { validateCustomJsonLd } from "../lib/cms/seo/custom-json-ld.ts";

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

// Explicitly isolated content fixtures. These do not name or publish a real court/office.
const courtFixture = { name: "Court rendering fixture", details: "Fixture-only details used to verify this private renderer.", address: "Fixture address, not a real court address", officialUrl: "https://www.gov.uk/find-court-tribunal", directionsUrl: "https://maps.google.com/" };
const optionalFixture = { courts: [courtFixture], faqItems: [{ question: "How does this fixture work?", answer: "Read **the fixture** and [contact details](/contact)." }], parentService: "/services/speeding", relatedLocations: ["/locations/neighbour-fixture"] };

test("location publication blocks guarantees in every visible optional court and FAQ field", () => {
  const legacy = readLocationStructuredContent(new FormData(), locationContentFrom(publishable));
  assert.equal(legacy.ok, true);
  assert.deepEqual(validateLocation(publishable, true, true, services, new Set(), legacy.content), {});
  assert.deepEqual(validateLocation(publishable, true, true, services), {}, "Absent optional legacy fields preserve publication behavior.");
  const cases = [
    { field: "courts", content: { courts: [{ ...courtFixture, name: "Guaranteed success fixture" }] } },
    { field: "courts", content: { courts: [{ ...courtFixture, details: "Guaranteed outcome in this isolated fixture." }] } },
    { field: "courts", content: { courts: [{ ...courtFixture, address: "No ban if accepted" }] } },
    { field: "faqItems", content: { faqItems: [{ question: "Guaranteed acquittal?", answer: "Isolated fixture answer." }] } },
    { field: "faqItems", content: { faqItems: [{ question: "How does this fixture work?", answer: "Guaranteed **success**; [read the fixture](/contact)." }] } },
  ];
  for (const { field, content } of cases) {
    const validated = validateLocationStructuredContent(content);
    assert.equal(validated.ok, true, "Content is structurally valid before publication claim checks.");
    assert.match(validateLocation(publishable, true, true, services, new Set(), validated.content)[field], /guaranteed case outcome/);
    assert.deepEqual(validateLocation(publishable, false, false, services, new Set(), validated.content), {}, "Private drafts can retain wording awaiting review.");
  }
  const safe = validateLocationStructuredContent({ courts: [courtFixture], faqItems: [{ question: "How is this fixture reviewed?", answer: "The court decides each case on its evidence and individual facts." }] });
  assert.equal(safe.ok, true);
  assert.deepEqual(validateLocation(publishable, true, true, services, new Set(), safe.content), {});
});

test("optional location JSONB data has empty legacy defaults and preserves unknown owned data", () => {
  const legacy = locationContentFrom(draft);
  assert.deepEqual(resolveLocationStructuredContent(legacy), { courts: [], faqItems: [], parentService: "", relatedLocations: [] });
  assert.deepEqual(validateLocationStructuredContent(legacy).content, resolveLocationStructuredContent(legacy));
  for (const key of ["courts", "faqItems", "parentService", "relatedLocations"]) assert.equal(Object.hasOwn(legacy, key), false);
  const saved = locationContentFrom(draft, optionalFixture, { ...legacy, seo: { title: "Separate metadata fixture" } });
  assert.deepEqual(JSON.parse(JSON.stringify(saved)).courts, [courtFixture]);
  assert.deepEqual(saved.relatedServices, [], "Existing related services remain independent of the parent.");
  assert.deepEqual(saved.seo, { title: "Separate metadata fixture" });
});

test("court details reject malformed rows, duplicate names, insecure and credentialled URLs", () => {
  assert.deepEqual(validateCourtDetails(undefined), { ok: true, items: [] });
  assert.equal(validateCourtDetails([courtFixture]).ok, true);
  for (const value of [null, {}, [null], [{ name: "Only a name" }], [{ ...courtFixture, address: 123 }], [{ ...courtFixture, inventedOffice: true }], [courtFixture, { ...courtFixture, name: " COURT RENDERING FIXTURE " }], [{ ...courtFixture, name: "x".repeat(181) }], Array(13).fill(courtFixture)]) assert.equal(validateCourtDetails(value).ok, false);
  for (const target of ["http://example.com", "javascript:alert(1)", "//example.com", "/admin", "https://user:password@example.com", "https://example.com/a b", "https://example.com/a\\b", "data:text/html,test"]) {
    assert.equal(safeCourtUrl(target), null, target);
    assert.equal(validateCourtDetails([{ ...courtFixture, officialUrl: target }]).ok, false, target);
  }
});

test("old location clients preserve saved rows and explicit removal/repair never silently destroys malformed data", () => {
  assert.deepEqual(readLocationStructuredContent(new FormData(), optionalFixture).content, optionalFixture);
  const form = new FormData(); form.set(courtCountField, "2");
  for (const [index, row] of [courtFixture, { name: "", details: "" }].entries()) for (const key of courtFields) form.set(courtField(index, key), row[key] ?? "");
  assert.deepEqual(readCourtDetails(form).items, [courtFixture]);
  form.set(courtCountField, "0"); form.set(faqCountField, "0");
  assert.deepEqual(readLocationStructuredContent(form, optionalFixture).content, { ...optionalFixture, courts: [], faqItems: [] });
  const malformed = { courts: null, faqItems: null, parentService: "/admin", relatedLocations: ["https://example.com"] };
  assert.equal(readLocationStructuredContent(form, malformed).ok, false);
  form.set(courtRepairField, "on"); form.set(faqRepairField, "on"); form.set(relationRepairField, "on"); form.set("parentService", ""); form.set("relatedLocations", "");
  assert.deepEqual(readLocationStructuredContent(form, malformed), { ok: true, content: { courts: [], faqItems: [], parentService: "", relatedLocations: [] } });
  for (const count of ["-1", "1.5", "13", "2e1", "Infinity"]) { form.set(courtCountField, count); assert.equal(readCourtDetails(form).ok, false); }
});

test("location relations require current records, reject private/external/self links and keep parent separate", () => {
  const values = { ...draft, parentService: "/services/speeding", relatedLocations: "/locations/neighbour-fixture" };
  assert.deepEqual(validateLocation(values, false, false, services, new Set(["/locations/neighbour-fixture"])), {});
  assert.ok(validateLocation(values, false, false, services).relatedLocations);
  assert.ok(validateLocation({ ...values, parentService: "/services/withdrawn" }, false, false, services, new Set(["/locations/neighbour-fixture"])).parentService);
  assert.ok(validateLocation({ ...values, relatedLocations: "/locations/example-area" }, false, false, services, new Set(["/locations/example-area"])).relatedLocations);
  for (const content of [{ parentService: "/admin" }, { relatedLocations: ["//example.com"] }, { relatedLocations: ["/locations/area?preview=1"] }, { relatedLocations: ["/locations/area#main"] }, { parentService: 5 }]) assert.equal(validateLocationStructuredContent(content).ok, false);
  assert.equal(validateLocationStructuredContent({ parentService: "/police-station" }).ok, true);
});

test("restoration revalidates current optional content and uses current slug after a rename", () => {
  const snapshot = { slug: "old-address", title: draft.title, location: draft.location, content: locationContentFrom(draft, optionalFixture) };
  const restored = validateLocationRevision(snapshot, "current-address", services, new Set(["/locations/neighbour-fixture"]));
  assert.equal(restored.ok, true);
  assert.deepEqual(restored.content.faqItems, optionalFixture.faqItems);
  assert.deepEqual(restored.content.courts, [courtFixture]);
  for (const change of [{ courts: [{ ...courtFixture, officialUrl: "javascript:bad" }] }, { faqItems: [{ question: "Q?", answer: "[bad](javascript:bad)" }] }, { relatedLocations: ["/locations/current-address"] }, { body: [5] }]) assert.equal(validateLocationRevision({ ...snapshot, content: { ...snapshot.content, ...change } }, "current-address", services, new Set(["/locations/current-address"])).ok, false);
});

test("location publishing warns for invalid FAQ schema and custom FAQ graphs cannot compete", () => {
  const input = { path: "/locations/fixture", defaults: { title: "Local fixture", description: "A private test description for checking optional location structured content." }, siteName: "John Violaris", siteUrl: "https://johnviolaris.com" };
  assert.ok(publicationSeoWarnings({ ...input, content: { faqItems: null } }).some((warning) => warning.startsWith("FAQs:")));
  assert.equal(publicationSeoWarnings({ ...input, content: optionalFixture }).some((warning) => /FAQs:|Structured data:/.test(warning)), false);
  assert.equal(validateCustomJsonLd(JSON.stringify({ "@type": "FAQPage", mainEntity: [] }), input.path, input.siteUrl).ok, false);
  assert.equal(validateCustomJsonLd(JSON.stringify({ "@type": "CreativeWork", "@id": "#faq", name: "Duplicate" }), input.path, input.siteUrl).ok, false);
});

test("actual location public and private preview renderers share optional data, escape content and match FAQ schema", () => {
  const output = execFileSync(process.execPath, ["--import", "./scripts/alias-hook.mjs", "tests/location-render-fixture.mjs"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  assert.match(output, /Location renderer: 5 isolated cases passed/);
  assert.match(output, /Legacy body equals fixed a36e0b2 baseline/);
});
