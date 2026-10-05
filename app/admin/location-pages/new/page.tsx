import type { Metadata } from "next";
import { LocationForm } from "@/components/admin/location-form";
import { requireAdmin } from "@/lib/auth";
import { getServices } from "@/lib/cms/queries";

export const metadata: Metadata = { title: "New location draft" };

export default async function NewLocationPage() {
  await requireAdmin();
  const services = await getServices();
  return <div className="mx-auto w-full max-w-3xl px-4 pt-14 pb-12 md:px-8 md:pt-10"><h1 className="mb-6 font-display text-2xl font-semibold">New location draft</h1><LocationForm row={null} services={services} /></div>;
}
