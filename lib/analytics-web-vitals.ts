/** Numeric Core Web Vitals only; no attribution, URLs or persistent identifiers. */
type CoreMetricName = "LCP" | "INP" | "CLS";
type NumericMetricParams = {
  metric_value: number;
  metric_delta: number;
  metric_id: number;
};
type CoreObserver = (report: (metric: unknown) => void) => void;
type CoreObservers = { onLCP: CoreObserver; onINP: CoreObserver; onCLS: CoreObserver };
type CoreMetric = { name: CoreMetricName; id: string; value: number; delta: number };

function numericMetric(input: unknown): CoreMetric | null {
  if (!input || typeof input !== "object") return null;
  const { name, id, value, delta } = input as Record<string, unknown>;
  if (name !== "LCP" && name !== "INP" && name !== "CLS") return null;
  if (typeof id !== "string" || !id || id.length > 128) return null;
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > Number.MAX_SAFE_INTEGER) return null;
  // An INP percentile can fall as interaction counts increase.
  if (typeof delta !== "number" || !Number.isFinite(delta) || Math.abs(delta) > Number.MAX_SAFE_INTEGER) return null;
  return { name, id, value, delta };
}

type CollectorOptions = {
  load: () => Promise<CoreObservers>;
  allowed: () => boolean;
  send: (name: CoreMetricName, params: NumericMetricParams) => void;
  createMetricId?: () => number;
};
type DocumentState = {
  loading: Promise<void> | null;
  registered: Set<CoreMetricName>;
  metrics: Map<string, { numericId: number; lastValue: number | null }>;
};

/**
 * Register once per document, including concurrent starts and consent regrant.
 * The library's observers live until the document ends. Every callback checks
 * current permission; revoked measurements are discarded rather than queued.
 */
export function createCoreWebVitalsCollector({ load, allowed, send, createMetricId = () => Math.floor(Math.random() * 2 ** 52) }: CollectorOptions) {
  const documents = new WeakMap<object, DocumentState>();
  return async function start(document: object): Promise<void> {
    try {
      if (!allowed()) return;
      let state = documents.get(document);
      if (!state) {
        state = { loading: null, registered: new Set(), metrics: new Map() };
        documents.set(document, state);
      }
      if (state.loading) return await state.loading;
      if (state.registered.size === 3) return;
      const current = state;
      current.loading = Promise.resolve().then(() => allowed() ? load() : null).then((observers) => {
        if (!observers || !allowed()) return;
        for (const name of ["LCP", "INP", "CLS"] as const) {
          if (current.registered.has(name)) continue;
          // Mark before invoking: even an observer that throws after partial
          // setup must not be registered again on a later remount.
          current.registered.add(name);
          try {
            observers[`on${name}`]((input) => {
              try {
                if (!allowed()) return;
                const metric = numericMetric(input);
                if (!metric || metric.name !== name) return;
                const key = `${name}:${metric.id}`;
                let previous = current.metrics.get(key);
                if (!previous) {
                  const numericId = createMetricId();
                  if (!Number.isSafeInteger(numericId) || numericId < 0) return;
                  previous = { numericId, lastValue: null };
                  current.metrics.set(key, previous);
                }
                if (previous.lastValue === metric.value) return;
                // Pick fields explicitly; never serialize the library object.
                send(name, { metric_value: metric.value, metric_delta: metric.delta, metric_id: previous.numericId });
                previous.lastValue = metric.value;
              } catch { /* Measurement/tag failures cannot affect site features. */ }
            });
          } catch { /* Other supported metrics can still be registered. */ }
        }
      }).catch(() => {
        // A blocked chunk or unavailable API must not interrupt GA/contact
        // startup. A later authorized start may retry an import failure.
      }).finally(() => { current.loading = null; });
      await current.loading;
    } catch { /* Permission/measurement failures stay harmless. */ }
  };
}
