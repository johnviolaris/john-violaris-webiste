import Link from "next/link";
import { notFound } from "next/navigation";
import { getRevisionForComparison } from "@/lib/cms/revisions/queries";
import { compareRevisionSnapshots } from "@/lib/cms/revisions/compare";
import { formatUkShortDateTime } from "@/lib/format";
export const metadata = { title: "Compare saved versions" };
export default async function CompareVersionsPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ against?: string }> }) {
  const { id } = await params; const { against } = await searchParams;
  if (!against) notFound();
  const [before, after] = await Promise.all([getRevisionForComparison(id), getRevisionForComparison(against)]);
  if (!before || !after || before.entity_table !== after.entity_table || (before.entity_key !== after.entity_key && (!before.entity_id || before.entity_id !== after.entity_id))) notFound();
  const differences = compareRevisionSnapshots(before.snapshot, after.snapshot);
  return <div className="mx-auto max-w-6xl px-4 pt-14 pb-12 md:px-8 md:pt-10"><Link href="/admin" className="text-sm underline">CMS dashboard</Link><h1 className="mt-3 font-display text-2xl font-semibold">Compare saved versions</h1><p className="mt-2 text-sm text-muted-foreground">{before.entity_table} · {before.entity_key}. Changed fields appear below. Times use Europe/London.</p>
    <div className="mt-6 overflow-x-auto"><table className="w-full table-fixed border-collapse text-sm"><caption className="sr-only">Changes between two saved versions</caption><thead><tr className="border-b text-left"><th className="w-1/5 p-3">Field</th><th className="w-2/5 p-3">Version {before.revision_number}<span className="block font-normal">{formatUkShortDateTime(before.created_at)}</span></th><th className="w-2/5 p-3">Version {after.revision_number}<span className="block font-normal">{formatUkShortDateTime(after.created_at)}</span></th></tr></thead><tbody>{differences.map((change) => <tr key={change.field} className="border-b align-top"><th scope="row" className="break-all p-3 text-left font-medium">{change.field}</th><td className="whitespace-pre-wrap break-words bg-red-50 p-3 dark:bg-red-950/20">{change.before}</td><td className="whitespace-pre-wrap break-words bg-green-50 p-3 dark:bg-green-950/20">{change.after}</td></tr>)}</tbody></table></div>{differences.length === 0 && <p className="mt-5 text-sm">No content fields changed between these versions.</p>}
  </div>;
}
