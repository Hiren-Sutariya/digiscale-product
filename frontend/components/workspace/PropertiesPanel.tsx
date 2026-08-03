"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useWorkspace } from "./WorkspaceProvider";
import { fabric } from "fabric";
import JSZip from "jszip";
import {
  Lock, Unlock, AlignLeft, AlignCenter, AlignRight,
  Bold, Italic, Underline, FlipHorizontal, FlipVertical,
  RotateCcw, Download, X, AlignCenterHorizontal, AlignCenterVertical,
  Loader2, Eye, EyeOff, Upload, ImageIcon, ChevronDown,
  Sun, Contrast, Droplets, Zap, Wind,
  Type, Minus, Plus, Copy, Trash2, Star, ChevronRight,
} from "lucide-react";

// ─── Helpers ────────────────────────────────────────────────────────────
function Label({ children }: { children: React.ReactNode }) {
  return <span className="text-[9px] uppercase tracking-widest font-bold text-slate-400 block mb-2">{children}</span>;
}
function Section({ children }: { children: React.ReactNode }) {
  return <div className="px-4 py-3 border-b border-slate-100">{children}</div>;
}
function Row({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`flex gap-2 items-center ${className}`}>{children}</div>;
}
function Btn({ children, onClick, active, disabled, variant = "default", className = "" }: {
  children: React.ReactNode; onClick?: () => void; active?: boolean;
  disabled?: boolean; variant?: "default" | "primary" | "danger" | "ghost";
  className?: string;
}) {
  const base = "inline-flex items-center justify-center gap-1.5 rounded-lg text-[11px] font-semibold transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed";
  const variants = {
    default: active ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200",
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    danger: "bg-rose-500 text-white hover:bg-rose-600",
    ghost: "text-slate-600 hover:bg-slate-100",
  };
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]} px-3 py-1.5 ${className}`}>
      {children}
    </button>
  );
}
function SliderRow({ label, value, min, max, step = 1, onChange, onMouseUp }: {
  label: string; value: number; min: number; max: number; step?: number;
  onChange: (v: number) => void; onMouseUp: () => void;
}) {
  return (
    <div>
      <label className="text-[10px] text-slate-500 font-bold mb-1 flex justify-between">
        <span>{label}</span>
        <span className="text-slate-400 font-semibold">{Math.round(value)}</span>
      </label>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        onMouseUp={onMouseUp}
        className="w-full accent-blue-600 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
    </div>
  );
}
function NumInput({ value, onChange, label, min, max }: {
  value: number; onChange: (v: number) => void; label?: string; min?: number; max?: number;
}) {
  return (
    <div className="flex-1">
      {label && <div className="text-[9px] text-slate-400 font-semibold mb-1">{label}</div>}
      <input
        type="number" min={min} max={max} value={Math.round(value)}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full text-[11px] font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
    </div>
  );
}

// ─── Export Modal ────────────────────────────────────────────────────────
function ExportModal({ canvas, onClose, projectName, batchImages, canvasConfig }: {
  canvas: fabric.Canvas;
  onClose: () => void;
  projectName: string;
  batchImages: string[];
  canvasConfig: any;
}) {
  const [format, setFormat] = useState<"png" | "jpg" | "webp">("png");
  const [transparent, setTransparent] = useState(false);
  const [sizePreset, setSizePreset] = useState<"original" | "2k" | "4k" | "compress" | "custom">("original");
  const [customW, setCustomW] = useState<number | "">("");
  const [batchExporting, setBatchExporting] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);

  // Map size preset to export multiplier based on canvasConfig.width
  const getMultiplier = () => {
    const canvasNaturalW = canvasConfig.width;
    switch (sizePreset) {
      case "original":  return 1;
      case "compress":  return 0.75;
      case "2k":        return 2048 / canvasNaturalW;
      case "4k":        return 3840 / canvasNaturalW;
      case "custom":    return customW ? Number(customW) / canvasNaturalW : 1;
      default:          return 1;
    }
  };

  const exportCanvas = (cv: fabric.Canvas | null, fname: string): string | null => {
    if (!cv) return null;
    cv.discardActiveObject();
    cv.renderAll();
    const origBg = cv.backgroundColor;
    if (transparent && format === "png") { cv.backgroundColor = ""; cv.renderAll(); }
    const q = 0.95; // high quality default
    const mult = getMultiplier();
    const dataUrl = cv.toDataURL({ format: format === "webp" ? "jpeg" : format, quality: q, multiplier: mult });
    if (transparent && format === "png") { cv.backgroundColor = origBg; cv.renderAll(); }
    return dataUrl;
  };

  const handleSingleExport = () => {
    const dataUrl = exportCanvas(canvas, projectName);
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `${projectName || "design"}.${format}`;
    a.click();
    onClose();
  };

  // Export all batch images packed in a single ZIP file
  const handleBatchExport = async () => {
    if (!batchImages.length) return;
    setBatchExporting(true);
    setBatchProgress(0);

    const zip = new JSZip();

    for (let i = 0; i < batchImages.length; i++) {
      await new Promise<void>((resolve) => {
        // Create temp offscreen canvas element
        const el = document.createElement("canvas");
        el.width  = canvasConfig.width;
        el.height = canvasConfig.height;
        const tmpFab = new fabric.Canvas(el, {
          width: canvasConfig.width,
          height: canvasConfig.height,
          backgroundColor: transparent ? "" : (canvas.backgroundColor as string),
        });

        const imgEl = new window.Image();
        imgEl.src = batchImages[i];
        imgEl.onload = () => {
          const img = new fabric.Image(imgEl);
          const cW = canvasConfig.width;
          const cH = canvasConfig.height;
          const scale = Math.min(cW / (img.width || 1), cH / (img.height || 1));
          img.set({ scaleX: scale, scaleY: scale, originX: "center", originY: "center", left: cW / 2, top: cH / 2 });
          tmpFab.add(img);
          tmpFab.renderAll();

          const mult = getMultiplier();
          const q = 0.95; // high quality
          const dataUrl = tmpFab.toDataURL({ format: format === "webp" ? "jpeg" : format, quality: q, multiplier: mult });

          // Extract base64
          const base64Data = dataUrl.split(",")[1];
          zip.file(`${projectName || "design"}_${i + 1}.${format}`, base64Data, { base64: true });

          tmpFab.dispose();
          setBatchProgress(i + 1);
          resolve();
        };
        imgEl.onerror = () => resolve();
      });
      // small delay to let UI thread breathe
      await new Promise(r => setTimeout(r, 50));
    }

    try {
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${projectName || "batch_export"}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error generating zip:", err);
    }

    setBatchExporting(false);
    onClose();
  };

  const SIZE_PRESETS = [
    { id: "original", label: "Original",    sub: "1x (canvas size)"   },
    { id: "2k",       label: "2K",           sub: "2048 px wide"       },
    { id: "4k",       label: "4K",           sub: "3840 px wide"       },
    { id: "compress", label: "Compress",     sub: "75% size · smaller" },
    { id: "custom",   label: "Custom",       sub: "Set width below"    },
  ] as const;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-[340px] shadow-2xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <span className="text-sm font-bold text-slate-800">Export Design</span>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Format */}
          <div>
            <Label>Format</Label>
            <div className="flex gap-2">
              {(["png","jpg","webp"] as const).map(f => (
                <button key={f} onClick={() => setFormat(f)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${format === f ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>
                  {f.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Transparent (PNG only) */}
          {format === "png" && (
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={transparent} onChange={e => setTransparent(e.target.checked)} className="rounded" />
              <span className="text-xs font-semibold text-slate-700">Transparent background</span>
            </label>
          )}

          {/* Size / Resolution */}
          <div>
            <Label>Size &amp; Resolution</Label>
            <div className="grid grid-cols-2 gap-1.5">
              {SIZE_PRESETS.map(p => (
                <button key={p.id} onClick={() => setSizePreset(p.id)}
                  className={`px-3 py-2.5 rounded-xl text-left transition ${
                    sizePreset === p.id
                      ? "bg-blue-600 text-white ring-2 ring-blue-500 ring-offset-1"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}>
                  <div className="text-[11px] font-bold leading-none">{p.label}</div>
                  <div className={`text-[9px] mt-0.5 ${sizePreset === p.id ? "text-blue-100" : "text-slate-400"}`}>{p.sub}</div>
                </button>
              ))}
            </div>

            {sizePreset === "custom" && (
              <div className="mt-2">
                <div className="text-[9px] text-slate-400 font-semibold mb-1">Custom Width (px)</div>
                <input type="number" placeholder="e.g. 1200" value={customW}
                  onChange={e => setCustomW(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-slate-100" />

          {/* Export current canvas */}
          <button onClick={handleSingleExport}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition flex items-center justify-center gap-2 active:scale-[0.98]">
            <Download className="w-4 h-4" /> Export This Design
          </button>

          {/* Batch Export */}
          {batchImages.length > 1 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-slate-100" />
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">or batch</span>
                <div className="flex-1 h-px bg-slate-100" />
              </div>

              <button onClick={handleBatchExport} disabled={batchExporting}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-400 text-white text-sm font-bold rounded-xl transition flex items-center justify-center gap-2 active:scale-[0.98]">
                {batchExporting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Packaging ZIP {batchProgress}/{batchImages.length}...</>
                ) : (
                  <><Download className="w-4 h-4" /> Export All {batchImages.length} Images (.ZIP)</>
                )}
              </button>

              <p className="text-[9px] text-slate-400 text-center">
                All batch images will download packed into a single zip file.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────
export function PropertiesPanel() {
  const {
    canvas, activeObject, canvasConfig, setCanvasConfig,
    saveHistoryState, zoom, batchImages, setBatchImages,
    projectName, activeTool, setActiveTool,
    activeBatchIdx, setActiveBatchIdx,
  } = useWorkspace();

  const [exportOpen, setExportOpen] = useState(false);
  const [sidebarSubTab, setSidebarSubTab] = useState<"object" | "canvas">("object");

  useEffect(() => {
    if (activeObject) {
      setSidebarSubTab("object");
    }
  }, [activeObject]);

  // ── fabric helpers ──
  const isImage = activeObject instanceof fabric.Image;
  const isText = activeObject instanceof fabric.IText || activeObject instanceof fabric.Text;

  const apply = useCallback((key: string, value: any) => {
    if (!activeObject || !canvas) return;
    (activeObject as any).set(key, value);
    canvas.renderAll();
  }, [activeObject, canvas]);

  const applyAndSave = useCallback((key: string, value: any) => {
    apply(key, value); saveHistoryState();
  }, [apply, saveHistoryState]);

  // ════════════════════════════════════════════════════════════════════
  // PANEL: UPLOAD
  // ════════════════════════════════════════════════════════════════════
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadFiles = (files: FileList | null) => {
    if (!files || !canvas) return;
    const arr = Array.from(files);

    Promise.all(arr.map(f => new Promise<string>(res => {
      const r = new FileReader();
      r.onload = e => res(e.target?.result as string);
      r.readAsDataURL(f);
    }))).then(urls => {
      setBatchImages(prev => {
        const next = [...prev, ...urls];
        const newIdx = prev.length; // index of first newly uploaded image
        setActiveBatchIdx(newIdx);
        return next;
      });
    });
  };

  const [isDragging, setIsDragging] = useState(false);

  const UploadPanel = () => (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Drop zone */}
      <div className="px-4 pt-4 pb-3">
        <label
          className={`flex flex-col items-center gap-2 border-2 border-dashed rounded-xl p-6 cursor-pointer transition ${
            isDragging ? "border-blue-400 bg-blue-50/40" : "border-slate-200 hover:border-blue-300 hover:bg-slate-50/60"
          }`}
          onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={e => { e.preventDefault(); setIsDragging(false); handleUploadFiles(e.dataTransfer.files); }}
        >
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
            <Upload className="w-5 h-5 text-slate-400" />
          </div>
          <div className="text-center">
            <div className="text-xs font-bold text-slate-600">Drop images here</div>
            <div className="text-[10px] text-slate-400 mt-0.5">or click to browse files</div>
            <div className="text-[9px] text-slate-300 mt-1">PNG, JPG, WEBP</div>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
            onChange={e => handleUploadFiles(e.target.files)} />
        </label>
      </div>

      {/* Batch images info */}
      {batchImages.length > 0 && (
        <div className="px-4 pb-4">
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2.5">
            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
              <ImageIcon className="w-3 h-3 text-blue-500" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-blue-700">{batchImages.length} images in batch</div>
              <div className="text-[9px] text-blue-500 mt-0.5">Switch between them using the strip at the bottom of the canvas</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ════════════════════════════════════════════════════════════════════
  // PANEL: REMOVE BACKGROUND
  // ════════════════════════════════════════════════════════════════════
  const [bgRemoving, setBgRemoving] = useState(false);
  const [bgError, setBgError] = useState<string | null>(null);
  const [showBeforeAfter, setShowBeforeAfter] = useState(false);
  const [batchBgRemoving, setBatchBgRemoving] = useState(false);
  const [batchBgProgress, setBatchBgProgress] = useState(0);
  const [batchBgDone, setBatchBgDone] = useState(0);

  const handleRemoveBg = async () => {
    if (!canvas || !isImage || !activeObject) return;
    setBgRemoving(true); setBgError(null);
    try {
      const el = (activeObject as any).getElement() as HTMLImageElement;
      const src = el.src;
      const originalSrc = (activeObject as any)._originalSrc || src;

      // Convert canvas image to base64 PNG
      const tmpCanvas = document.createElement("canvas");
      tmpCanvas.width  = el.naturalWidth  || el.width  || 512;
      tmpCanvas.height = el.naturalHeight || el.height || 512;
      const ctx = tmpCanvas.getContext("2d");
      ctx?.drawImage(el, 0, 0, tmpCanvas.width, tmpCanvas.height);
      const base64 = tmpCanvas.toDataURL("image/png");

      const res = await fetch("/api/remove-bg", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_url: base64 }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const removedUrl: string = data.image_url;

      // Use native Image element — avoids Fabric's crossOrigin issue with large data URLs
      const imgEl = new window.Image();
      imgEl.onload = () => {
        if (!canvas || (canvas as any).disposed) return;
        const img = new fabric.Image(imgEl as any);
        const scaleX = (activeObject as fabric.Image).scaleX;
        const scaleY = (activeObject as fabric.Image).scaleY;
        const left   = activeObject.left;
        const top    = activeObject.top;
        img.set({ scaleX, scaleY, left, top, originX: "center", originY: "center" });
        (img as any)._originalSrc = originalSrc;
        (img as any)._removedSrc  = removedUrl;
        canvas.remove(activeObject);
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
        saveHistoryState();
      };
      imgEl.onerror = () => setBgError("Failed to load result image");
      imgEl.src = removedUrl;
    } catch (e: any) {
      setBgError(e.message || "Background removal failed");
    } finally {
      setBgRemoving(false);
    }
  };

  const handleRestoreOriginal = () => {
    if (!canvas || !activeObject) return;
    const origSrc = (activeObject as any)._originalSrc;
    if (!origSrc) return;
    const imgEl = new window.Image();
    imgEl.onload = () => {
      if (!canvas || (canvas as any).disposed) return;
      const img = new fabric.Image(imgEl as any);
      img.set({
        scaleX:  (activeObject as any).scaleX,
        scaleY:  (activeObject as any).scaleY,
        left:    activeObject.left,
        top:     activeObject.top,
        originX: "center",
        originY: "center",
      });
      canvas.remove(activeObject);
      canvas.add(img);
      canvas.setActiveObject(img);
      canvas.renderAll();
      saveHistoryState();
    };
    imgEl.src = origSrc;
  };

  // Batch background removal — processes all batchImages in sequence
  const handleBatchRemoveBg = async () => {
    if (!batchImages.length) return;
    setBatchBgRemoving(true);
    setBatchBgProgress(batchImages.length);
    setBatchBgDone(0);
    setBgError(null);

    const updatedImages = [...batchImages];
    let failCount = 0;

    for (let i = 0; i < batchImages.length; i++) {
      try {
        const src = batchImages[i];
        const res = await fetch("/api/remove-bg", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image_url: src }),
        });
        if (!res.ok) throw new Error(`Image ${i + 1}: ${res.statusText}`);
        const data = await res.json();
        updatedImages[i] = data.image_url;
      } catch {
        failCount++;
      }
      setBatchBgDone(i + 1);
    }

    setBatchImages(updatedImages);
    setBatchBgRemoving(false);
    if (failCount > 0) setBgError(`${failCount} image(s) failed to process.`);
  };

  const RemoveBgPanel = () => (
    <div className="px-4 py-4 space-y-3">
      {!isImage && batchImages.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
            <ImageIcon className="w-6 h-6 text-slate-300" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-500">No image selected</div>
            <div className="text-[10px] text-slate-400 mt-1">Select an image on the canvas, or upload batch images</div>
          </div>
        </div>
      ) : (
        <>
          {/* Single image controls */}
          {isImage && (
            <>
              <button onClick={handleRemoveBg} disabled={bgRemoving}
                className="w-full py-2.5 bg-rose-500 hover:bg-rose-600 disabled:bg-rose-400 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2">
                {bgRemoving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Removing...</> : <>Remove Background</>}
              </button>

              {(activeObject as any)?._originalSrc && (
                <div className="flex gap-2">
                  <button onClick={handleRestoreOriginal}
                    className="flex-1 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition flex items-center justify-center gap-1.5">
                    <RotateCcw className="w-3 h-3" /> Restore
                  </button>
                  <button onClick={() => setShowBeforeAfter(p => !p)}
                    className={`flex-1 py-2 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5 ${showBeforeAfter ? "bg-blue-600 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-700"}`}>
                    {showBeforeAfter ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    Before/After
                  </button>
                </div>
              )}
            </>
          )}

          {/* Batch BG removal */}
          {batchImages.length > 1 && (
            <div className="space-y-2">
              {isImage && <div className="border-t border-slate-100 pt-2" />}
              <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">Batch Removal</div>
              <button
                onClick={handleBatchRemoveBg}
                disabled={batchBgRemoving}
                className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2">
                {batchBgRemoving ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing {batchBgDone}/{batchBgProgress}...</>
                ) : (
                  <>Remove BG from All {batchImages.length} Images</>
                )}
              </button>

              {batchBgRemoving && (
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div
                    className="bg-violet-500 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${(batchBgDone / batchBgProgress) * 100}%` }}
                  />
                </div>
              )}

              <p className="text-[9px] text-slate-400">
                All batch images will have their backgrounds removed. Thumbnails update automatically.
              </p>
            </div>
          )}

          {bgError && (
            <div className="text-[10px] text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-2.5">
              ⚠ {bgError}
            </div>
          )}
        </>
      )}
    </div>
  );

  // ════════════════════════════════════════════════════════════════════
  // PANEL: CROP & TRANSFORM
  // ════════════════════════════════════════════════════════════════════
  const [cropRatio, setCropRatio] = useState("free");
  const CROP_RATIOS = ["free", "1:1", "4:3", "16:9", "3:4", "9:16"];
  const cropRectRef = useRef<fabric.Rect | null>(null);
  const croppingImageRef = useRef<fabric.Image | null>(null);

  const rotate90 = () => {
    if (!activeObject || !canvas) return;
    const angle = ((activeObject.angle || 0) + 90) % 360;
    activeObject.set("angle", angle); canvas.renderAll(); saveHistoryState();
  };
  const flipH = () => { if (!activeObject || !canvas) return; activeObject.set("flipX", !activeObject.flipX); canvas.renderAll(); saveHistoryState(); };
  const flipV = () => { if (!activeObject || !canvas) return; activeObject.set("flipY", !activeObject.flipY); canvas.renderAll(); saveHistoryState(); };

  // Helper to fit inside image
  const applyAspectToCropBox = useCallback((cropBox: fabric.Rect, ratio: string, imgW: number, imgH: number) => {
    cropBox.set({
      lockUniScaling: ratio !== "free",
    });
    if (ratio === "free") return;

    let r = 1;
    if (ratio === "1:1") r = 1;
    else if (ratio === "4:3") r = 4 / 3;
    else if (ratio === "16:9") r = 16 / 9;
    else if (ratio === "3:4") r = 3 / 4;
    else if (ratio === "9:16") r = 9 / 16;

    let w = imgW;
    let h = imgW / r;
    if (h > imgH) {
      h = imgH;
      w = imgH * r;
    }

    cropBox.set({
      width: w,
      height: h,
      scaleX: 1,
      scaleY: 1
    });
  }, []);

  const initCropMode = useCallback((img: fabric.Object) => {
    if (!canvas || !(img instanceof fabric.Image)) return;
    croppingImageRef.current = img;
    
    // Remove existing crop rect if any
    if (cropRectRef.current) {
      canvas.remove(cropRectRef.current);
      cropRectRef.current = null;
    }

    const imgW = (img.width || 100) * (img.scaleX || 1);
    const imgH = (img.height || 100) * (img.scaleY || 1);

    const cropBox = new fabric.Rect({
      left: img.left,
      top: img.top,
      width: imgW,
      height: imgH,
      originX: "center",
      originY: "center",
      fill: "rgba(37, 99, 235, 0.15)",
      stroke: "#2563eb",
      strokeWidth: 2,
      strokeDashArray: [6, 4],
      cornerColor: "#2563eb",
      cornerStrokeColor: "#ffffff",
      cornerSize: 8,
      cornerStyle: "rect",
      transparentCorners: false,
      hasRotatingPoint: false,
      lockScalingFlip: true,
    });

    // Hide rotation handle control
    cropBox.setControlsVisibility({
      mtr: false,
    });

    applyAspectToCropBox(cropBox, cropRatio, imgW, imgH);

    canvas.add(cropBox);
    canvas.setActiveObject(cropBox);
    cropRectRef.current = cropBox;
    canvas.renderAll();
  }, [canvas, cropRatio, applyAspectToCropBox]);

  const applyCrop = useCallback(() => {
    if (!canvas || !croppingImageRef.current || !cropRectRef.current) return;
    const img = croppingImageRef.current;
    const cropBox = cropRectRef.current;

    // Get current image bounds
    const imgW = (img.width || 1) * (img.scaleX || 1);
    const imgH = (img.height || 1) * (img.scaleY || 1);
    const imgLeft = img.left! - imgW / 2;
    const imgTop = img.top! - imgH / 2;

    // Get crop box bounds and clamp them to image bounds
    let boxW = cropBox.width! * cropBox.scaleX!;
    let boxH = cropBox.height! * cropBox.scaleY!;
    let boxLeft = cropBox.left! - boxW / 2;
    let boxTop = cropBox.top! - boxH / 2;

    if (boxLeft < imgLeft) {
      const diff = imgLeft - boxLeft;
      boxLeft = imgLeft;
      boxW -= diff;
    }
    if (boxTop < imgTop) {
      const diff = imgTop - boxTop;
      boxTop = imgTop;
      boxH -= diff;
    }
    if (boxLeft + boxW > imgLeft + imgW) {
      boxW = imgLeft + imgW - boxLeft;
    }
    if (boxTop + boxH > imgTop + imgH) {
      boxH = imgTop + imgH - boxTop;
    }

    // Safeguard dimensions
    boxW = Math.max(10, boxW);
    boxH = Math.max(10, boxH);

    // Calculate offset in original image pixels
    const dx = boxLeft - imgLeft;
    const dy = boxTop - imgTop;

    const localCropX = (img.cropX || 0) + dx / img.scaleX!;
    const localCropY = (img.cropY || 0) + dy / img.scaleY!;
    const localWidth = boxW / img.scaleX!;
    const localHeight = boxH / img.scaleY!;

    // Apply values to the image
    img.set({
      cropX: localCropX,
      cropY: localCropY,
      width: localWidth,
      height: localHeight,
      left: boxLeft + boxW / 2,
      top: boxTop + boxH / 2
    });
    img.setCoords();

    // Clean up crop rect
    canvas.remove(cropBox);
    cropRectRef.current = null;
    croppingImageRef.current = null;
    canvas.setActiveObject(img);
    canvas.renderAll();
    saveHistoryState();
    setActiveTool(null);
  }, [canvas, saveHistoryState, setActiveTool]);

  const cancelCrop = useCallback(() => {
    if (!canvas) return;
    if (cropRectRef.current) {
      canvas.remove(cropRectRef.current);
      cropRectRef.current = null;
    }
    if (croppingImageRef.current) {
      canvas.setActiveObject(croppingImageRef.current);
      croppingImageRef.current = null;
    }
    canvas.renderAll();
    setActiveTool(null);
  }, [canvas, setActiveTool]);

  useEffect(() => {
    if (activeTool === "crop" && activeObject && activeObject instanceof fabric.Image) {
      initCropMode(activeObject);
    } else {
      if (activeTool !== "crop" && canvas && cropRectRef.current) {
        canvas.remove(cropRectRef.current);
        cropRectRef.current = null;
        croppingImageRef.current = null;
        canvas.renderAll();
      }
    }
  }, [activeTool, activeObject, canvas, initCropMode]);

  // Update cropBox dimensions in real-time when the cropRatio changes in the sidebar panel
  useEffect(() => {
    if (activeTool === "crop" && croppingImageRef.current && cropRectRef.current) {
      const img = croppingImageRef.current;
      const cropBox = cropRectRef.current;
      const imgW = (img.width || 100) * (img.scaleX || 1);
      const imgH = (img.height || 100) * (img.scaleY || 1);
      applyAspectToCropBox(cropBox, cropRatio, imgW, imgH);
      canvas?.renderAll();
    }
  }, [cropRatio, activeTool, canvas, applyAspectToCropBox]);

  const CropPanel = () => (
    <div className="px-4 py-4 space-y-4">
      {!activeObject ? (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
            <ImageIcon className="w-6 h-6 text-slate-300" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-500">No image selected</div>
            <div className="text-[10px] text-slate-400 mt-1">Select an image on the canvas first</div>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <Label>Transform</Label>
            <button onClick={rotate90} className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition">
              <RotateCcw className="w-4 h-4" /> Rotate 90°
            </button>
            <div className="flex gap-2">
              <button onClick={flipH} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition">
                <FlipHorizontal className="w-4 h-4" /> Flip Horizontal
              </button>
              <button onClick={flipV} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition">
                <FlipVertical className="w-4 h-4" /> Flip Vertical
              </button>
            </div>
          </div>
          <div>
            <Label>Crop Ratio</Label>
            <div className="grid grid-cols-3 gap-1.5">
              {CROP_RATIOS.map(r => (
                <button
                  key={r}
                  onClick={() => setCropRatio(r)}
                  className={`py-1.5 text-[10px] font-bold rounded-lg transition ${cropRatio === r ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                >
                  {r === "free" ? "Free" : r}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex gap-2 pt-2 border-t border-slate-100">
            <button
              onClick={applyCrop}
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 active:scale-[0.98]"
            >
              Apply Crop
            </button>
            <button
              onClick={cancelCrop}
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 active:scale-[0.98]"
            >
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  );

  // ════════════════════════════════════════════════════════════════════
  // PANEL: TEXT
  // ════════════════════════════════════════════════════════════════════
  const addText = (type: "heading" | "subheading" | "body") => {
    if (!canvas) return;
    const cfg = {
      heading:    { text: "Add Heading", fontSize: 120, fontWeight: "bold",   fill: "#1e293b" },
      subheading: { text: "Add Subheading", fontSize: 72, fontWeight: "bold",   fill: "#334155" },
      body:       { text: "Add body text here", fontSize: 40, fontWeight: "normal", fill: "#64748b" },
    }[type];
    const t = new fabric.IText(cfg.text, {
      left: canvasConfig.width / 2, top: canvasConfig.height / 2,
      originX: "center", originY: "center",
      fontFamily: "Inter, sans-serif",
      fill: cfg.fill, fontSize: cfg.fontSize, fontWeight: cfg.fontWeight,
    });
    canvas.add(t); canvas.setActiveObject(t); canvas.renderAll();
    setActiveTool(null);
  };

  const TextPanel = () => (
    <div className="px-4 py-4 space-y-2.5">
      <p className="text-[10px] text-slate-400 mb-3">Click a style to add it to the canvas</p>
      {[
        { id: "heading", preview: <span className="text-2xl font-black text-slate-800">Heading</span>, sub: "Large bold text" },
        { id: "subheading", preview: <span className="text-lg font-bold text-slate-700">Subheading</span>, sub: "Medium bold text" },
        { id: "body", preview: <span className="text-sm text-slate-500">Body text</span>, sub: "Regular paragraph" },
      ].map(({ id, preview, sub }) => (
        <button key={id} onClick={() => addText(id as any)}
          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-left hover:bg-blue-50 hover:border-blue-300 transition group active:scale-[0.98]">
          {preview}
          <div className="text-[9px] text-slate-400 mt-1 group-hover:text-blue-400 transition">{sub}</div>
        </button>
      ))}
    </div>
  );

  // ════════════════════════════════════════════════════════════════════
  // PANEL: ASSETS LIBRARY
  // ════════════════════════════════════════════════════════════════════
  const [activeCategory, setActiveCategory] = useState<string>("colors");
  const [assetsQuery, setAssetsQuery] = useState<string>("");
  const [assetTrigger, setAssetTrigger] = useState(0);

  const SOLID_COLORS = [
    { label: "White", value: "#ffffff" },
    { label: "Slate", value: "#f1f5f9" },
    { label: "Dark Blue", value: "#0f172a" },
    { label: "Red", value: "#ef4444" },
    { label: "Blue", value: "#3b82f6" },
    { label: "Emerald", value: "#10b981" },
    { label: "Amber", value: "#f59e0b" },
    { label: "Purple", value: "#8b5cf6" },
    { label: "Pink", value: "#ec4899" },
    { label: "Cyan", value: "#06b6d4" },
  ];

  const GRADIENT_PRESETS = [
    { label: "Sky Blue", color1: "#3b82f6", color2: "#6366f1", type: "linear" as const },
    { label: "Sunset", color1: "#ec4899", color2: "#f43f5e", type: "linear" as const },
    { label: "Neon", color1: "#10b981", color2: "#06b6d4", type: "linear" as const },
    { label: "Peach", color1: "#f59e0b", color2: "#f97316", type: "linear" as const },
    { label: "Lavendar", color1: "#a855f7", color2: "#ec4899", type: "linear" as const },
    { label: "Forest", color1: "#15803d", color2: "#16a34a", type: "linear" as const },
  ];

  const WALLPAPER_PRESETS = [
    { label: "Marble", value: "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=600&q=80" },
    { label: "Geometric", value: "https://images.unsplash.com/photo-1508289650161-640078a48141?w=600&q=80" },
    { label: "Clean Desk", value: "https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?w=600&q=80" },
    { label: "Studio", value: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&q=80" },
    { label: "Wood", value: "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=600&q=80" },
    { label: "Dark Texture", value: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80" },
  ];

  const EMOJI_ICONS = [
    "✨", "💡", "💎", "🔑", "🔔", "✉️", "📞", "📍", "🔒", "📅", 
    "📊", "🛒", "🎯", "🏆", "🎁", "🚀", "💬", "📱", "💻", "⚙️", 
    "🛠️", "🔍", "📈", "🛍️", "💳", "👔"
  ];

  const EMOJI_STICKERS = [
    "🔥", "❤️", "🎉", "💥", "🌈", "🦄", "🍕", "🍦", "🍩", "🥑", 
    "🎨", "🎸", "✈️", "🎈", "🧸", "🐱", "🐶", "🍀", "🦁", "🐼", 
    "🦊", "🌮", "🍔", "🍿", "🎮", "🛹"
  ];

  const SHAPE_PRESETS = [
    { id: "rect", label: "Rectangle" },
    { id: "circle", label: "Circle" },
    { id: "triangle", label: "Triangle" },
    { id: "star", label: "Star" },
    { id: "line", label: "Line" },
  ];

  const BRAND_LOGOS = [
    { label: "Google", value: "https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" },
    { label: "Apple", value: "https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg" },
    { label: "Meta", value: "https://upload.wikimedia.org/wikipedia/commons/7/7b/Meta_Platforms_Inc._logo.svg" },
    { label: "Microsoft", value: "https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg" },
    { label: "Amazon", value: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg" },
    { label: "Netflix", value: "https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg" },
    { label: "Spotify", value: "https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg" },
    { label: "Slack", value: "https://upload.wikimedia.org/wikipedia/commons/d/d5/Slack_icon_2019.svg" },
  ];

  const getStarredList = () => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem("digiscale_favorites") || "[]");
    } catch {
      return [];
    }
  };

  const getRecentList = () => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem("digiscale_recently_used") || "[]");
    } catch {
      return [];
    }
  };

  const handleToggleStar = (e: React.MouseEvent, type: string, value: any, label: string) => {
    e.stopPropagation();
    try {
      const list = getStarredList();
      let updated;
      if (list.some((item: any) => item.type === type && item.value === value)) {
        updated = list.filter((item: any) => !(item.type === type && item.value === value));
      } else {
        updated = [{ type, value, label }, ...list];
      }
      localStorage.setItem("digiscale_favorites", JSON.stringify(updated));
      setAssetTrigger(c => c + 1);
    } catch (e) {
      console.warn("Could not toggle favorite:", e);
    }
  };

  const handleAddToRecent = (type: string, value: any, label: string) => {
    try {
      const list = getRecentList();
      const filtered = list.filter((item: any) => !(item.type === type && item.value === value));
      const updated = [{ type, value, label }, ...filtered].slice(0, 12);
      localStorage.setItem("digiscale_recently_used", JSON.stringify(updated));
      setAssetTrigger(c => c + 1);
    } catch (e) {
      console.warn("Could not save recent:", e);
    }
  };

  const handleAssetClick = (type: string, value: any, label: string) => {
    if (!canvas) return;

    if (type === "shape") {
      if (value === "rect") {
        const rect = new fabric.Rect({
          left: canvasConfig.width / 2, top: canvasConfig.height / 2,
          originX: "center", originY: "center",
          width: 250, height: 250, fill: "#3b82f6", rx: 10, ry: 10,
        });
        canvas.add(rect); canvas.setActiveObject(rect);
      } else if (value === "circle") {
        const circle = new fabric.Circle({
          left: canvasConfig.width / 2, top: canvasConfig.height / 2,
          originX: "center", originY: "center",
          radius: 125, fill: "#ef4444",
        });
        canvas.add(circle); canvas.setActiveObject(circle);
      } else if (value === "triangle") {
        const tri = new fabric.Triangle({
          left: canvasConfig.width / 2, top: canvasConfig.height / 2,
          originX: "center", originY: "center",
          width: 250, height: 250, fill: "#10b981",
        });
        canvas.add(tri); canvas.setActiveObject(tri);
      } else if (value === "star") {
        const star = new fabric.Path("M 125,5 L 155,90 L 245,90 L 175,145 L 200,230 L 125,180 L 50,230 L 75,145 L 5,90 L 95,90 Z", {
          left: canvasConfig.width / 2, top: canvasConfig.height / 2,
          originX: "center", originY: "center",
          fill: "#f59e0b", width: 250, height: 250,
        });
        canvas.add(star); canvas.setActiveObject(star);
      } else if (value === "line") {
        const line = new fabric.Line([50, 50, 250, 50], {
          left: canvasConfig.width / 2, top: canvasConfig.height / 2,
          originX: "center", originY: "center",
          stroke: "#64748b", strokeWidth: 6,
        });
        canvas.add(line); canvas.setActiveObject(line);
      }
      canvas.renderAll();
      saveHistoryState();
      handleAddToRecent(type, value, label);
    } 
    else if (type === "emoji") {
      const t = new fabric.IText(value, {
        left: canvasConfig.width / 2, top: canvasConfig.height / 2,
        originX: "center", originY: "center",
        fontSize: 120,
      });
      canvas.add(t); canvas.setActiveObject(t);
      canvas.renderAll();
      saveHistoryState();
      handleAddToRecent(type, value, label);
    }
    else if (type === "logo" || type === "upload") {
      fabric.Image.fromURL(value, (img) => {
        const maxW = canvasConfig.width * 0.5;
        const maxH = canvasConfig.height * 0.5;
        let scale = 1;
        if (img.width && img.width > maxW) scale = maxW / img.width;
        if (img.height && (img.height * scale) > maxH) scale = maxH / img.height;

        img.set({
          left: canvasConfig.width / 2, top: canvasConfig.height / 2,
          originX: "center", originY: "center",
          scaleX: scale, scaleY: scale,
          cornerColor: "#3b82f6", cornerSize: 10, transparentCorners: false
        });
        canvas.add(img); canvas.setActiveObject(img);
        canvas.renderAll();
        saveHistoryState();
        handleAddToRecent(type, value, label);
      }, { crossOrigin: "anonymous" });
    }
    else if (type === "color") {
      setCanvasConfig(c => ({ ...c, backgroundType: "color", backgroundColor: value }));
      handleAddToRecent(type, value, label);
    }
    else if (type === "gradient") {
      setCanvasConfig(c => ({
        ...c,
        backgroundType: "gradient",
        backgroundGradient: { color1: value.color1, color2: value.color2, type: value.type }
      }));
      handleAddToRecent(type, value, label);
    }
    else if (type === "bg_image") {
      setCanvasConfig(c => ({ ...c, backgroundType: "image", backgroundImage: value }));
      handleAddToRecent(type, value, label);
    }
  };

  const AssetsPanel = () => {
    const categories = [
      { id: "colors",      label: "Colors" },
      { id: "backgrounds", label: "Backgrounds" },
      { id: "icons",       label: "Icons" },
      { id: "stickers",    label: "Stickers" },
      { id: "shapes",      label: "Shapes" },
      { id: "logos",       label: "Logos" },
      { id: "recent",      label: "Recent" },
      { id: "starred",     label: "Starred" },
    ];

    const currentStarred = getStarredList();
    const currentRecent = getRecentList();

    const isAssetStarred = (type: string, val: any) => {
      const matchVal = typeof val === "object" ? JSON.stringify(val) : val;
      return currentStarred.some((item: any) => item.type === type && (typeof item.value === "object" ? JSON.stringify(item.value) : item.value) === matchVal);
    };

    return (
      <div className="flex flex-col h-full overflow-hidden">
        {/* Search Assets Bar */}
        <div className="p-3 border-b border-slate-100 shrink-0">
          <input
            type="text"
            placeholder="Search assets..."
            value={assetsQuery}
            onChange={e => setAssetsQuery(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 transition"
          />
        </div>

        {/* Categories 2-col Grid — all 8 visible, no scrolling */}
        <div className="grid grid-cols-2 gap-1.5 px-3 py-2.5 border-b border-slate-100 shrink-0 bg-slate-50/30">
          {categories.map(c => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.id)}
              className={`py-1.5 text-[9px] font-bold rounded-lg transition cursor-pointer ${
                activeCategory === c.id
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white border border-slate-200 text-slate-500 hover:text-slate-700 hover:border-blue-300"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Assets Contents Area */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">

          {/* COLORS CATEGORY */}
          {activeCategory === "colors" && (
            <div className="space-y-4">
              {/* Custom Color Picker */}
              <div className="space-y-2">
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Custom Color</div>
                <div className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl">
                  <input
                    type="color"
                    defaultValue="#3b82f6"
                    onChange={e => handleAssetClick("color", e.target.value, "Custom Color")}
                    className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer shrink-0"
                  />
                  <div>
                    <div className="text-[10px] font-bold text-slate-600">Pick Any Color</div>
                    <div className="text-[9px] text-slate-400">Click to apply as background</div>
                  </div>
                </div>
              </div>

              {/* Solid Color Swatches */}
              <div className="space-y-2">
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Solid Colors</div>
                <div className="grid grid-cols-5 gap-2">
                  {SOLID_COLORS.filter(c => c.label.toLowerCase().includes(assetsQuery.toLowerCase())).map(c => {
                    const starred = isAssetStarred("color", c.value);
                    return (
                      <div key={c.value} className="relative group aspect-square cursor-pointer rounded-xl border border-slate-200 shadow-sm"
                        style={{ backgroundColor: c.value }}
                        onClick={() => handleAssetClick("color", c.value, c.label)}>
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                          <span className="text-white text-[14px] font-black">✓</span>
                        </div>
                        <button
                          onClick={(e) => handleToggleStar(e, "color", c.value, c.label)}
                          className={`absolute top-0.5 left-0.5 p-0.5 bg-white/90 rounded text-amber-500 shadow ${starred ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                        >
                          <Star className={`w-2 h-2 ${starred ? "fill-amber-500" : ""}`} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* BACKGROUNDS CATEGORY */}
          {activeCategory === "backgrounds" && (
            <div className="space-y-4">
              {/* Gradients */}
              <div className="space-y-2">
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Gradients</div>
                <div className="grid grid-cols-3 gap-2">
                  {GRADIENT_PRESETS.filter(g => g.label.toLowerCase().includes(assetsQuery.toLowerCase())).map(g => {
                    const starred = isAssetStarred("gradient", g);
                    return (
                      <div key={g.label} className="relative group aspect-video cursor-pointer rounded-xl border border-slate-200 hover:border-blue-400 overflow-hidden shadow-sm transition"
                        style={{ background: `linear-gradient(to right, ${g.color1}, ${g.color2})` }}
                        onClick={() => handleAssetClick("gradient", g, g.label)}>
                        <button
                          onClick={(e) => handleToggleStar(e, "gradient", g, g.label)}
                          className={`absolute top-1 left-1 p-1 bg-white/90 rounded text-amber-500 shadow ${starred ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                        >
                          <Star className={`w-2 h-2 ${starred ? "fill-amber-500" : ""}`} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Custom BG Image Upload */}
              <div className="space-y-2">
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Upload Background Image</div>
                <label className="flex flex-col items-center justify-center gap-1.5 border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-xl p-4 cursor-pointer hover:bg-slate-50 transition text-[10px] text-slate-500 bg-white">
                  <Upload className="w-4 h-4 text-slate-400" />
                  <span className="font-bold text-slate-600">Upload Background</span>
                  <input type="file" accept="image/*" className="hidden" onChange={e => {
                    const file = e.target.files?.[0]; if (!file) return;
                    const reader = new FileReader();
                    reader.onload = ev => handleAssetClick("bg_image", ev.target?.result as string, "Custom BG");
                    reader.readAsDataURL(file);
                  }} />
                </label>
              </div>

              {/* Wallpapers */}
              <div className="space-y-2">
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Wallpapers / Textures</div>
                <div className="grid grid-cols-2 gap-2">
                  {WALLPAPER_PRESETS.filter(w => w.label.toLowerCase().includes(assetsQuery.toLowerCase())).map(w => {
                    const starred = isAssetStarred("bg_image", w.value);
                    return (
                      <div key={w.label} className="relative group aspect-video cursor-pointer rounded-xl border border-slate-200 hover:border-blue-400 overflow-hidden shadow-sm transition"
                        onClick={() => handleAssetClick("bg_image", w.value, w.label)}>
                        <img src={w.value} className="w-full h-full object-cover" alt={w.label} />
                        <button
                          onClick={(e) => handleToggleStar(e, "bg_image", w.value, w.label)}
                          className={`absolute top-1 left-1 p-1 bg-white/90 rounded text-amber-500 shadow ${starred ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                        >
                          <Star className={`w-2 h-2 ${starred ? "fill-amber-500" : ""}`} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ICONS CATEGORY */}
          {activeCategory === "icons" && (
            <div className="grid grid-cols-4 gap-2">
              {EMOJI_ICONS.filter(e => e.includes(assetsQuery)).map(emoji => {
                const starred = isAssetStarred("emoji", emoji);
                return (
                  <div key={emoji} 
                    onClick={() => handleAssetClick("emoji", emoji, "Icon")}
                    className="aspect-square bg-slate-50 border border-slate-100 hover:border-blue-400 rounded-xl transition relative group cursor-pointer flex items-center justify-center text-3xl"
                  >
                    <span>{emoji}</span>
                    <button
                      onClick={(e) => handleToggleStar(e, "emoji", emoji, "Icon")}
                      className={`absolute top-0.5 left-0.5 p-0.5 bg-white/90 rounded text-amber-500 shadow-sm ${starred ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                    >
                      <Star className={`w-2 h-2 ${starred ? "fill-amber-500" : ""}`} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* STICKERS CATEGORY */}
          {activeCategory === "stickers" && (
            <div className="grid grid-cols-4 gap-2">
              {EMOJI_STICKERS.filter(e => e.includes(assetsQuery)).map(emoji => {
                const starred = isAssetStarred("emoji", emoji);
                return (
                  <div key={emoji}
                    onClick={() => handleAssetClick("emoji", emoji, "Sticker")}
                    className="aspect-square bg-slate-50 border border-slate-100 hover:border-blue-400 rounded-xl transition relative group cursor-pointer flex items-center justify-center text-3xl"
                  >
                    <span>{emoji}</span>
                    <button
                      onClick={(e) => handleToggleStar(e, "emoji", emoji, "Sticker")}
                      className={`absolute top-0.5 left-0.5 p-0.5 bg-white/90 rounded text-amber-500 shadow-sm ${starred ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                    >
                      <Star className={`w-2 h-2 ${starred ? "fill-amber-500" : ""}`} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* SHAPES CATEGORY */}
          {activeCategory === "shapes" && (
            <div className="space-y-2">
              {SHAPE_PRESETS.filter(s => s.label.toLowerCase().includes(assetsQuery.toLowerCase())).map(s => {
                const starred = isAssetStarred("shape", s.id);
                return (
                  <div
                    key={s.id}
                    className="w-full p-3 bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/10 rounded-xl flex items-center justify-between text-left transition cursor-pointer group"
                  >
                    <span className="text-xs font-bold text-slate-700">{s.label}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleToggleStar(e, "shape", s.id, s.label)}
                        className={`p-1 bg-slate-50 hover:bg-white rounded border border-slate-200 text-amber-500 transition shadow-sm ${starred ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                      >
                        <Star className={`w-2.5 h-2.5 ${starred ? "fill-amber-500" : ""}`} />
                      </button>
                      <button
                        onClick={() => handleAssetClick("shape", s.id, s.label)}
                        className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[9px] font-black rounded-lg transition shadow-sm active:scale-95"
                      >+ Add</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* LOGOS CATEGORY */}
          {activeCategory === "logos" && (
            <div className="grid grid-cols-2 gap-2">
              {BRAND_LOGOS.filter(l => l.label.toLowerCase().includes(assetsQuery.toLowerCase())).map(l => {
                const starred = isAssetStarred("logo", l.value);
                return (
                  <div key={l.label} 
                    onClick={() => handleAssetClick("logo", l.value, l.label)}
                    className="relative group aspect-video border border-slate-200 hover:border-blue-400 rounded-xl bg-slate-50/50 p-3 transition flex items-center justify-center shadow-sm overflow-hidden cursor-pointer"
                  >
                    <img src={l.value} className="max-h-full max-w-full object-contain" alt={l.label} />
                    <button
                      onClick={(e) => handleToggleStar(e, "logo", l.value, l.label)}
                      className={`absolute top-1 left-1 p-0.5 bg-white/95 rounded text-amber-500 shadow-sm border border-slate-200/40 ${starred ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                    >
                      <Star className={`w-2.5 h-2.5 ${starred ? "fill-amber-500" : ""}`} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* RECENTLY USED CATEGORY */}
          {activeCategory === "recent" && (
            <div className="space-y-2">
              {currentRecent.map((item: any, i: number) => {
                const isEmoji = item.type === "emoji";
                const isColor = item.type === "color";
                const isGradient = item.type === "gradient";
                const isImage = item.type === "logo" || item.type === "upload" || item.type === "bg_image";
                return (
                  <div
                    key={i}
                    className="w-full p-2 bg-white border border-slate-200 hover:border-blue-400 rounded-xl flex items-center gap-3 transition"
                  >
                    {/* Visual Preview */}
                    {isEmoji && (
                      <div className="w-9 h-9 shrink-0 flex items-center justify-center text-2xl bg-slate-50 rounded-lg border border-slate-100">
                        {item.value}
                      </div>
                    )}
                    {isColor && (
                      <div className="w-9 h-9 shrink-0 rounded-lg border border-slate-200 shadow-sm" style={{ backgroundColor: item.value }} />
                    )}
                    {isGradient && (
                      <div className="w-12 h-9 shrink-0 rounded-lg border border-slate-200 shadow-sm" style={{ background: `linear-gradient(to right, ${item.value?.color1 || "#ccc"}, ${item.value?.color2 || "#fff"})` }} />
                    )}
                    {isImage && (
                      <div className="w-12 h-9 shrink-0 rounded-lg border border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center">
                        <img src={item.value} className="max-w-full max-h-full object-contain" alt="" />
                      </div>
                    )}
                    {!isEmoji && !isColor && !isGradient && !isImage && (
                      <div className="w-9 h-9 shrink-0 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center">
                        <span className="text-[9px] font-black text-slate-400 uppercase">{item.type.slice(0,3)}</span>
                      </div>
                    )}
                    {/* Label + Add */}
                    <span className="flex-1 text-xs font-bold text-slate-700 truncate">{item.label}</span>
                    <button
                      onClick={() => handleAssetClick(item.type, item.value, item.label)}
                      className="shrink-0 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[9px] font-black rounded-lg transition shadow-sm active:scale-95"
                    >+ Add</button>
                  </div>
                );
              })}

              {currentRecent.length === 0 && (
                <div className="py-8 text-center text-slate-400 text-xs font-semibold">No recently used items.</div>
              )}
            </div>
          )}

          {/* STARRED/FAVORITES CATEGORY */}
          {activeCategory === "starred" && (
            <div className="space-y-2">
              {currentStarred.map((item: any, i: number) => {
                const isEmoji = item.type === "emoji";
                const isColor = item.type === "color";
                const isGradient = item.type === "gradient";
                const isImage = item.type === "logo" || item.type === "upload" || item.type === "bg_image";
                return (
                  <div
                    key={i}
                    className="w-full p-2 bg-white border border-slate-200 hover:border-blue-400 rounded-xl flex items-center gap-3 transition group"
                  >
                    {/* Visual Preview */}
                    {isEmoji && (
                      <div className="w-9 h-9 shrink-0 flex items-center justify-center text-2xl bg-slate-50 rounded-lg border border-slate-100">
                        {item.value}
                      </div>
                    )}
                    {isColor && (
                      <div className="w-9 h-9 shrink-0 rounded-lg border border-slate-200 shadow-sm" style={{ backgroundColor: item.value }} />
                    )}
                    {isGradient && (
                      <div className="w-12 h-9 shrink-0 rounded-lg border border-slate-200 shadow-sm" style={{ background: `linear-gradient(to right, ${item.value?.color1 || "#ccc"}, ${item.value?.color2 || "#fff"})` }} />
                    )}
                    {isImage && (
                      <div className="w-12 h-9 shrink-0 rounded-lg border border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center">
                        <img src={item.value} className="max-w-full max-h-full object-contain" alt="" />
                      </div>
                    )}
                    {!isEmoji && !isColor && !isGradient && !isImage && (
                      <div className="w-9 h-9 shrink-0 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center">
                        <span className="text-[9px] font-black text-slate-400 uppercase">{item.type.slice(0,3)}</span>
                      </div>
                    )}
                    {/* Label */}
                    <span className="flex-1 text-xs font-bold text-slate-700 truncate">{item.label}</span>
                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={(e) => handleToggleStar(e, item.type, item.value, item.label)}
                        className="p-1 hover:bg-slate-100 rounded text-amber-500 transition"
                        title="Remove from favorites"
                      >
                        <Star className="w-3 h-3 fill-amber-500" />
                      </button>
                      <button
                        onClick={() => handleAssetClick(item.type, item.value, item.label)}
                        className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[9px] font-black rounded-lg transition shadow-sm active:scale-95"
                      >+ Add</button>
                    </div>
                  </div>
                );
              })}

              {currentStarred.length === 0 && (
                <div className="py-8 text-center text-slate-400 text-xs font-semibold">No favorite assets.</div>
              )}
            </div>
          )}

        </div>
      </div>
    );
  };

  // ════════════════════════════════════════════════════════════════════
  // CANVAS SETTINGS PANEL
  // ════════════════════════════════════════════════════════════════════
  const PRESETS = [
    { label: "1:1", w: 1080, h: 1080 },
    { label: "4:5", w: 1080, h: 1350 },
    { label: "16:9", w: 1920, h: 1080 },
    { label: "9:16", w: 1080, h: 1920 },
    { label: "3:4", w: 1080, h: 1440 },
  ];

  const CanvasPanel = () => (
    <div className="overflow-y-auto flex-1">
      {/* Preset Sizes */}
      <Section>
        <Label>Preset Sizes</Label>
        <div className="grid grid-cols-3 gap-1.5">
          {PRESETS.map(p => (
            <button key={p.label}
              onClick={() => setCanvasConfig(c => ({ ...c, width: p.w, height: p.h }))}
              className={`py-1.5 text-[10px] font-bold rounded-lg transition cursor-pointer ${canvasConfig.width === p.w && canvasConfig.height === p.h ? "bg-blue-600 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
              {p.label}
            </button>
          ))}
        </div>
      </Section>

      {/* Custom Size */}
      <Section>
        <Label>Custom Size</Label>
        <Row>
          <NumInput label="Width" value={canvasConfig.width} onChange={v => setCanvasConfig(c => ({ ...c, width: v }))} min={100} />
          <NumInput label="Height" value={canvasConfig.height} onChange={v => setCanvasConfig(c => ({ ...c, height: v }))} min={100} />
        </Row>
      </Section>

      {/* Background — managed from Assets */}
      <Section>
        <Label>Background</Label>
        <div className="flex flex-col items-center gap-3 py-2">
          <div className="w-10 h-10 rounded-xl border border-slate-200 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
            <ImageIcon className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-center">
            <div className="text-xs font-bold text-slate-600 mb-1">Managed via Assets Library</div>
            <div className="text-[10px] text-slate-400 leading-relaxed">Pick colors, gradients, wallpapers and background images from the Assets panel.</div>
          </div>
          <button
            onClick={() => setActiveTool("assets")}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-xl transition active:scale-[0.98] flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
          >
            <ImageIcon className="w-3.5 h-3.5" /> Open Assets Library
          </button>
        </div>
      </Section>
    </div>
  );

  // ════════════════════════════════════════════════════════════════════
  // OBJECT PROPERTIES PANEL
  // ════════════════════════════════════════════════════════════════════

  // Position/resize
  const [aspectLock, setAspectLock] = useState(true);

  const obj = activeObject as any;
  const objX = Math.round(obj?.left || 0);
  const objY = Math.round(obj?.top || 0);
  const objW = Math.round((obj?.width || 0) * (obj?.scaleX || 1));
  const objH = Math.round((obj?.height || 0) * (obj?.scaleY || 1));
  const objOpacity = Math.round((obj?.opacity ?? 1) * 100);

  const setPos = (axis: "left" | "top", val: number) => {
    if (!activeObject || !canvas) return;
    activeObject.set(axis, val); canvas.renderAll();
  };
  const setSize = (dim: "w" | "h", val: number) => {
    if (!activeObject || !canvas) return;
    const w = (activeObject as any).width || 1;
    const h = (activeObject as any).height || 1;
    if (dim === "w") {
      (activeObject as any).set("scaleX", val / w);
      if (aspectLock) (activeObject as any).set("scaleY", val / w);
    } else {
      (activeObject as any).set("scaleY", val / h);
      if (aspectLock) (activeObject as any).set("scaleX", val / h);
    }
    canvas.renderAll();
  };
  const centerH = () => { if (!canvas || !activeObject) return; activeObject.set("left", canvasConfig.width / 2); canvas.renderAll(); };
  const centerV = () => { if (!canvas || !activeObject) return; activeObject.set("top", canvasConfig.height / 2); canvas.renderAll(); };

  // ── Image filter states ────────────────────────────────────────────
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [saturation, setSaturation] = useState(0);
  const [blur, setBlur] = useState(0);
  const [sharpness, setSharpness] = useState(0);
  const [exposure, setExposure] = useState(0);
  const [temperature, setTemperature] = useState(0);
  const [tint, setTint] = useState(0);
  const [hue, setHue] = useState(0);
  const [vibrance, setVibrance] = useState(0);
  const [noise, setNoise] = useState(0);
  const temperatureRef = useRef(0);
  const tintRef = useRef(0);

  const pendingFilterUpdatesRef = useRef<Record<string, number>>({});
  const filterAnimationFrameRef = useRef<number | null>(null);
  const pendingTempTintRef = useRef<{ temp: number; tint: number } | null>(null);
  const tempTintFrameRef = useRef<number | null>(null);

  // Clean up animation frames on unmount
  useEffect(() => {
    return () => {
      if (filterAnimationFrameRef.current !== null) cancelAnimationFrame(filterAnimationFrameRef.current);
      if (tempTintFrameRef.current !== null) cancelAnimationFrame(tempTintFrameRef.current);
    };
  }, []);

  // ── New visual states ─────────────────────────────────────────────
  const [borderWidth, setBorderWidth] = useState(0);
  const [borderColor, setBorderColor] = useState("#000000");
  const [roundedCorners, setRoundedCorners] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [objAngle, setObjAngle] = useState(0);

  const applyImageFilter = useCallback((type: string, value: number) => {
    if (!canvas || !isImage || !activeObject) return;

    // Track latest value for this filter type
    pendingFilterUpdatesRef.current[type] = value;

    if (filterAnimationFrameRef.current === null) {
      filterAnimationFrameRef.current = requestAnimationFrame(() => {
        filterAnimationFrameRef.current = null;
        if (!canvas || (canvas as any).disposed || !(canvas as any).lowerCanvasEl || !activeObject) return;

        const img = activeObject as fabric.Image;
        const filters: fabric.IBaseFilter[] = [...(img.filters || [])];

        Object.entries(pendingFilterUpdatesRef.current).forEach(([t, val]) => {
          const i =
            t === "Vibrance"   ? filters.findIndex((f: any) => f.type === "Saturation" && !!(f as any)._vibrance) :
            t === "Saturation" ? filters.findIndex((f: any) => f.type === "Saturation" && !(f as any)._vibrance) :
            t === "Sharpness"  ? filters.findIndex((f: any) => f.type === "Convolute") :
            t === "Exposure"   ? filters.findIndex((f: any) => f.type === "Gamma") :
            filters.findIndex((f: any) => f.type === t);

          let newFilter: fabric.IBaseFilter | null = null;
          if      (t === "Brightness")  newFilter = new (fabric.Image.filters as any).Brightness({ brightness: val });
          else if (t === "Contrast")    newFilter = new (fabric.Image.filters as any).Contrast({ contrast: val });
          else if (t === "Saturation")  newFilter = new (fabric.Image.filters as any).Saturation({ saturation: val });
          else if (t === "Blur")        newFilter = new (fabric.Image.filters as any).Blur({ blur: val });
          else if (t === "HueRotation") newFilter = new (fabric.Image.filters as any).HueRotation({ rotation: val * Math.PI / 180 });
          else if (t === "Noise")       newFilter = new (fabric.Image.filters as any).Noise({ noise: Math.max(0, val) });
          else if (t === "Sharpness" && val > 0) {
            const a = Math.min(0.9, val / 100);
            newFilter = new (fabric.Image.filters as any).Convolute({ matrix: [0, -a, 0, -a, 1 + 4 * a, -a, 0, -a, 0] });
          }
          else if (t === "Exposure" && val !== 0) {
            const g = val > 0 ? Math.max(0.01, 1 / (1 + val / 60)) : Math.min(2.2, 1 - val / 60);
            newFilter = new (fabric.Image.filters as any).Gamma({ gamma: [g, g, g] });
          }
          else if (t === "Vibrance" && val !== 0) {
            const f = new (fabric.Image.filters as any).Saturation({ saturation: val * 0.8 });
            (f as any)._vibrance = true;
            newFilter = f;
          }

          if (newFilter) {
            if (i >= 0) filters[i] = newFilter; else filters.push(newFilter);
          } else if (i >= 0) { filters.splice(i, 1); }
        });

        // Clear updates
        pendingFilterUpdatesRef.current = {};

        img.filters = filters;
        img.applyFilters();
        canvas.renderAll();
      });
    }
  }, [canvas, isImage, activeObject]);

  // Temperature + Tint share a single ColorMatrix filter
  const applyTemperatureTint = useCallback((temp: number, t: number) => {
    if (!canvas || !isImage || !activeObject) return;

    pendingTempTintRef.current = { temp, tint: t };

    if (tempTintFrameRef.current === null) {
      tempTintFrameRef.current = requestAnimationFrame(() => {
        tempTintFrameRef.current = null;
        if (!canvas || (canvas as any).disposed || !(canvas as any).lowerCanvasEl || !activeObject || !pendingTempTintRef.current) return;

        const { temp: latestTemp, tint: latestTint } = pendingTempTintRef.current;
        pendingTempTintRef.current = null;

        const img = activeObject as fabric.Image;
        const filters: fabric.IBaseFilter[] = [...(img.filters || [])];
        const i = filters.findIndex((f: any) => f.type === "ColorMatrix");

        if (latestTemp === 0 && latestTint === 0) {
          if (i >= 0) filters.splice(i, 1);
        } else {
          const tv = latestTemp / 100, gv = latestTint / 100;
          const matrix = [
            1 + tv * 0.3, 0, 0, 0, 0,
            0, 1 + gv * 0.2, 0, 0, 0,
            0, 0, 1 - tv * 0.3, 0, 0,
            0, 0, 0, 1, 0,
          ];
          const nf = new (fabric.Image.filters as any).ColorMatrix({ matrix });
          if (i >= 0) filters[i] = nf; else filters.push(nf);
        }

        img.filters = filters;
        img.applyFilters();
        canvas.renderAll();
      });
    }
  }, [canvas, isImage, activeObject]);

  // Sync filter values when selected object changes
  useEffect(() => {
    if (!activeObject) {
      setIsLocked(false); setObjAngle(0); setBorderWidth(0); setBorderColor("#000000"); setRoundedCorners(0);
      return;
    }
    setIsLocked(!!(activeObject as any).lockMovementX);
    setObjAngle(Math.round(activeObject.angle || 0));
    setBorderWidth((activeObject.strokeWidth as number) || 0);
    setBorderColor((activeObject.stroke as string) || "#000000");

    if (!isImage) { setRoundedCorners(0); return; }
    const img = activeObject as fabric.Image;
    const getF = (type: string, vibr?: boolean) =>
      (img.filters || []).find((f: any) =>
        (type === "Sharpness" ? f.type === "Convolute" : type === "Exposure" ? f.type === "Gamma" : f.type === type) &&
        (vibr !== undefined ? !!(f as any)._vibrance === vibr : true)
      ) as any;
    setBrightness(getF("Brightness")?.brightness ?? 0);
    setContrast(getF("Contrast")?.contrast ?? 0);
    setSaturation(getF("Saturation", false)?.saturation ?? 0);
    setBlur(getF("Blur")?.blur ?? 0);
    setHue(getF("HueRotation") ? Math.round(getF("HueRotation").rotation * 180 / Math.PI) : 0);
    setNoise(getF("Noise")?.noise ?? 0);
    setSharpness(0); setExposure(0); setTemperature(0); setTint(0);
    temperatureRef.current = 0; tintRef.current = 0;
    const vibrF = getF("Saturation", true);
    setVibrance(vibrF ? Math.round(vibrF.saturation / 0.8 * 100) / 100 : 0);
    const cp = img.clipPath as fabric.Rect | undefined;
    if (cp?.rx && img.width && img.height) {
      setRoundedCorners(Math.round((cp.rx / (Math.min(img.width, img.height) / 2)) * 100));
    } else { setRoundedCorners(0); }
  }, [activeObject, isImage]);

  // Shadow
  const [shadowEnabled, setShadowEnabled] = useState(false);
  const [shadowBlur, setShadowBlur] = useState(20);
  const [shadowColor, setShadowColor] = useState("#00000080");
  const [shadowOx, setShadowOx] = useState(10);
  const [shadowOy, setShadowOy] = useState(10);

  const applyShadow = useCallback((blur: number, color: string, ox: number, oy: number, enabled: boolean) => {
    if (!activeObject || !canvas) return;
    if (!enabled) { activeObject.set("shadow", undefined); }
    else { activeObject.set("shadow", new fabric.Shadow({ color, blur, offsetX: ox, offsetY: oy })); }
    canvas.renderAll();
  }, [activeObject, canvas]);

  useEffect(() => {
    if (!activeObject) return;
    const s = (activeObject as any).shadow as fabric.Shadow | null;
    setShadowEnabled(!!s);
    if (s) { setShadowBlur(s.blur || 20); setShadowColor(s.color || "#00000080"); setShadowOx(s.offsetX || 10); setShadowOy(s.offsetY || 10); }
  }, [activeObject]);

  // ── Border ──────────────────────────────────────────────────────────
  const applyBorder = useCallback((w: number, color: string) => {
    if (!activeObject || !canvas) return;
    activeObject.set({ stroke: w > 0 ? color : undefined, strokeWidth: w, strokeUniform: true } as any);
    canvas.renderAll();
  }, [activeObject, canvas]);

  // ── Rounded Corners ─────────────────────────────────────────────────
  const applyRoundedCorners = useCallback((percent: number) => {
    if (!canvas || !isImage || !activeObject) return;
    const img = activeObject as fabric.Image;
    if (percent === 0) {
      img.clipPath = undefined;
    } else {
      const w = img.width!, h = img.height!;
      const radius = Math.min(w, h) / 2 * (percent / 100);
      img.clipPath = new fabric.Rect({
        originX: "center", originY: "center",
        left: 0, top: 0, width: w, height: h,
        rx: radius, ry: radius,
      });
    }
    canvas.renderAll();
  }, [canvas, isImage, activeObject]);

  // ── Lock / Duplicate / Reflection ───────────────────────────────────
  const toggleLock = useCallback(() => {
    if (!activeObject || !canvas) return;
    const locked = !isLocked;
    activeObject.set({
      selectable: !locked, evented: !locked,
      hasControls: !locked, hasBorders: !locked,
      lockMovementX: locked, lockMovementY: locked,
    } as any);
    setIsLocked(locked);
    canvas.renderAll();
    saveHistoryState();
  }, [activeObject, canvas, isLocked, saveHistoryState]);

  const duplicateObject = useCallback(() => {
    if (!activeObject || !canvas) return;
    activeObject.clone((cloned: fabric.Object) => {
      cloned.set({ left: (cloned.left || 0) + 20, top: (cloned.top || 0) + 20 });
      canvas.add(cloned);
      canvas.setActiveObject(cloned);
      canvas.renderAll();
      saveHistoryState();
    });
  }, [activeObject, canvas, saveHistoryState]);

  const addReflection = useCallback(() => {
    if (!activeObject || !canvas) return;
    activeObject.clone((cloned: fabric.Object) => {
      const obj = activeObject;
      const totalH = (obj.height || 0) * (obj.scaleY || 1);
      cloned.set({
        left: obj.left,
        top: (obj.top || 0) + totalH,
        originX: obj.originX || "center",
        originY: obj.originY || "center",
        scaleX: obj.scaleX, scaleY: obj.scaleY,
        flipY: !(obj.flipY || false),
        opacity: 0.3,
      } as any);
      canvas.add(cloned);
      canvas.renderAll();
      saveHistoryState();
    });
  }, [activeObject, canvas, saveHistoryState]);

  const ObjectPropertiesPanel = () => (
    <div className="overflow-y-auto flex-1">

      {/* ── TEXT: Show FIRST when text is selected ── */}
      {isText && (
        <Section>
          <Label>Text</Label>
          <div className="space-y-3">
            {/* Font Family */}
            <div>
              <div className="text-[9px] text-slate-400 font-semibold mb-1">Font Family</div>
              <select value={(obj?.fontFamily as string) || "Inter"}
                onChange={e => applyAndSave("fontFamily", e.target.value)}
                className="w-full text-[11px] border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                {["Inter","Arial","Georgia","Times New Roman","Courier New","Roboto","Playfair Display","Poppins","Montserrat","Raleway","Oswald","Lato"].map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>

            {/* Size + Bold/Italic/Underline */}
            <Row>
              <NumInput label="Font Size" value={obj?.fontSize || 24} onChange={v => applyAndSave("fontSize", v)} min={6} max={400} />
              <div className="flex gap-1 mt-4 shrink-0">
                {([
                  { key: "fontWeight", val: "bold",   icon: <Bold className="w-3 h-3" />,      check: (v: any) => v === "bold" },
                  { key: "fontStyle",  val: "italic",  icon: <Italic className="w-3 h-3" />,    check: (v: any) => v === "italic" },
                  { key: "underline",  val: true,      icon: <Underline className="w-3 h-3" />, check: (v: any) => v === true },
                ] as const).map(({ key, val, icon, check }) => (
                  <button key={key}
                    onClick={() => applyAndSave(key, check((obj as any)?.[key]) ? (key === "underline" ? false : "normal") : val)}
                    className={`p-1.5 rounded-lg border transition ${check((obj as any)?.[key]) ? "bg-blue-600 text-white border-blue-600" : "border-slate-200 text-slate-600 hover:bg-slate-100"}`}>
                    {icon}
                  </button>
                ))}
              </div>
            </Row>

            {/* Font Color */}
            <div>
              <div className="text-[9px] text-slate-400 font-semibold mb-1">Font Color</div>
              <Row>
                <input type="color" value={(obj?.fill as string) || "#000000"}
                  onChange={e => apply("fill", e.target.value)}
                  onBlur={saveHistoryState}
                  className="w-9 h-9 rounded-lg border border-slate-200 cursor-pointer shrink-0" />
                <span className="text-[11px] font-semibold text-slate-600">{(obj?.fill as string) || "#000000"}</span>
              </Row>
            </div>

            {/* Text Alignment */}
            <div>
              <div className="text-[9px] text-slate-400 font-semibold mb-1">Alignment</div>
              <div className="flex gap-1">
                {([
                  { v: "left",   icon: <AlignLeft className="w-3.5 h-3.5" /> },
                  { v: "center", icon: <AlignCenter className="w-3.5 h-3.5" /> },
                  { v: "right",  icon: <AlignRight className="w-3.5 h-3.5" /> },
                ] as const).map(({ v, icon }) => (
                  <button key={v} onClick={() => applyAndSave("textAlign", v)}
                    className={`flex-1 flex items-center justify-center py-1.5 rounded-lg border transition ${obj?.textAlign === v ? "bg-blue-600 text-white border-blue-600" : "border-slate-200 text-slate-500 hover:bg-slate-100"}`}>
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            {/* Letter Spacing + Line Height */}
            <SliderRow label="Letter Spacing" value={(obj?.charSpacing || 0) / 10} min={-5} max={50}
              onChange={v => apply("charSpacing", v * 10)} onMouseUp={saveHistoryState} />
            <SliderRow label="Line Height" value={(obj?.lineHeight || 1.2) * 10} min={8} max={30}
              onChange={v => apply("lineHeight", v / 10)} onMouseUp={saveHistoryState} />
          </div>
        </Section>
      )}

      {/* ── RESIZE & POSITION ── */}
      <Section>
        <Label>Resize & Position</Label>
        <div className="space-y-2">
          <Row>
            <NumInput label="X" value={objX} onChange={v => setPos("left", v)} />
            <NumInput label="Y" value={objY} onChange={v => setPos("top", v)} />
          </Row>
          <Row>
            <NumInput label="W" value={objW} onChange={v => setSize("w", v)} min={1} />
            <button onClick={() => setAspectLock(p => !p)}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition mt-4 shrink-0">
              {aspectLock ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
            </button>
            <NumInput label="H" value={objH} onChange={v => setSize("h", v)} min={1} />
          </Row>
          <Row>
            <button onClick={centerH}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 text-[10px] font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition">
              <AlignCenterHorizontal className="w-3 h-3" /> H Center
            </button>
            <button onClick={centerV}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 text-[10px] font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition">
              <AlignCenterVertical className="w-3 h-3" /> V Center
            </button>
          </Row>
        </div>
      </Section>

      {/* ── IMAGE ADJUSTMENTS ── */}
      {isImage && (
        <Section>
          <Label>Adjustments</Label>
          <div className="space-y-3">
            <SliderRow label="Brightness" value={brightness * 100} min={-100} max={100}
              onChange={v => { const val = v/100; setBrightness(val); applyImageFilter("Brightness", val); }}
              onMouseUp={saveHistoryState} />
            <SliderRow label="Contrast" value={contrast * 100} min={-100} max={100}
              onChange={v => { const val = v/100; setContrast(val); applyImageFilter("Contrast", val); }}
              onMouseUp={saveHistoryState} />
            <SliderRow label="Exposure" value={exposure} min={-100} max={100}
              onChange={v => { setExposure(v); applyImageFilter("Exposure", v); }}
              onMouseUp={saveHistoryState} />
            <SliderRow label="Saturation" value={saturation * 100} min={-100} max={100}
              onChange={v => { const val = v/100; setSaturation(val); applyImageFilter("Saturation", val); }}
              onMouseUp={saveHistoryState} />
            <SliderRow label="Vibrance" value={vibrance * 100} min={-100} max={100}
              onChange={v => { const val = v/100; setVibrance(val); applyImageFilter("Vibrance", val); }}
              onMouseUp={saveHistoryState} />
            <SliderRow label="Temperature" value={temperature} min={-100} max={100}
              onChange={v => { setTemperature(v); temperatureRef.current = v; applyTemperatureTint(v, tintRef.current); }}
              onMouseUp={saveHistoryState} />
            <SliderRow label="Tint" value={tint} min={-100} max={100}
              onChange={v => { setTint(v); tintRef.current = v; applyTemperatureTint(temperatureRef.current, v); }}
              onMouseUp={saveHistoryState} />
            <SliderRow label="Hue" value={hue} min={-180} max={180}
              onChange={v => { setHue(v); applyImageFilter("HueRotation", v); }}
              onMouseUp={saveHistoryState} />
            <SliderRow label="Sharpness" value={sharpness} min={0} max={100}
              onChange={v => { setSharpness(v); applyImageFilter("Sharpness", v); }}
              onMouseUp={saveHistoryState} />
            <SliderRow label="Blur" value={blur * 100} min={0} max={100}
              onChange={v => { const val = v/100; setBlur(val); applyImageFilter("Blur", val); }}
              onMouseUp={saveHistoryState} />
            <SliderRow label="Noise" value={noise} min={0} max={500} step={5}
              onChange={v => { setNoise(v); applyImageFilter("Noise", v); }}
              onMouseUp={saveHistoryState} />
          </div>
        </Section>
      )}

      {/* ── OPACITY (all objects) ── */}
      <Section>
        <Label>Opacity</Label>
        <SliderRow label="Opacity" value={objOpacity} min={0} max={100}
          onChange={v => apply("opacity", v / 100)}
          onMouseUp={saveHistoryState} />
      </Section>

      {/* ── SHADOW ── */}
      <Section>
        <Label>Shadow</Label>
        <div className="space-y-3">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={shadowEnabled}
              onChange={e => { setShadowEnabled(e.target.checked); applyShadow(shadowBlur, shadowColor, shadowOx, shadowOy, e.target.checked); saveHistoryState(); }}
              className="rounded" />
            <span className="text-xs font-semibold text-slate-700">Enable Shadow</span>
          </label>
          {shadowEnabled && (
            <>
              <SliderRow label="Blur" value={shadowBlur} min={0} max={100}
                onChange={v => { setShadowBlur(v); applyShadow(v, shadowColor, shadowOx, shadowOy, true); }}
                onMouseUp={saveHistoryState} />
              <Row>
                <NumInput label="Offset X" value={shadowOx} onChange={v => { setShadowOx(v); applyShadow(shadowBlur, shadowColor, v, shadowOy, true); }} />
                <NumInput label="Offset Y" value={shadowOy} onChange={v => { setShadowOy(v); applyShadow(shadowBlur, shadowColor, shadowOx, v, true); }} />
              </Row>
              <div>
                <div className="text-[9px] text-slate-400 font-semibold mb-1">Shadow Color</div>
                <input type="color" value={shadowColor}
                  onChange={e => { setShadowColor(e.target.value); applyShadow(shadowBlur, e.target.value, shadowOx, shadowOy, true); }}
                  onBlur={saveHistoryState}
                  className="w-full h-8 rounded-lg border border-slate-200 cursor-pointer" />
              </div>
            </>
          )}
        </div>
      </Section>

      {/* ── FLIP & ROTATE ── */}
      <Section>
        <Label>Flip &amp; Rotate</Label>
        <div className="space-y-2">
          <Row>
            <button onClick={() => { if (!activeObject || !canvas) return; activeObject.set("flipX", !activeObject.flipX); canvas.renderAll(); saveHistoryState(); }}
              className="flex-1 flex items-center justify-center gap-1 py-2 text-[10px] font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition">
              <FlipHorizontal className="w-3.5 h-3.5" /> Flip H
            </button>
            <button onClick={() => { if (!activeObject || !canvas) return; activeObject.set("flipY", !activeObject.flipY); canvas.renderAll(); saveHistoryState(); }}
              className="flex-1 flex items-center justify-center gap-1 py-2 text-[10px] font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition">
              <FlipVertical className="w-3.5 h-3.5" /> Flip V
            </button>
          </Row>
          <SliderRow label="Rotation" value={objAngle} min={-180} max={180}
            onChange={v => { setObjAngle(v); if (activeObject && canvas) { activeObject.set("angle", v); canvas.renderAll(); }}}
            onMouseUp={saveHistoryState} />
          <Row>
            {([-90, 0, 90, 180] as const).map(deg => (
              <button key={deg}
                onClick={() => { if (!activeObject || !canvas) return; activeObject.set("angle", deg); setObjAngle(deg); canvas.renderAll(); saveHistoryState(); }}
                className={`flex-1 py-1.5 text-[9px] font-bold rounded-lg border transition ${
                  Math.round(objAngle) === deg ? "bg-blue-600 text-white border-blue-600" : "border-slate-200 text-slate-500 hover:bg-slate-100"}`}>
                {deg}°
              </button>
            ))}
          </Row>
        </div>
      </Section>

      {/* ── BORDER ── */}
      <Section>
        <Label>Border</Label>
        <div className="space-y-2">
          <SliderRow label="Border Width" value={borderWidth} min={0} max={50}
            onChange={v => { setBorderWidth(v); applyBorder(v, borderColor); }}
            onMouseUp={saveHistoryState} />
          {borderWidth > 0 && (
            <div>
              <div className="text-[9px] text-slate-400 font-semibold mb-1">Border Color</div>
              <Row>
                <input type="color" value={borderColor}
                  onChange={e => { setBorderColor(e.target.value); applyBorder(borderWidth, e.target.value); }}
                  onBlur={saveHistoryState}
                  className="w-9 h-9 rounded-lg border border-slate-200 cursor-pointer shrink-0" />
                <span className="text-[11px] font-semibold text-slate-600">{borderColor}</span>
              </Row>
            </div>
          )}
        </div>
      </Section>

      {/* ── ROUNDED CORNERS (images only) ── */}
      {isImage && (
        <Section>
          <Label>Rounded Corners</Label>
          <SliderRow label="Corner Radius %" value={roundedCorners} min={0} max={100}
            onChange={v => { setRoundedCorners(v); applyRoundedCorners(v); }}
            onMouseUp={saveHistoryState} />
        </Section>
      )}

      {/* ── ACTIONS ── */}
      <Section>
        <Label>Actions</Label>
        <div className="space-y-2">
          <Row>
            <button onClick={duplicateObject}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition">
              <Copy className="w-3.5 h-3.5" /> Duplicate
            </button>
            <button onClick={toggleLock}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] font-semibold rounded-lg border transition ${
                isLocked ? "bg-amber-500 text-white border-amber-500" : "bg-slate-100 text-slate-700 border-transparent hover:bg-slate-200"}`}>
              {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
              {isLocked ? "Unlock" : "Lock"}
            </button>
          </Row>
          {isImage && (
            <button onClick={addReflection}
              className="w-full flex items-center justify-center gap-1.5 py-2 text-[10px] font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12h18M3 6l6 6-6 6M21 6l-6 6 6 6" />
              </svg>
              Add Reflection
            </button>
          )}
        </div>
      </Section>
    </div>
  );

  // ════════════════════════════════════════════════════════════════════
  // PANEL TITLES
  // ════════════════════════════════════════════════════════════════════
  const panelTitle = () => {
    if (activeTool === "upload")    return "Upload Image";
    if (activeTool === "assets")    return "Assets Library";
    if (activeTool === "removebg")  return "Remove Background";
    if (activeTool === "crop")      return "Crop & Transform";
    if (activeTool === "text")      return "Add Text";
    if (activeObject) {
      return sidebarSubTab === "object" ? "Selection Properties" : "Canvas Setup";
    }
    return "Canvas Setup";
  };

  const showClose = !!activeTool;

  // ── ── ── ── ── ── ── ── ── ── ── ── ── ── ── ── ── ── ── ── ── ── ── ──
  // RENDER
  // ── ── ── ── ── ── ── ── ── ── ── ── ── ── ── ── ── ── ── ── ── ── ── ──
  return (
    <div className="w-64 bg-white border-l border-slate-200 flex flex-col h-full shrink-0 shadow-[-2px_0_15px_-3px_rgba(0,0,0,0.05)]">
      {/* Panel Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 shrink-0">
        <span className="text-[11px] font-black text-slate-700 uppercase tracking-widest">{panelTitle()}</span>
        {showClose && (
          <button onClick={() => setActiveTool(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Sub-tab selector when an object is active */}
      {!activeTool && activeObject && (
        <div className="flex border-b border-slate-100 shrink-0 bg-slate-50/50 p-1 gap-1">
          <button
            onClick={() => setSidebarSubTab("object")}
            className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition ${
              sidebarSubTab === "object"
                ? "bg-white text-blue-600 shadow-sm border border-slate-200/40"
                : "text-slate-500 hover:text-slate-800 hover:bg-white/50"
            }`}
          >
            Selection
          </button>
          <button
            onClick={() => setSidebarSubTab("canvas")}
            className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition ${
              sidebarSubTab === "canvas"
                ? "bg-white text-blue-600 shadow-sm border border-slate-200/40"
                : "text-slate-500 hover:text-slate-800 hover:bg-white/50"
            }`}
          >
            Canvas
          </button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {activeTool === "upload"    && UploadPanel()}
        {activeTool === "assets"    && AssetsPanel()}
        {activeTool === "removebg"  && RemoveBgPanel()}
        {activeTool === "crop"      && CropPanel()}
        {activeTool === "text"      && TextPanel()}

        {!activeTool && activeObject && sidebarSubTab === "object" && ObjectPropertiesPanel()}
        {!activeTool && activeObject && sidebarSubTab === "canvas" && CanvasPanel()}
        {!activeTool && !activeObject && CanvasPanel()}
      </div>

      {/* Export Button */}
      <div className="border-t border-slate-100 p-3 shrink-0">
        <button onClick={() => canvas && setExportOpen(true)}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 active:scale-[0.98]">
          <Download className="w-3.5 h-3.5" /> Export Design
        </button>
      </div>

      {exportOpen && canvas && (
        <ExportModal canvas={canvas} onClose={() => setExportOpen(false)} projectName={projectName} batchImages={batchImages} canvasConfig={canvasConfig} />
      )}
    </div>
  );
}
