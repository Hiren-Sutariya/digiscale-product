"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function QuotationRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/projects?tab=quotation");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
        <p className="text-xs font-semibold text-slate-500">Redirecting to Collections Quotation...</p>
      </div>
    </div>
  );
}
