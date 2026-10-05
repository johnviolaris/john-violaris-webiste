import type { Metadata } from "next";

import { ServiceGroupForm } from "@/components/admin/service-group-form";

export const metadata: Metadata = {
  title: "Add group",
};

export default function NewServiceGroupPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-14 pb-12 md:px-8 md:pt-10">
      <header className="mb-6">
        <h1 className="font-display text-2xl font-semibold">Add group</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          A new heading for the services menu. It goes at the end of the menu —
          the arrows on the Services list move it — and appears on the site
          once a published service is in it.
        </p>
      </header>

      <ServiceGroupForm group={null} />
    </div>
  );
}
