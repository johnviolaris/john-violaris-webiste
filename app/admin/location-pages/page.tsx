import type { Metadata } from "next";
import Link from "next/link";
import { listLocationPagesAdmin } from "@/lib/cms/locations/admin-queries";
import { formatUkShortDateTime } from "@/lib/format";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = { title: "Location pages" };

export default async function LocationPagesAdmin() {
  const { rows, available } = await listLocationPagesAdmin();
  return <div className="mx-auto w-full max-w-6xl px-4 pt-14 pb-12 md:px-8 md:pt-10">
    <header className="mb-6 flex flex-wrap items-start justify-between gap-4"><div><h1 className="font-display text-2xl font-semibold">Location pages</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Future service-area content lives under /locations/area-slug. No location pages are generated automatically. Keep drafts private until they contain useful, bespoke local information and have been checked for legal and factual accuracy.</p></div>{available ? <Link href="/admin/location-pages/new" className={buttonVariants({ size: "sm" })}>New location draft</Link> : null}</header>
    {!available ? <p role="alert" className="rounded-xl border p-5 text-sm">Location storage is unavailable. Apply the location architecture migration to the project database before using this editor. No location content is published while storage is unavailable.</p> : rows.length === 0 ? <p className="rounded-xl border p-5 text-sm">There are no location drafts. Zero published city pages is the launch default.</p> : <div className="overflow-x-auto rounded-xl border"><table className="w-full text-left text-sm"><caption className="sr-only">Location drafts and publication status</caption><thead className="bg-muted/50"><tr><th scope="col" className="p-4">Area</th><th scope="col" className="p-4">Status</th><th scope="col" className="p-4">Last saved</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id} className="border-t"><td className="p-4"><Link href={`/admin/location-pages/${row.id}`} className="font-medium underline underline-offset-4">{row.location}</Link><p className="mt-1 font-mono text-xs text-muted-foreground">/locations/{row.slug}</p></td><td className="p-4">{row.published ? "Published · reviewed" : "Draft"}</td><td className="p-4"><time dateTime={row.updated_at}>{formatUkShortDateTime(row.updated_at)}</time></td></tr>)}</tbody></table></div>}
  </div>;
}
