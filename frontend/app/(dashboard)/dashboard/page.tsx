"use client";

import Link from "next/link";
import { Sparkles, FolderOpen, FileText } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-slate-50/30 flex flex-col items-center justify-center px-8 py-20">
      <div className="w-full max-w-[1400px] mx-auto flex flex-col items-center">

        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-12">
          Select a destination
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-4xl">

          {/* Workspace */}
          <Link
            href="/workspace"
            className="group flex flex-col items-center gap-6 rounded-2xl border border-slate-200 bg-white px-10 py-16 text-center transition-all duration-300 hover:border-slate-300 hover:shadow-md active:scale-[0.98]"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 text-slate-700 transition group-hover:bg-slate-100">
              <Sparkles className="h-7 w-7 text-slate-500" />
            </div>
            <div>
              <p className="text-base font-bold text-slate-800 transition group-hover:text-slate-950">Workspace</p>
              <p className="text-xs text-slate-400 mt-1.5 font-medium leading-relaxed max-w-[200px]">
                Remove backgrounds &amp; edit your product images
              </p>
            </div>
          </Link>

          {/* Collections */}
          <Link
            href="/projects"
            className="group flex flex-col items-center gap-6 rounded-2xl border border-slate-200 bg-white px-10 py-16 text-center transition-all duration-300 hover:border-slate-300 hover:shadow-md active:scale-[0.98]"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 text-slate-700 transition group-hover:bg-slate-100">
              <FolderOpen className="h-7 w-7 text-slate-500" />
            </div>
            <div>
              <p className="text-base font-bold text-slate-800 transition group-hover:text-slate-950">Collections</p>
              <p className="text-xs text-slate-400 mt-1.5 font-medium leading-relaxed max-w-[200px]">
                Browse, view, and organize your saved items
              </p>
            </div>
          </Link>

          {/* Quotation */}
          <Link
            href="/quotation"
            className="group flex flex-col items-center gap-6 rounded-2xl border border-slate-200 bg-white px-10 py-16 text-center transition-all duration-300 hover:border-slate-300 hover:shadow-md active:scale-[0.98]"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 text-slate-700 transition group-hover:bg-slate-100">
              <FileText className="h-7 w-7 text-slate-500" />
            </div>
            <div>
              <p className="text-base font-bold text-slate-800 transition group-hover:text-slate-950">Quotation</p>
              <p className="text-xs text-slate-400 mt-1.5 font-medium leading-relaxed max-w-[200px]">
                Create and export professional quotes
              </p>
            </div>
          </Link>

        </div>
      </div>
    </div>
  );
}