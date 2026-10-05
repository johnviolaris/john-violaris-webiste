import { notFound } from "next/navigation";
import { redirectFromCms } from "@/lib/cms/redirects";

// Only otherwise-missing routes reach this resolver. Existing public pages incur
// no database lookup. ISR caches resolved redirects and misses across requests;
// the admin action invalidates an edited source immediately.
export const revalidate = 60;
export async function generateStaticParams() { return []; }

export default async function RetiredPage({ params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  await redirectFromCms(`/${path.join("/")}`);
  notFound();
}
