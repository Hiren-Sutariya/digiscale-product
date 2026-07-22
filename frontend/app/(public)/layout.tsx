"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Footer from "@/components/layout/Footer";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Disable browser's automatic scroll restoration on refresh/load
      if ("scrollRestoration" in window.history) {
        window.history.scrollRestoration = "manual";
      }

      // Scroll to top immediately on mount or path change
      window.scrollTo(0, 0);

      // Delayed scroll check to guarantee top position after DOM paints lazy elements
      const timer = setTimeout(() => {
        window.scrollTo(0, 0);
      }, 50);

      return () => clearTimeout(timer);
    }
  }, [pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50/40 via-slate-50 to-indigo-50/40">
      {/* Main page content area stretches to fill available space, pushing footer down */}
      <div className="flex-grow flex flex-col">
        {children}
      </div>
      <Footer />
    </div>
  );
}