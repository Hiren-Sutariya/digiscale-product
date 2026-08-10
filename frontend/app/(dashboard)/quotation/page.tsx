"use client";

import { useState, useEffect } from "react";
import { Shield } from "lucide-react";
import QuotationView from "@/components/layout/QuotationView";

export default function QuotationPage() {
  const [permission, setPermission] = useState("edit");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const role = localStorage.getItem("user_role") || "Admin";
      if (role === "Admin") {
        setPermission("edit");
      } else {
        setPermission(localStorage.getItem("perm_quotations") || "edit");
      }
    }
  }, []);

  if (permission === "none") {
    return (
      <div className="px-2.5 sm:px-8 pt-1.5 sm:pt-4 pb-6 flex-1 flex flex-col overflow-hidden bg-slate-50/50 min-h-0 w-full">
        <div className="flex flex-col items-center justify-center flex-1 h-[calc(100vh-140px)] text-center p-8 bg-slate-50/50">
          <div className="bg-red-50 text-red-655 rounded-full p-4 mb-4">
            <Shield className="h-10 w-10 animate-pulse" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 font-sans">Access Denied</h2>
          <p className="text-slate-500 max-w-sm mt-1 text-sm font-semibold">
            You do not have permission to access the Quotations section. Please contact your administrator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-2.5 sm:px-8 pt-1.5 sm:pt-4 pb-6 flex-1 flex flex-col overflow-hidden bg-slate-50/50 min-h-0 w-full">
      <QuotationView permission={permission} />
    </div>
  );
}
