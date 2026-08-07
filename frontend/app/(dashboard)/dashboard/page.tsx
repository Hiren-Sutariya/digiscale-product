"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { FolderOpen, FileText, Warehouse, Users, Paintbrush, BookOpen } from "lucide-react";

const TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    selectDestination: "Select a destination",
    workspace: "Workspace",
    workspaceDesc: "Design, annotate, and edit workspace images",
    collections: "Collections",
    collectionsDesc: "Browse, view, and organize your saved items",
    warehouse: "Warehouse",
    warehouseDesc: "Organize, locate, and map shelf layouts",
    clients: "Clients",
    clientsDesc: "Manage customers for quick access",
    quotation: "Quotation",
    quotationDesc: "Create and export professional quotes",
    stockBook: "Stock Book",
    stockBookDesc: "Track product inflows, sales, quick adjustments and quantities"
  },
  gu: {
    selectDestination: "સ્થાન પસંદ કરો",
    workspace: "વર્કસ્પેસ",
    workspaceDesc: "વર્કસ્પેસ ઈમેજીસ ડીઝાઈન, એનોટેટ અને એડીટ કરો",
    collections: "કલેક્શન",
    collectionsDesc: "તમારી સાચવેલી વસ્તુઓ બ્રાઉઝ કરો, જુઓ અને ગોઠવો",
    warehouse: "વેરહાઉસ",
    warehouseDesc: "છાજલીઓની ગોઠવણ ગોઠવો, શોધો અને નકશો બનાવો",
    clients: "ગ્રાહકો",
    clientsDesc: "ઝડપી પ્રવેશ માટે ગ્રાહકોનું સંચાલણ કરો",
    quotation: "કોટેશન",
    quotationDesc: "વ્યવસાયિક અવતરણો બનાવો અને નિકાસ કરો",
    stockBook: "સ્ટોક બુક",
    stockBookDesc: "પ્રોડક્ટ ઇનફ્લો, વેચાણ, ઝડપી એડજસ્ટમેન્ટ અને સ્ટોક ટ્રૅક કરો"
  },
  hi: {
    selectDestination: "गंतव्य चुनें",
    workspace: "कार्यक्षेत्र",
    workspaceDesc: "कार्यक्षेत्र छवियों को डिज़ाइन, व्याख्या और संपादित करें",
    collections: "कलेक्शन",
    collectionsDesc: "अपनी सहेजी गई वस्तुओं को ब्राउज़ करें, देखें और व्यवस्थित करें",
    warehouse: "गोदाम",
    warehouseDesc: "शेल्फ लेआउट को व्यवस्थित करें, ढूंढें और मैप करें",
    clients: "ग्राहक",
    clientsDesc: "त्वरित पहुँच के लिए ग्राहकों को प्रबंधित करें",
    quotation: "कोटेशन",
    quotationDesc: "पेशेवर कोटेशन बनाएं और निर्यात करें",
    stockBook: "स्टॉक बुक",
    stockBookDesc: "उत्पाद इनफ्लो, बिक्री, त्वरित स्टॉक समायोजन को ट्रैक करें"
  },
  es: {
    selectDestination: "Seleccione un destino",
    workspace: "Espacio",
    workspaceDesc: "Diseñar, anotar y editar imágenes del espacio de trabajo",
    collections: "Colecciones",
    collectionsDesc: "Explore, vea y organice sus artículos guardados",
    warehouse: "Almacén",
    warehouseDesc: "Organizar, ubicar y mapear diseños de estantes",
    clients: "Clientes",
    clientsDesc: "Administrar clientes para un acceso rápido",
    quotation: "Cotización",
    quotationDesc: "Crear y exportar cotizaciones profesionales",
    stockBook: "Libro de Stock",
    stockBookDesc: "Realice un seguimiento de las entradas, ventas y cantidades de productos"
  }
};

