"use client";

import React, { useState, useEffect } from "react";
import { Undo2, Redo2, ZoomIn, ZoomOut, Download, Trash2, Save, ArrowLeft, X, Loader2, Check } from "lucide-react";
import { useWorkspace } from "./WorkspaceProvider";
import { jsPDF } from "jspdf";

const TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    dashboard: "Dashboard",
    undo: "Undo",
    redo: "Redo",
    zoomIn: "Zoom In",
    zoomOut: "Zoom Out",
    fit: "Fit",
    deleteSelected: "Delete Selected",
    save: "Save",
    export: "Export",
    saveSuccess: "Project saved successfully!",
    exportSettings: "Export Design Settings",
    format: "File Format",
    dimensions: "Dimensions",
    transparency: "Transparent Background",
    scaleMultiplier: "Scale Size (Resolution)",
    quality: "Quality",
    exporting: "Exporting...",
    downloadBtn: "Download File",
    cancel: "Cancel",
  },
  gu: {
    dashboard: "ડેશબોર્ડ",
    undo: "પૂર્વવત્ કરો",
    redo: "ફરીથી કરો",
    zoomIn: "ઝૂમ ઇન",
    zoomOut: "ઝૂમ આઉટ",
    fit: "ફિટ",
    deleteSelected: "પસંદ કરેલું કાઢી નાખો",
    save: "સાચવો",
    export: "નિકાસ કરો",
    saveSuccess: "પ્રોજેક્ટ સફળતાપૂર્વક સાચવવામાં આવ્યો!",
    exportSettings: "ડિઝાઇન નિકાસ સેટિંગ્સ",
    format: "ફાઇલ ફોર્મેટ",
    dimensions: "પરિમાણો",
    transparency: "પારદર્શક બેકગ્રાઉન્ડ",
    scaleMultiplier: "સ્કેલ સાઇઝ (રિઝોલ્યુશન)",
    quality: "ગુણવત્તા",
    exporting: "નિકાસ થઈ રહી છે...",
    downloadBtn: "ફાઇલ ડાઉનલોડ કરો",
    cancel: "રદ કરો",
  },
  hi: {
    dashboard: "डैशबोर्ड",
    undo: "पूर्ववत करें",
    redo: "फिर से करें",
    zoomIn: "ज़ूम इन",
    zoomOut: "ज़ूम आउट",
    fit: "फिट",
    deleteSelected: "चयनित हटाएं",
    save: "सहेजें",
    export: "निर्यात करें",
    saveSuccess: "परियोजना सफलतापूर्वक सहेजी गई!",
    exportSettings: "डिज़ाइन निर्यात सेटिंग्स",
    format: "फ़ाइल प्रारूप",
    dimensions: "आयाम",
    transparency: "पारदर्शी पृष्ठभूमि",
    scaleMultiplier: "स्केल आकार (रिज़ॉल्यूशन)",
    quality: "गुणवत्ता",
    exporting: "निर्यात हो रहा है...",
    downloadBtn: "फ़ाइल डाउनलोड करें",
    cancel: "रद्द करें",
  },
  es: {
    dashboard: "Tablero",
    undo: "Deshacer",
    redo: "Rehacer",
    zoomIn: "Acercar",
    zoomOut: "Alejar",
    fit: "Ajustar",
    deleteSelected: "Eliminar seleccionado",
    save: "Guardar",
    export: "Exportar",
    saveSuccess: "¡Proyecto guardado con éxito!",
    exportSettings: "Configuración de Exportación",
    format: "Formato de Archivo",
    dimensions: "Dimensiones",
    transparency: "Fondo Transparente",
    scaleMultiplier: "Escala (Resolución)",
    quality: "Calidad",
    exporting: "Exportando...",
    downloadBtn: "Descargar Archivo",
    cancel: "Cancelar",
  }
};

