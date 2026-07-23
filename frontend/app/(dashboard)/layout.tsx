"use client";

import { usePathname } from "next/navigation";
import DashboardNavbar from "@/components/layout/DashboardNavbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const hideNavbar = pathname === "/dashboard";

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {!hideNavbar && <DashboardNavbar />}

      <main className="flex-1 overflow-auto bg-slate-50">
        {children}
      </main>
    </div>
  );
}