"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import DashboardNavbar from "@/components/layout/DashboardNavbar";
import { checkAndRunAutoBackup } from "@/lib/backup";
import { getUserProfile } from "@/services/api";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const hideNavbar = pathname === "/dashboard";
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo(0, 0);
    }
  }, [pathname]);

  // Run automatic background backup check on mount
  useEffect(() => {
    getUserProfile()
      .then((profile) => {
        if (profile && profile.id) {
          checkAndRunAutoBackup(profile.id.toString());
        }
      })
      .catch((err) => {
        console.error("Auto-backup validation skipped (offline/unauthenticated):", err);
      });
  }, []);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {!hideNavbar && <DashboardNavbar />}

      <main ref={mainRef} className="flex-1 overflow-hidden bg-slate-50 flex flex-col">
        {children}
      </main>
    </div>
  );
}