export default function DashboardPage() {
  const [lang, setLang] = useState<string>("en");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setLang(localStorage.getItem("digiscale_language") || "en");
    }
  }, []);

  const t = (key: string) => TRANSLATIONS[lang]?.[key] || TRANSLATIONS["en"]?.[key] || key;

  return (
    <div className="flex-1 bg-slate-50/50 flex flex-col items-center justify-center px-4 py-6 sm:py-20 overflow-y-auto">
      <div className="w-full max-w-[1400px] mx-auto flex flex-col items-center">

        <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-slate-400 mb-6 sm:mb-12">
          {t("selectDestination")}
        </p>

        {/* Grid layout for 5 items - equal styling */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-6 lg:gap-8 w-full max-w-[1300px]">

          {/* Workspace commented out as requested
          <Link
            href="/workspace"
            className="group hidden sm:flex flex-col items-center justify-center gap-2.5 sm:gap-5 rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-3.5 sm:p-6 aspect-square sm:aspect-auto sm:h-60 w-full text-center transition-all duration-300 hover:border-blue-500 hover:shadow-lg active:scale-[0.98] cursor-pointer shadow-sm"
          >
            <div className="flex h-10 w-10 sm:h-16 sm:w-16 items-center justify-center rounded-xl sm:rounded-2xl border border-slate-100 bg-slate-50 text-slate-700 transition group-hover:bg-blue-50 group-hover:text-blue-600 shadow-sm">
              <Paintbrush className="h-4 w-4 sm:h-7 sm:w-7 text-slate-500 group-hover:text-blue-600 transition" />
            </div>
            <div>
              <p className="text-xs sm:text-base font-extrabold text-slate-800 transition group-hover:text-blue-600">{t("workspace")}</p>
              <p className="hidden sm:block text-[11px] text-slate-400 mt-2 font-medium leading-relaxed max-w-[170px] mx-auto">
                {t("workspaceDesc")}
              </p>
            </div>
          </Link>
          */}

          {/* Collections */}
          <Link
            href="/projects"
            className="group flex flex-col items-center justify-center gap-2.5 sm:gap-5 rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-3.5 sm:p-6 aspect-square sm:aspect-auto sm:h-60 w-full text-center transition-all duration-300 hover:border-blue-500 hover:shadow-lg active:scale-[0.98] cursor-pointer shadow-sm"
          >
            <div className="flex h-10 w-10 sm:h-16 sm:w-16 items-center justify-center rounded-xl sm:rounded-2xl border border-slate-100 bg-slate-50 text-slate-700 transition group-hover:bg-blue-50 group-hover:text-blue-600 shadow-sm">
              <FolderOpen className="h-4 w-4 sm:h-7 sm:w-7 text-slate-500 group-hover:text-blue-600 transition" />
            </div>
            <div>
              <p className="text-xs sm:text-base font-extrabold text-slate-800 transition group-hover:text-blue-600">{t("collections")}</p>
              <p className="hidden sm:block text-[11px] text-slate-400 mt-2 font-medium leading-relaxed max-w-[170px] mx-auto">
                {t("collectionsDesc")}
              </p>
            </div>
          </Link>

          {/* Warehouse */}
          <Link
            href="/warehouse"
            className="group flex flex-col items-center justify-center gap-2.5 sm:gap-5 rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-3.5 sm:p-6 aspect-square sm:aspect-auto sm:h-60 w-full text-center transition-all duration-300 hover:border-blue-500 hover:shadow-lg active:scale-[0.98] cursor-pointer shadow-sm"
          >
            <div className="flex h-10 w-10 sm:h-16 sm:w-16 items-center justify-center rounded-xl sm:rounded-2xl border border-slate-100 bg-slate-50 text-slate-700 transition group-hover:bg-blue-50 group-hover:text-blue-600 shadow-sm">
              <Warehouse className="h-4 w-4 sm:h-7 sm:w-7 text-slate-500 group-hover:text-blue-600 transition" />
            </div>
            <div>
              <p className="text-xs sm:text-base font-extrabold text-slate-800 transition group-hover:text-blue-600">{t("warehouse")}</p>
              <p className="hidden sm:block text-[11px] text-slate-400 mt-2 font-medium leading-relaxed max-w-[170px] mx-auto">
                {t("warehouseDesc")}
              </p>
            </div>
          </Link>

          {/* Clients */}
          <Link
            href="/clients"
            className="group flex flex-col items-center justify-center gap-2.5 sm:gap-5 rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-3.5 sm:p-6 aspect-square sm:aspect-auto sm:h-60 w-full text-center transition-all duration-300 hover:border-blue-500 hover:shadow-lg active:scale-[0.98] cursor-pointer shadow-sm"
          >
            <div className="flex h-10 w-10 sm:h-16 sm:w-16 items-center justify-center rounded-xl sm:rounded-2xl border border-slate-100 bg-slate-50 text-slate-700 transition group-hover:bg-blue-50 group-hover:text-blue-600 shadow-sm">
              <Users className="h-4 w-4 sm:h-7 sm:w-7 text-slate-500 group-hover:text-blue-600 transition" />
            </div>
            <div>
              <p className="text-xs sm:text-base font-extrabold text-slate-800 transition group-hover:text-blue-600">{t("clients")}</p>
              <p className="hidden sm:block text-[11px] text-slate-400 mt-2 font-medium leading-relaxed max-w-[170px] mx-auto">
                {t("clientsDesc")}
              </p>
            </div>
          </Link>

          {/* Quotation */}
          <Link
            href="/quotation"
            className="group flex flex-col items-center justify-center gap-2.5 sm:gap-5 rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-3.5 sm:p-6 aspect-square sm:aspect-auto sm:h-60 w-full text-center transition-all duration-300 hover:border-blue-500 hover:shadow-lg active:scale-[0.98] cursor-pointer shadow-sm"
          >
            <div className="flex h-10 w-10 sm:h-16 sm:w-16 items-center justify-center rounded-xl sm:rounded-2xl border border-slate-100 bg-slate-50 text-slate-700 transition group-hover:bg-blue-50 group-hover:text-blue-600 shadow-sm">
              <FileText className="h-4 w-4 sm:h-7 sm:w-7 text-slate-500 group-hover:text-blue-600 transition" />
            </div>
            <div>
              <p className="text-xs sm:text-base font-extrabold text-slate-800 transition group-hover:text-blue-600">{t("quotation")}</p>
              <p className="hidden sm:block text-[11px] text-slate-400 mt-2 font-medium leading-relaxed max-w-[170px] mx-auto">
                {t("quotationDesc")}
              </p>
            </div>
          </Link>

          {/* Stock Book */}
          <Link
            href="/stock-book"
            className="group flex flex-col items-center justify-center gap-2.5 sm:gap-5 rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-3.5 sm:p-6 aspect-square sm:aspect-auto sm:h-60 w-full text-center transition-all duration-300 hover:border-blue-500 hover:shadow-lg active:scale-[0.98] cursor-pointer shadow-sm"
          >
            <div className="flex h-10 w-10 sm:h-16 sm:w-16 items-center justify-center rounded-xl sm:rounded-2xl border border-slate-100 bg-slate-50 text-slate-700 transition group-hover:bg-blue-50 group-hover:text-blue-600 shadow-sm">
              <BookOpen className="h-4 w-4 sm:h-7 sm:w-7 text-slate-500 group-hover:text-blue-600 transition" />
            </div>
            <div>
              <p className="text-xs sm:text-base font-extrabold text-slate-800 transition group-hover:text-blue-600">{t("stockBook")}</p>
              <p className="hidden sm:block text-[11px] text-slate-400 mt-2 font-medium leading-relaxed max-w-[190px] mx-auto">
                {t("stockBookDesc")}
              </p>
            </div>
          </Link>

        </div>

      </div>
    </div>
  );
}