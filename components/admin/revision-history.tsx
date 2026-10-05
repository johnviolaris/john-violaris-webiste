import { listContentRevisions, type RevisionEntity } from "@/lib/cms/revisions/queries";
import { RevisionRestoreButton } from "@/components/admin/revision-restore-button";
import { formatUkShortDateTime } from "@/lib/format";
import Link from "next/link";
import { practiceSettingKeys } from "@/lib/cms/revisions/validation";

export async function RevisionHistory({ entity, id, previewPath }: { entity: RevisionEntity; id: string; previewPath?: string }) {
  const { revisions, available } = await listContentRevisions(entity, id);
  const canDraft = ["blog_posts", "service_pages", "location_pages", "services"].includes(entity);
  const headingId = `revision-history-${entity}-${id.replace(/[^a-z0-9]/gi, "-")}`;
  return <section className="mt-8 rounded-xl border p-5" aria-labelledby={headingId}>
    <h2 id={headingId} className="font-display text-lg font-semibold">Saved versions</h2>
    <p className="mt-1 text-sm text-muted-foreground">Content changes are kept automatically with the editor and UK time. {canDraft ? "Restores create a draft for review." : "Restoring settings or static page copy updates the live site immediately."}</p>
    {!available ? <p role="status" className="mt-3 text-sm">Version history becomes available after the publishing migration is installed.</p> :
      <ol className="mt-4 divide-y">
        {revisions.map((revision) => {
          const latest = revisions.find((entry) => entity === "seo_metadata" && revision.entity_id ? entry.entity_id === revision.entity_id : entry.entity_key === revision.entity_key)!;
          const isLatest = latest.id === revision.id;
          return <li key={revision.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
          <div className="text-sm">
            <span className="font-medium">Version {revision.revision_number}</span> · {revision.operation}{isLatest ? " · Latest saved" : ""}
            {!id && <span className="block font-medium">{revision.entity_key}</span>}
            <time className="mt-1 block text-xs text-muted-foreground" dateTime={revision.created_at}>{formatUkShortDateTime(revision.created_at)}</time>
            <span className="block text-xs text-muted-foreground">{revision.actor_id ? `Editor ${revision.actor_id.slice(0, 8)}` : "System / migration"}</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {previewPath && <Link href={`${previewPath}?revision=${revision.id}`} target="_blank" rel="noopener"
              className="text-sm underline underline-offset-4">Preview version</Link>}
            {!isLatest && <Link href={`/admin/history/${revision.id}?against=${latest.id}`} className="text-sm underline underline-offset-4">Compare with latest</Link>}
            {entity !== "testimonials" && (!isLatest || latest.operation === "delete") && revision.operation !== "delete" && <RevisionRestoreButton id={revision.id} asDraft={canDraft} crawlRules={entity === "site_settings" && revision.entity_key === "robots"} practiceFacts={entity === "site_settings" && practiceSettingKeys.includes(revision.entity_key as (typeof practiceSettingKeys)[number])} />}
          </div>
        </li>; })}
        {revisions.length === 0 && <li className="py-3 text-sm text-muted-foreground">No versions saved yet.</li>}
      </ol>}
  </section>;
}
