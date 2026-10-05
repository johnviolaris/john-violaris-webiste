import vocabulary from "@/lib/cms/seo/schema-vocabulary.json" with { type: "json" };

const classes: Record<string, string[]> = vocabulary.classes;
const properties: Record<string, string[]> = vocabulary.properties;
const local = (value: string) => value.replace(/^https:\/\/schema\.org\//, "");

function lineage(type: string): Set<string> {
  const seen = new Set<string>();
  const queue = [type];
  while (queue.length) {
    const entry = queue.pop()!;
    if (seen.has(entry)) continue;
    seen.add(entry);
    queue.push(...(classes[entry] ?? []));
  }
  return seen;
}

/** Offline vocabulary/domain and graph checks. This does not verify legal facts or rich-result eligibility. */
export function validateSchemaNodes(nodes: Record<string, unknown>[], knownIds: Iterable<string> = []): string[] {
  const problems: string[] = [];
  const ids = new Set(knownIds);
  const declared = new Set<string>();
  const refs = new Set<string>();
  const walk = (value: unknown, location: string) => {
    if (value === null || value === "" || (Array.isArray(value) && value.length === 0)) { problems.push(`${location} is empty.`); return; }
    if (Array.isArray(value)) { value.forEach((item, index) => walk(item, `${location}[${index}]`)); return; }
    if (typeof value !== "object" || !value) return;
    const node = value as Record<string, unknown>;
    if (Object.keys(node).length === 1 && typeof node["@id"] === "string") { refs.add(node["@id"]); return; }
    const types = (Array.isArray(node["@type"]) ? node["@type"] : [node["@type"]]).filter((type): type is string => typeof type === "string").map(local);
    const inherited = new Set(types.flatMap((type) => [...lineage(type)]));
    if (types.length === 0) problems.push(`${location} needs a Schema.org type.`);
    for (const type of types) if (!classes[type]) problems.push(`${location}: ${type} is not in the recorded Schema.org vocabulary.`);
    if (typeof node["@id"] === "string") {
      if (declared.has(node["@id"]) || ids.has(node["@id"])) problems.push(`${location}: duplicate @id ${node["@id"]}.`);
      declared.add(node["@id"]);
    }
    for (const [key, child] of Object.entries(node)) {
      if (key.startsWith("@")) continue;
      const domain = properties[key];
      if (!domain) problems.push(`${location}: ${key} is not a Schema.org property.`);
      else if (types.length && domain.length && !domain.some((type) => inherited.has(type))) problems.push(`${location}: ${key} does not belong on ${types.join(" / ")}.`);
      if (["datePublished", "dateModified", "dateCreated", "dateReviewed"].includes(key) && typeof child === "string" && Number.isNaN(Date.parse(child))) problems.push(`${location}: ${key} is not a valid date.`);
      walk(child, `${location}.${key}`);
    }
  };
  nodes.forEach((node, index) => walk(node, `Schema node ${index + 1}`));
  for (const id of refs) if (!declared.has(id) && !ids.has(id)) problems.push(`Schema reference ${id} has no definition on this page.`);
  return [...new Set(problems)];
}

export const schemaVocabularySource = { url: vocabulary.source, retrieved: vocabulary.retrieved, attribution: vocabulary.attribution };

/** Automatic definitions actually present for this route, rather than every reserved ID. */
export function automaticSchemaIds(path: string, siteUrl: string, hasFaq = false): string[] {
  const home = new URL("/", siteUrl).href;
  const page = new URL(path, siteUrl).href;
  return [
    ...["website", "practice", "john"].map((fragment) => `${home}#${fragment}`),
    `${page}#webpage`,
    ...(path !== "/" ? [`${page}#breadcrumb`] : []),
    ...(path.startsWith("/services/") ? [`${page}#service`] : []),
    ...(path.startsWith("/blog/") ? [`${page}#article`] : []),
    ...(hasFaq ? [`${page}#faq`] : []),
  ];
}
