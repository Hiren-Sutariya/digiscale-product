"use client";

import Link from "next/link";
import { FolderOpen, FileText, Warehouse, Users, Paintbrush } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="h-full bg-slate-50/50 flex flex-col items-center justify-center px-8 py-20 overflow-y-auto">
      <div className="w-full max-w-[1400px] mx-auto flex flex-col items-center">

        <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-12">
          Select a destination
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 w-full max-w-[1300px]">

          {/* Workspace */}
          <Link
            href="/workspace"
            className="group flex flex-col items-center justify-center gap-5 rounded-3xl border border-slate-200 bg-white p-6 aspect-square text-center transition-all duration-300 hover:border-blue-500 hover:shadow-lg active:scale-[0.98] cursor-pointer shadow-sm"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 text-slate-700 transition group-hover:bg-blue-50 group-hover:text-blue-600 shadow-sm">
              <Paintbrush className="h-7 w-7 text-slate-500 group-hover:text-blue-600 transition" />
            </div>
            <div>
              <p className="text-base font-extrabold text-slate-800 transition group-hover:text-blue-600">Workspace</p>
              <p className="text-[11px] text-slate-400 mt-2 font-medium leading-relaxed max-w-[170px] mx-auto">
                Design, annotate, and edit workspace images
              </p>
            </div>
          </Link>

          {/* Collections */}
          <Link
            href="/projects"
            className="group flex flex-col items-center justify-center gap-5 rounded-3xl border border-slate-200 bg-white p-6 aspect-square text-center transition-all duration-300 hover:border-blue-500 hover:shadow-lg active:scale-[0.98] cursor-pointer shadow-sm"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 text-slate-700 transition group-hover:bg-blue-50 group-hover:text-blue-600 shadow-sm">
              <FolderOpen className="h-7 w-7 text-slate-500 group-hover:text-blue-600 transition" />
            </div>
            <div>
              <p className="text-base font-extrabold text-slate-800 transition group-hover:text-blue-600">Collections</p>
              <p className="text-[11px] text-slate-400 mt-2 font-medium leading-relaxed max-w-[170px] mx-auto">
                Browse, view, and organize your saved items
              </p>
            </div>
          </Link>

          {/* Warehouse */}
          <Link
            href="/warehouse"
            className="group flex flex-col items-center justify-center gap-5 rounded-3xl border border-slate-200 bg-white p-6 aspect-square text-center transition-all duration-300 hover:border-blue-500 hover:shadow-lg active:scale-[0.98] cursor-pointer shadow-sm"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 text-slate-700 transition group-hover:bg-blue-50 group-hover:text-blue-600 shadow-sm">
              <Warehouse className="h-7 w-7 text-slate-500 group-hover:text-blue-600 transition" />
            </div>
            <div>
              <p className="text-base font-extrabold text-slate-800 transition group-hover:text-blue-600">Warehouse</p>
              <p className="text-[11px] text-slate-400 mt-2 font-medium leading-relaxed max-w-[170px] mx-auto">
                Organize, locate, and map shelf layouts
              </p>
            </div>
          </Link>

          {/* Clients */}
          <Link
            href="/clients"
            className="group flex flex-col items-center justify-center gap-5 rounded-3xl border border-slate-200 bg-white p-6 aspect-square text-center transition-all duration-300 hover:border-blue-500 hover:shadow-lg active:scale-[0.98] cursor-pointer shadow-sm"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 text-slate-700 transition group-hover:bg-blue-50 group-hover:text-blue-600 shadow-sm">
              <Users className="h-7 w-7 text-slate-500 group-hover:text-blue-600 transition" />
            </div>
            <div>
              <p className="text-base font-extrabold text-slate-800 transition group-hover:text-blue-600">Clients</p>
              <p className="text-[11px] text-slate-400 mt-2 font-medium leading-relaxed max-w-[170px] mx-auto">
                Manage customers for quick access
              </p>
            </div>
          </Link>

          {/* Quotation */}
          <Link
            href="/quotation"
            className="group flex flex-col items-center justify-center gap-5 rounded-3xl border border-slate-200 bg-white p-6 aspect-square text-center transition-all duration-300 hover:border-blue-500 hover:shadow-lg active:scale-[0.98] cursor-pointer shadow-sm"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 text-slate-700 transition group-hover:bg-blue-50 group-hover:text-blue-600 shadow-sm">
              <FileText className="h-7 w-7 text-slate-500 group-hover:text-blue-600 transition" />
            </div>
            <div>
              <p className="text-base font-extrabold text-slate-800 transition group-hover:text-blue-600">Quotation</p>
              <p className="text-[11px] text-slate-400 mt-2 font-medium leading-relaxed max-w-[170px] mx-auto">
                Create and export professional quotes
              </p>
            </div>
          </Link>

        </div>
      </div>
    </div>
  );
}