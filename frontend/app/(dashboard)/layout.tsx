"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import DashboardNavbar from "@/components/layout/DashboardNavbar";

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

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {!hideNavbar && <DashboardNavbar />}

      <main ref={mainRef} className="flex-1 overflow-auto bg-slate-50">
        {children}
      </main>
    </div>
  );
}