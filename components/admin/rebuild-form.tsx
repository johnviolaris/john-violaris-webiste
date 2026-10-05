"use client";
import { useActionState } from "react";
import { rebuildPublicPages } from "@/app/admin/rebuild/actions";
import { initialCmsFormState } from "@/lib/cms/form";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function RebuildForm({ routes }: { routes: { path: string; label: string }[] }) {
  const [state, action, pending] = useActionState(rebuildPublicPages, initialCmsFormState({ path: "all" }));
  return <form action={action} className="space-y-4 rounded-xl border p-5">
    {state.message && <p role={state.status === "error" ? "alert" : "status"} className="text-sm">{state.message}</p>}
    <Label htmlFor="rebuild-path">Pages to refresh</Label><select id="rebuild-path" name="path" className="h-10 w-full rounded-md border bg-background px-3 text-sm" defaultValue="all"><option value="all">Whole public website</option>{routes.map((route) => <option key={route.path} value={route.path}>{route.label} ({route.path})</option>)}</select>
    <Button type="submit" disabled={pending}>{pending ? "Requesting…" : "Refresh public pages"}</Button>
  </form>;
}
