export type RevisionDifference = { field: string; before: string; after: string };
function flatten(value: unknown, prefix = "", entries = new Map<string, string>()): Map<string, string> {
  if (entries.size >= 500) return entries;
  if (value !== null && typeof value === "object" && Object.keys(value).length > 0) {
    for (const [key, child] of Object.entries(value)) {
      if (["updated_at", "created_at", "id"].includes(key) && !prefix) continue;
      flatten(child, prefix ? `${prefix}.${key}` : key, entries);
    }
  } else entries.set(prefix, typeof value === "string" ? value : JSON.stringify(value) ?? "");
  return entries;
}
export function compareRevisionSnapshots(before: unknown, after: unknown): RevisionDifference[] {
  const oldFields = flatten(before); const newFields = flatten(after);
  return [...new Set([...oldFields.keys(), ...newFields.keys()])].sort()
    .filter((key) => oldFields.get(key) !== newFields.get(key))
    .map((field) => ({ field, before: oldFields.get(field) ?? "(absent)", after: newFields.get(field) ?? "(absent)" }));
}
