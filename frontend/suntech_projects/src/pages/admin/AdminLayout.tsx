/**
 * Admin shell: fixed sidebar on desktop, collapsible drawer on mobile,
 * plus a permanent demo banner in demo sessions.
 */

import { useState } from "react";
import { Outlet } from "react-router-dom";

import { AdminSidebar } from "../../components/admin/AdminSidebar";
import { AdminHeader } from "../../components/admin/AdminHeader";
import { DemoBanner } from "../../components/admin/DemoBanner";
import { useAdminAuth } from "../../auth/useAdminAuth";

export function AdminLayout() {
  const auth = useAdminAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-sand-100">
      <AdminSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onSignOut={auth.signOut}
        isDemo={auth.isDemo}
      />

      <div className="lg:pl-64">
        <AdminHeader onOpenSidebar={() => setSidebarOpen(true)} isDemo={auth.isDemo} />
        {auth.isDemo && <DemoBanner />}
        <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
