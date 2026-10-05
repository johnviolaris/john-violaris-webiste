import assert from "node:assert/strict";
import test from "node:test";
import { createCoreWebVitalsCollector } from "../lib/analytics-web-vitals.ts";

function fixture(overrides = {}) {
  const callbacks = {};
  const registrations = { LCP: 0, INP: 0, CLS: 0 };
  const events = [];
  let permitted = true;
  let imports = 0;
  let nextId = 100;
  const observers = Object.fromEntries(Object.keys(registrations).map((name) => [`on${name}`, (callback) => {
    registrations[name]++;
    callbacks[name] = callback;
  }]));
  const start = createCoreWebVitalsCollector({
    load: async () => { imports++; return observers; },
    allowed: () => permitted,
    send: (name, params) => events.push({ name, params }),
    createMetricId: () => nextId++,
    ...overrides,
  });
  return { start, observers, callbacks, registrations, events, setPermission: (value) => { permitted = value; }, imports: () => imports };
}
const metric = (name, changes = {}) => ({ name, id: `v6-fixture-${name}`, value: name === "CLS" ? 0.12 : 200, delta: name === "CLS" ? 0.12 : 200, ...changes });

test("no library request without permission; concurrent starts and remounts register once per document", async () => {
  const f = fixture();
  const document = {};
  f.setPermission(false);
  await f.start(document);
  assert.equal(f.imports(), 0);
  assert.deepEqual(f.registrations, { LCP: 0, INP: 0, CLS: 0 });
  f.setPermission(true);
  await Promise.all([f.start(document), f.start(document), f.start(document)]);
  await f.start(document);
  assert.equal(f.imports(), 1);
  assert.deepEqual(f.registrations, { LCP: 1, INP: 1, CLS: 1 });
});

test("permission is rechecked before lazy import and after a pending import resolves", async () => {
  let allowed = true;
  let imports = 0;
  const before = fixture({ allowed: () => allowed, load: async () => { imports++; throw new Error("must not load"); } });
  const beforeStart = before.start({});
  allowed = false;
  await beforeStart;
  assert.equal(imports, 0);

  let complete;
  const library = new Promise((resolve) => { complete = resolve; });
  const pending = fixture({ load: () => library });
  const document = {};
  const loading = pending.start(document);
  await Promise.resolve();
  pending.setPermission(false);
  complete(pending.observers);
  await loading;
  assert.deepEqual(pending.registrations, { LCP: 0, INP: 0, CLS: 0 });
  pending.setPermission(true);
  await pending.start(document);
  assert.deepEqual(pending.registrations, { LCP: 1, INP: 1, CLS: 1 });
});

test("every callback checks current permission and regrant neither replays denied callbacks nor duplicates observers", async () => {
  const f = fixture();
  const document = {};
  await f.start(document);
  f.callbacks.LCP(metric("LCP"));
  assert.equal(f.events.length, 1);
  f.setPermission(false);
  f.callbacks.INP(metric("INP", { value: 800, delta: 800 }));
  f.callbacks.CLS(metric("CLS"));
  assert.equal(f.events.length, 1);
  await f.start(document);
  f.setPermission(true);
  await f.start(document);
  assert.equal(f.events.length, 1);
  assert.deepEqual(f.registrations, { LCP: 1, INP: 1, CLS: 1 });
  f.callbacks.INP(metric("INP", { value: 900, delta: 100 }));
  assert.equal(f.events.length, 2);
  assert.equal(f.events[1].params.metric_value, 900);
});

test("only numeric fields are sent; attribution, URLs, selectors, case details and library IDs stay out", async () => {
  const f = fixture();
  await f.start({});
  const input = metric("CLS", {
    id: "https://example.test/private?case=fixture",
    navigationURL: "https://example.test/private",
    attribution: { target: "#case-fixture", interactionTarget: "#client-name" },
    case_details: "Must never leave this fixture",
  });
  Object.defineProperty(input, "entries", { get: () => { throw new Error("must not read entries"); } });
  f.callbacks.CLS(input);
  assert.deepEqual(f.events, [{ name: "CLS", params: { metric_value: 0.12, metric_delta: 0.12, metric_id: 100 } }]);
  assert.ok(Object.values(f.events[0].params).every((value) => typeof value === "number" && Number.isFinite(value)));
});

test("malformed and non-Core metrics fail closed while signed INP deltas and zero CLS remain valid", async () => {
  const f = fixture();
  await f.start({});
  for (const bad of [null, {}, metric("TTFB"), metric("INP"), metric("LCP", { id: "" }), metric("LCP", { id: "x".repeat(129) }),
    metric("LCP", { value: -1 }), metric("LCP", { value: Infinity }), metric("LCP", { value: "200" }), metric("LCP", { value: Number.MAX_SAFE_INTEGER + 1 }),
    metric("LCP", { delta: NaN }), metric("LCP", { delta: "1" }), metric("LCP", { delta: -Infinity })]) f.callbacks.LCP(bad);
  assert.equal(f.events.length, 0);
  f.callbacks.INP(metric("INP", { value: 180, delta: -20 }));
  f.callbacks.CLS(metric("CLS", { value: 0, delta: 0 }));
  assert.deepEqual(f.events.map(({ params }) => [params.metric_value, params.metric_delta]), [[180, -20], [0, 0]]);
});

test("duplicate snapshots are suppressed, updates retain an ephemeral ID and new visits get separate IDs", async () => {
  const f = fixture();
  const document = {};
  await f.start(document);
  f.callbacks.INP(metric("INP"));
  f.callbacks.INP(metric("INP", { delta: 0 }));
  f.callbacks.INP(metric("INP", { value: 220, delta: 20 }));
  f.callbacks.INP(metric("INP", { id: "v6-bfcache-restored", value: 220, delta: 220 }));
  assert.equal(f.events.length, 3);
  assert.equal(f.events[0].params.metric_id, f.events[1].params.metric_id);
  assert.notEqual(f.events[1].params.metric_id, f.events[2].params.metric_id);
  await f.start({});
  f.callbacks.INP(metric("INP"));
  assert.notEqual(f.events[2].params.metric_id, f.events[3].params.metric_id);
  assert.deepEqual(f.registrations, { LCP: 2, INP: 2, CLS: 2 });
});

test("import, permission, observer and sending failures are harmless and partial registrations are never duplicated", async () => {
  let attempts = 0;
  const retry = fixture({ load: async () => { if (++attempts === 1) throw new Error("blocked chunk"); return retry.observers; } });
  const document = {};
  await assert.doesNotReject(retry.start(document));
  await retry.start(document);
  assert.equal(attempts, 2);
  assert.deepEqual(retry.registrations, { LCP: 1, INP: 1, CLS: 1 });

  const partial = fixture({ send: () => { throw new Error("tag unavailable"); } });
  partial.observers.onLCP = () => { partial.registrations.LCP++; throw new Error("observer partial failure"); };
  await assert.doesNotReject(partial.start(document));
  await partial.start(document);
  assert.deepEqual(partial.registrations, { LCP: 1, INP: 1, CLS: 1 });
  assert.doesNotThrow(() => partial.callbacks.INP(metric("INP")));
  const permissionError = fixture({ allowed: () => { throw new Error("permission unavailable"); } });
  await assert.doesNotReject(permissionError.start({}));
  assert.equal(permissionError.imports(), 0);
});
