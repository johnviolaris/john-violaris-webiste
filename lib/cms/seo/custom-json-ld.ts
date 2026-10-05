/** Structural validation shared by the authenticated editor and public reader. */
export type CustomSchemaNode = Record<string, unknown>;

export const customJsonLdMaxLength = 20_000;

export type CustomSchemaResult =
  | { ok: true; nodes: CustomSchemaNode[] }
  | { ok: false; error: string };

const schemaType = /^(?:https:\/\/schema\.org\/)?[A-Za-z][A-Za-z0-9]*$/;
const guarantee = /\b(?:guaranteed?\s+(?:acquittal|success|outcome)|(?:no\s+ban|disqualification\s+avoided)\s+(?:guaranteed|entirely))\b/i;

function object(value: unknown): value is CustomSchemaNode {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** IDs owned by the automatic graph cannot be redefined by an override. */
export function reservedSchemaIds(path: string, siteUrl: string): Set<string> {
  const page = new URL(path, siteUrl).href;
  const home = new URL("/", siteUrl).href;

  return new Set([
    `${home}#website`, `${home}#practice`, `${home}#john`,
    ...["webpage", "breadcrumb", "service", "article", "faq"].map((fragment) => `${page}#${fragment}`),
  ]);
}

/**
 * Accept an object, object array or Schema.org @graph. References are allowed,
 * but typed definitions must not overwrite the graph generated from visible
 * content. This checks structure and safety, not search-engine eligibility.
 */
export function validateCustomJsonLd(
  raw: unknown,
  path: string,
  siteUrl: string,
): CustomSchemaResult {
  if (raw === undefined || raw === null || raw === "") return { ok: true, nodes: [] };
  if (typeof raw !== "string") return { ok: false, error: "Custom JSON-LD must be stored as JSON text, not a nested setting object." };
  if (!raw.trim()) return { ok: true, nodes: [] };
  if (raw.length > customJsonLdMaxLength) {
    return { ok: false, error: `Keep custom JSON-LD below ${customJsonLdMaxLength.toLocaleString("en-GB")} characters.` };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, error: "Enter valid JSON, without script tags or comments." };
  }

  if (object(parsed) && "@context" in parsed && parsed["@context"] !== "https://schema.org" && parsed["@context"] !== "https://schema.org/") {
    return { ok: false, error: "Use https://schema.org as the only JSON-LD context." };
  }
  const input = object(parsed) && "@graph" in parsed ? parsed["@graph"] : parsed;
  const nodes = Array.isArray(input) ? input : [input];
  if (nodes.length === 0 || nodes.length > 30 || !nodes.every(object)) {
    return { ok: false, error: "Use a JSON object or an array of 1–30 Schema.org objects." };
  }

  const reserved = reservedSchemaIds(path, siteUrl);
  const definitions = new Set<string>();
  let count = 0;
  let problem = "";
  const walk = (value: unknown, depth: number, root: boolean) => {
    if (problem) return;
    if (++count > 2_000 || depth > 16) {
      problem = "The JSON-LD is too deeply nested or contains too many values.";
      return;
    }
    if (typeof value === "string" && (/<[^>]+>/.test(value) || guarantee.test(value))) {
      problem = "Use plain factual text in JSON-LD; remove HTML and promises of a case outcome.";
    }
    if (Array.isArray(value)) {
      value.forEach((item) => walk(item, depth + 1, false));
      return;
    }
    if (!object(value)) return;
    const type = value["@type"];
    const types = Array.isArray(type) ? type : [type];
    if ((path.startsWith("/blog/") || path.startsWith("/services/")) && types.some((entry) => entry === "FAQPage" || entry === "https://schema.org/FAQPage")) {
      problem = "Manage FAQPage questions in the visible page's optional FAQ editor, rather than custom JSON-LD.";
    }
    if (root && !type) problem = "Every top-level schema object needs an @type.";
    if (type && !(typeof type === "string" ? schemaType.test(type) : Array.isArray(type) && type.length > 0 && type.every((entry) => typeof entry === "string" && schemaType.test(entry)))) {
      problem = "Use Schema.org type names such as Service or CreativeWork.";
    }
    if ("@context" in value && (!root || (value["@context"] !== "https://schema.org" && value["@context"] !== "https://schema.org/"))) {
      problem = "Nested or custom contexts are not supported. Use the site's Schema.org context.";
    }
    if ("@graph" in value) problem = "Nested @graph objects are not supported.";
    const id = value["@id"];
    if (id !== undefined) {
      if (typeof id !== "string" || (!id.startsWith("#") && !/^https:\/\//.test(id))) {
        problem = "An @id must be an https:// address or a #fragment on this page.";
      } else {
        let absolute: string;
        try { absolute = new URL(id, new URL(path, siteUrl)).href; } catch { problem = "An @id is not a valid address."; return; }
        if (type) {
          if (reserved.has(absolute) || definitions.has(absolute)) {
            problem = "A custom @id duplicates another definition or a node the website already generates.";
          }
          definitions.add(absolute);
        }
      }
    }
    for (const [key, child] of Object.entries(value)) {
      if (["__proto__", "constructor", "prototype", "@reverse", "@included"].includes(key)) {
        problem = `The property ${key} is not supported in custom JSON-LD.`;
      }
      if (key !== "@context") walk(child, depth + 1, false);
    }
  };
  nodes.forEach((node) => walk(node, 0, true));
  if (problem) return { ok: false, error: problem };

  // The shared graph already supplies the context. Canonicalise fragment IDs
  // so the meaning does not change when a page is served on a preview host.
  const normalise = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(normalise);
    if (!object(value)) return value;
    return Object.fromEntries(Object.entries(value).filter(([key]) => key !== "@context").map(([key, child]) => [
      key, key === "@id" && typeof child === "string" ? new URL(child, new URL(path, siteUrl)).href : normalise(child),
    ]));
  };
  return { ok: true, nodes: nodes.map((node) => normalise(node) as CustomSchemaNode) };
}