export function TopBar() {
  const { 
    canvas, undo, redo, zoom, setZoom, historyIndex, history, 
    projectName, setProjectName, triggerFitToScreen, closeProject,
    canvasConfig
  } = useWorkspace();

  const [lang, setLang] = useState<string>("en");

  // Export States
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<"png" | "jpg" | "webp" | "pdf">("png");
  const [exportMultiplier, setExportMultiplier] = useState<number>(2); // 1x, 2x, 3x
  const [exportQuality, setExportQuality] = useState<number>(0.92); // for jpg/webp
  const [isTransparent, setIsTransparent] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(-1); // -1: idle, 0: prep, 50: render, 100: done
  const [progressMsg, setProgressMsg] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setLang(localStorage.getItem("digiscale_language") || "en");
    }
  }, []);

  const t = (key: string) => TRANSLATIONS[lang]?.[key] || TRANSLATIONS["en"]?.[key] || key;

  const triggerDownloadProcess = async () => {
    if (!canvas) return;
    
    // Step 0: Prep (300ms)
    setExportProgress(0);
    setProgressMsg("Preparing workspace elements...");
    await new Promise((res) => setTimeout(res, 350));

    // Step 1: Render (400ms)
    setExportProgress(50);
    setProgressMsg("Generating high-resolution graphics...");
    await new Promise((res) => setTimeout(res, 450));

    // Step 2: Download (200ms)
    setExportProgress(90);
    setProgressMsg("Finalizing download file...");
    await new Promise((res) => setTimeout(res, 250));

    // Perform actual file creation
    canvas.discardActiveObject();
    canvas.renderAll();

    const fileName = projectName.replace(/\s+/g, '-').toLowerCase() || 'workspace-design';
    const originalBgColor = canvas.backgroundColor;
    const originalBgImage = canvas.backgroundImage;

    // Apply transparency settings if applicable
    if (isTransparent && (exportFormat === "png" || exportFormat === "webp")) {
      canvas.backgroundColor = "";
      canvas.backgroundImage = null as any;
      canvas.renderAll();
    }

    try {
      if (exportFormat === "pdf") {
        // PDF Export
        const dataUrl = canvas.toDataURL({
          format: 'png',
          quality: 1,
          multiplier: exportMultiplier
        });
        
        const doc = new jsPDF({
          orientation: canvasConfig.width > canvasConfig.height ? "landscape" : "portrait",
          unit: "px",
          format: [canvasConfig.width * exportMultiplier, canvasConfig.height * exportMultiplier]
        });
        doc.addImage(dataUrl, "PNG", 0, 0, canvasConfig.width * exportMultiplier, canvasConfig.height * exportMultiplier);
        doc.save(`${fileName}.pdf`);
      } else {
        // Image Export (PNG, JPG, WEBP)
        const formatType = exportFormat === "jpg" ? "jpeg" : exportFormat;
        const dataUrl = canvas.toDataURL({
          format: formatType,
          quality: exportQuality,
          multiplier: exportMultiplier
        });

        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = `${fileName}.${exportFormat}`;
        a.click();
      }
    } catch (e) {
      console.error("Export error:", e);
    }

    // Restore background color/image if changed
    if (isTransparent && (exportFormat === "png" || exportFormat === "webp")) {
      canvas.backgroundColor = originalBgColor;
      canvas.backgroundImage = originalBgImage;
      canvas.renderAll();
    }

    setExportProgress(100);
    setProgressMsg("Done!");
    await new Promise((res) => setTimeout(res, 200));

    // Reset and close
    setExportProgress(-1);
    setIsExportOpen(false);
  };

  const deleteSelected = () => {
    if (!canvas) return;
    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length) {
      activeObjects.forEach(obj => canvas.remove(obj));
      canvas.discardActiveObject();
      canvas.renderAll();
    }
  };

  const handleSave = async () => {
    if (!canvas) return;
    
    // Auto-save logic triggers automatically, but manual save updates the store
    const json = JSON.stringify(canvas.toJSON());
    localStorage.setItem("digiscale_autosave", json);
    alert(t("saveSuccess"));
  };

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  React.useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          if (canRedo) redo();
        } else {
          if (canUndo) undo();
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        if (canRedo) redo();
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [canUndo, canRedo, undo, redo]);

  return (
    <div className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-5 z-10 shadow-[0_1px_2px_-1px_rgba(0,0,0,0.05)] shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={closeProject}
          className="flex items-center gap-1.5 px-3 py-1.5 text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-xl transition text-[11px] font-bold cursor-pointer border border-slate-200 shadow-sm active:scale-95 shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> {t("dashboard")}
        </button>
        <div className="w-px h-5 bg-slate-200 mx-1" />
        <input 
          type="text" 
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          className="text-[13px] font-bold text-slate-800 bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-100 rounded px-2 py-1 w-40 font-black"
        />
      </div>
      
      <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-100">
        <button 
          onClick={undo}
          disabled={!canUndo}
          className={`p-1.5 rounded-md transition active:scale-95 ${canUndo ? 'text-slate-700 hover:bg-white hover:shadow-sm' : 'text-slate-300 cursor-not-allowed'}`}
          title={`${t("undo")} (Ctrl+Z)`}
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button 
          onClick={redo}
          disabled={!canRedo}
          className={`p-1.5 rounded-md transition active:scale-95 ${canRedo ? 'text-slate-700 hover:bg-white hover:shadow-sm' : 'text-slate-300 cursor-not-allowed'}`}
          title={`${t("redo")} (Ctrl+Y)`}
        >
          <Redo2 className="w-4 h-4" />
        </button>
        
        <div className="w-px h-4 bg-slate-200 mx-1" />

        <button 
          onClick={() => setZoom(Math.max(0.1, zoom - 0.1))}
          className="p-1.5 text-slate-700 hover:bg-white hover:shadow-sm rounded-md transition active:scale-95"
          title={t("zoomOut")}
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <select 
          value={zoom}
          onChange={(e) => {
            if (e.target.value === "fit") {
              triggerFitToScreen();
            } else {
              setZoom(parseFloat(e.target.value));
            }
          }}
          className="text-[11px] font-bold w-16 text-center text-slate-700 bg-transparent border-none outline-none focus:ring-1 focus:ring-blue-200 rounded cursor-pointer appearance-none"
        >
          <option value="fit">{t("fit")}</option>
          <option value={0.25}>25%</option>
          <option value={0.50}>50%</option>
          <option value={0.75}>75%</option>
          <option value={1.00}>100%</option>
          <option value={1.50}>150%</option>
          <option value={2.00}>200%</option>
          {!["0.25", "0.5", "0.75", "1", "1.5", "2"].includes(zoom.toString()) && (
            <option value={zoom}>{Math.round(zoom * 100)}%</option>
          )}
        </select>
        <button 
          onClick={() => setZoom(Math.min(5, zoom + 0.1))}
          className="p-1.5 text-slate-700 hover:bg-white hover:shadow-sm rounded-md transition active:scale-95"
          title={t("zoomIn")}
        >
          <ZoomIn className="w-4 h-4" />
        </button>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={deleteSelected} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition active:scale-95 cursor-pointer" title={t("deleteSelected")}>
          <Trash2 className="w-4 h-4" />
        </button>

        <button onClick={handleSave} className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition active:scale-95 cursor-pointer">
          <Save className="w-4 h-4" />
          <span>{t("save")}</span>
        </button>

        <button onClick={() => setIsExportOpen(true)} className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition shadow-sm active:scale-95 cursor-pointer" title={t("export")}>
          <Download className="w-4 h-4" />
          <span>{t("export")}</span>
        </button>
      </div>

      {/* EXPORT OPTIONS MODAL */}
      {isExportOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">{t("exportSettings")}</h3>
              <button 
                onClick={() => {
                  if (exportProgress === -1) setIsExportOpen(false);
                }}
                className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-650 transition cursor-pointer"
                disabled={exportProgress !== -1}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            {exportProgress !== -1 ? (
              // Export Progress State View
              <div className="p-8 flex flex-col items-center justify-center text-center space-y-4">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full blur-xl bg-blue-500/25 animate-pulse"></div>
                  {exportProgress === 100 ? (
                    <div className="h-14 w-14 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 scale-110 duration-200">
                      <Check className="h-6 w-6 stroke-[3]" />
                    </div>
                  ) : (
                    <Loader2 className="h-12 w-12 animate-spin text-blue-600 relative z-10" />
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-black text-slate-800">{progressMsg}</p>
                  <div className="w-40 bg-slate-100 h-1.5 rounded-full overflow-hidden mx-auto mt-2">
                    <div 
                      className="bg-blue-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${exportProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              // Option Configuration Form View
              <div className="p-6 space-y-4 text-xs font-semibold">
                
                {/* Format Dropdown */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{t("format")}</label>
                  <select 
                    value={exportFormat}
                    onChange={(e: any) => {
                      const fmt = e.target.value;
                      setExportFormat(fmt);
                      if (fmt === "jpg" || fmt === "pdf") {
                        setIsTransparent(false);
                      }
                    }}
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 transition bg-white"
                  >
                    <option value="png">PNG (Portable Network Graphics)</option>
                    <option value="jpg">JPG (Joint Photographic Group)</option>
                    <option value="webp">WEBP (Modern Web Format)</option>
                    <option value="pdf">PDF (Printable Vector Document)</option>
                  </select>
                </div>

                {/* Resolution Multiplier */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{t("scaleMultiplier")}</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3].map(m => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setExportMultiplier(m)}
                        className={`py-2 border rounded-xl text-center font-black transition cursor-pointer ${
                          exportMultiplier === m
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {m}x ({canvasConfig.width * m}x{canvasConfig.height * m})
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quality Slider (JPG/WEBP only) */}
                {(exportFormat === "jpg" || exportFormat === "webp") && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{t("quality")}</label>
                      <span className="text-[10px] font-black text-blue-600">{Math.round(exportQuality * 100)}%</span>
                    </div>
                    <input 
                      type="range"
                      min={0.1}
                      max={1.0}
                      step={0.01}
                      value={exportQuality}
                      onChange={(e) => setExportQuality(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                  </div>
                )}

                {/* Transparent checkbox (PNG/WEBP only) */}
                {(exportFormat === "png" || exportFormat === "webp") && (
                  <label className="flex items-center gap-2.5 py-1.5 select-none cursor-pointer text-slate-650">
                    <input 
                      type="checkbox"
                      checked={isTransparent}
                      onChange={(e) => setIsTransparent(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 border-slate-300 w-4 h-4 cursor-pointer"
                    />
                    <span className="text-xs font-bold leading-none">{t("transparency")}</span>
                  </label>
                )}

                {/* Confirm Buttons */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsExportOpen(false)}
                    className="px-4 py-2 border border-slate-200 bg-white text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 transition active:scale-95 cursor-pointer"
                  >
                    {t("cancel")}
                  </button>
                  <button
                    type="button"
                    onClick={triggerDownloadProcess}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-sm active:scale-95 cursor-pointer flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{t("downloadBtn")}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
