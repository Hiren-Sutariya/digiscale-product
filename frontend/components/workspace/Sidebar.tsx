"use client";

import React, { useState, useEffect } from "react";
import { Upload, Eraser, Crop, Type, LayoutGrid, LayoutTemplate, Briefcase } from "lucide-react";
import { useWorkspace } from "./WorkspaceProvider";

const TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    upload: "Upload",
    assets: "Assets",
    brandkit: "Brand\nKit",
    removebg: "Remove\nBG",
    crop: "Crop",
    text: "Text",
  },
  gu: {
    upload: "અપલોડ",
    assets: "એસેટ્સ",
    brandkit: "બ્રાન્ડ\nકીટ",
    removebg: "બેકગ્રાઉન્ડ\nદૂર કરો",
    crop: "ક્રોપ",
    text: "લખાણ",
  },
  hi: {
    upload: "अपलोड",
    assets: "एसेट्स",
    brandkit: "ब्रांड\nकिट",
    removebg: "बैकग्राउंड\nहटाएं",
    crop: "क्रॉप",
    text: "टेक्स्ट",
  },
  es: {
    upload: "Subir",
    assets: "Activos",
    brandkit: "Marca\nKit",
    removebg: "Quitar\nFondo",
    crop: "Recortar",
    text: "Texto",
  }
};

const NAV_ITEMS = [
  { id: "upload",    icon: Upload,         label: "Upload"     },
  { id: "assets",    icon: LayoutGrid,     label: "Assets"     },
  { id: "brandkit",  icon: Briefcase,      label: "Brand\nKit" },
  { id: "removebg",  icon: Eraser,         label: "Remove\nBG" },
  { id: "crop",      icon: Crop,           label: "Crop"       },
  "divider",
  { id: "text",      icon: Type,           label: "Text"       },
] as const;

export function Sidebar() {
  const { activeTool, setActiveTool } = useWorkspace();
  const [lang, setLang] = useState<string>("en");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setLang(localStorage.getItem("digiscale_language") || "en");
    }
  }, []);

  const t = (key: string) => TRANSLATIONS[lang]?.[key] || TRANSLATIONS["en"]?.[key] || key;

  return (
    <div className="w-[84px] bg-white border-r border-slate-200 flex flex-col items-center py-5 shrink-0 z-10 shadow-[2px_0_15px_-3px_rgba(0,0,0,0.05)]">
      <div className="flex flex-col gap-1.5 w-full px-2.5">
        {NAV_ITEMS.map((item, i) => {
          if (item === "divider") {
            return <div key={`sep-${i}`} className="w-full h-px bg-slate-100 my-1.5" />;
          }
          const Icon = item.icon;
          const isActive = activeTool === item.id;
          const translatedLabel = t(item.id);
          return (
            <button
              key={item.id}
              onClick={() => setActiveTool(prev => prev === item.id ? null : item.id)}
              title={translatedLabel.replace("\n", " ")}
              className={`flex flex-col items-center justify-center p-2.5 rounded-xl w-full transition-all active:scale-95 cursor-pointer ${
                isActive
                  ? "bg-blue-600 text-white shadow-md border border-blue-700"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-800 border border-transparent"
              }`}
            >
              <Icon className="w-[18px] h-[18px] mb-1 shrink-0" />
              <span className="text-[9px] font-bold leading-tight text-center whitespace-pre-line">
                {translatedLabel}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
