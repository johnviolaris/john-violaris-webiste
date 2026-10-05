import "./admin.css";

import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";

import { AdminSidebar } from "@/components/admin/admin-sidebar";
import {
  SidebarInset,
  SidebarMenuBadge,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { requireCmsSession } from "@/lib/auth";
import { countNewEnquiries } from "@/lib/enquiries/queries";

export const metadata: Metadata = {
  title: "Admin dashboard",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await requireCmsSession();

  return (
    <TooltipProvider>
      <SidebarProvider className="admin-surface">
        {/* The badge count is streamed rather than awaited here. Anything the
            layout waits for delays the page nested inside it, and a number on a
            sidebar link is not worth holding an enquiry back for. */}
        <AdminSidebar
          role={session.role}
          enquiryBadge={
            session.role === "admin" ? <Suspense fallback={null}>
              <NewEnquiryBadge />
            </Suspense> : null
          }
        />
        {/* `min-w-0` because the inset is a flex item beside the sidebar, and
            a flex item will not shrink below its content's minimum width by
            default. The list tables have a `min-w-[48rem]` and sit in their
            own `overflow-x-auto` wrappers, but that minimum still counts, so
            without this the whole column kept the table's width and pushed the
            page a sidebar's width past the window instead of letting the
            table scroll in its wrapper. */}
        <SidebarInset className="min-h-svh min-w-0 bg-background">
          <div className="fixed top-3 left-3 z-20 md:hidden">
            <SidebarTrigger className="border bg-background shadow-sm" />
          </div>
          {children}
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}

async function NewEnquiryBadge() {
  const count = await countNewEnquiries();

  if (count === 0) return null;

  return (
    <SidebarMenuBadge>
      {count}
      <span className="sr-only"> awaiting a reply</span>
    </SidebarMenuBadge>
  );
}
