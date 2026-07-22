"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import DashboardNavbar from "@/components/layout/DashboardNavbar";
import { supabase } from "@/lib/supabase";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const hideNavbar = pathname === "/dashboard";

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session && pathname !== "/workspace") {
        router.push("/login");
      } else {
        setLoading(false);
      }
    }
    checkAuth();
  }, [router, pathname]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {!hideNavbar && <DashboardNavbar />}

      <main className="flex-1 overflow-auto bg-slate-50">
        {children}
      </main>
    </div>
  );
}