"use client";

import React, { useEffect, useLayoutEffect, useRef, useState, useCallback } from "react";
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;
import { fabric } from "fabric";
import { useWorkspace } from "./WorkspaceProvider";
import { ImageIcon, X } from "lucide-react";

export function CanvasArea() {
  const {
    canvas, setCanvas, canvasConfig, setZoom, zoom,
    fitToScreenTrigger, batchImages, setBatchImages,
    activeBatchIdx, setActiveBatchIdx,
  } = useWorkspace();

  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasImage, setHasImage] = useState(false);
  // Persist canvas JSON per batch image so edits (BG removal, filters etc.) survive switching
  const activeBatchIdxRef = useRef<number | null>(null);
  const batchCanvasStatesRef = useRef<Record<number, string>>({});
  const loadingUrlRef = useRef<string | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const fitToContainer = useCallback((targetCanvas: fabric.Canvas) => {
    if (!containerRef.current || !targetCanvas || (targetCanvas as any).disposed || !(targetCanvas as any).lowerCanvasEl) return;
    const cW = containerRef.current.clientWidth  - 40;
    const cH = containerRef.current.clientHeight - 40;
    const scale = Math.min(cW / canvasConfig.width, cH / canvasConfig.height) * 0.58;
    const z = Math.max(0.05, scale);
    setZoom(z);
    targetCanvas.setZoom(z);
    targetCanvas.setWidth(canvasConfig.width   * z);
    targetCanvas.setHeight(canvasConfig.height * z);
    if (wrapperRef.current) {
      wrapperRef.current.style.width = `${canvasConfig.width * z}px`;
      wrapperRef.current.style.height = `${canvasConfig.height * z}px`;
      wrapperRef.current.style.opacity = "1";
    }
    targetCanvas.renderAll();
  }, [canvasConfig.width, canvasConfig.height, setZoom]);

  // ── Init Fabric canvas ──────────────────────────────────────────────
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const fabCanvas = new fabric.Canvas(canvasRef.current, {
      width: canvasConfig.width,
      height: canvasConfig.height,
      backgroundColor: canvasConfig.backgroundColor,
      preserveObjectStacking: true,
    });

    setCanvas(fabCanvas);

    // Center snapping
    fabCanvas.on("object:moving", (e) => {
      const obj = e.target;
      if (!obj) return;
      const snap = 15;
      const cx = canvasConfig.width / 2;
      const cy = canvasConfig.height / 2;
      const ox = obj.left! + (obj.originX === "center" ? 0 : (obj.width! * obj.scaleX!) / 2);
      const oy = obj.top!  + (obj.originY === "center" ? 0 : (obj.height! * obj.scaleY!) / 2);
      if (Math.abs(ox - cx) < snap) obj.set("left", obj.originX === "center" ? cx : cx - (obj.width! * obj.scaleX!) / 2);
      if (Math.abs(oy - cy) < snap) obj.set("top",  obj.originY === "center" ? cy : cy - (obj.height! * obj.scaleY!) / 2);
    });

    // Keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Backspace" || e.key === "Delete") {
        const active = fabCanvas.getActiveObjects();
        if (!active.length) return;
        if (fabCanvas.getActiveObject() instanceof fabric.IText &&
            (fabCanvas.getActiveObject() as fabric.IText).isEditing) return;
        active.forEach(o => fabCanvas.remove(o));
        fabCanvas.discardActiveObject();
        fabCanvas.renderAll();
      }
    };

    const handleResize = () => fitToContainer(fabCanvas);

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleResize);
      fabCanvas.off();
      fabCanvas.dispose();
      setCanvas(null as any);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto fit on dimensions/canvas change ────────────────────────────
  useIsomorphicLayoutEffect(() => {
    if (!canvas) return;

    // Scale and re-center any image objects inside the canvas to fit the new dimensions
    const objects = canvas.getObjects();
    const cW = canvasConfig.width;
    const cH = canvasConfig.height;
    objects.forEach(obj => {
      if (obj instanceof fabric.Image) {
        const scale = Math.min(cW / (obj.width || 1), cH / (obj.height || 1));
        obj.set({
          scaleX: scale,
          scaleY: scale,
          left: cW / 2,
          top: cH / 2
        });
        obj.setCoords();
      }
    });

    fitToContainer(canvas);
  }, [canvasConfig.width, canvasConfig.height, canvas, fitToContainer]);

  // ── Sync background config ──────────────────────────────────────────
  useEffect(() => {
    if (!canvas || !canvas.getElement?.() || (canvas as any).disposed || !(canvas as any).lowerCanvasEl) return;

    // Reset background image first when switching away from image background type
    if (canvasConfig.backgroundType !== "image") {
      canvas.backgroundImage = null as any;
    }

    if (canvasConfig.backgroundType === "transparent") {
      canvas.backgroundColor = "";
      canvas.renderAll();
    } else if (canvasConfig.backgroundType === "color") {
      canvas.backgroundColor = canvasConfig.backgroundColor;
      canvas.renderAll();
    } else if (canvasConfig.backgroundType === "gradient") {
      const g = new fabric.Gradient({
        type: canvasConfig.backgroundGradient.type,
        coords: canvasConfig.backgroundGradient.type === "linear"
          ? { x1: 0, y1: 0, x2: canvasConfig.width, y2: canvasConfig.height }
          : { r1: 0, r2: canvasConfig.width / 2, x1: canvasConfig.width / 2, y1: canvasConfig.height / 2, x2: canvasConfig.width / 2, y2: canvasConfig.height / 2 },
        colorStops: [
          { offset: 0, color: canvasConfig.backgroundGradient.color1 },
          { offset: 1, color: canvasConfig.backgroundGradient.color2 },
        ],
      });
      (canvas as any).setBackgroundColor(g, canvas.renderAll.bind(canvas));
    } else if (canvasConfig.backgroundType === "image") {
      if (canvasConfig.backgroundImage) {
        fabric.Image.fromURL(canvasConfig.backgroundImage, (img) => {
          if (!canvas || (canvas as any).disposed || !(canvas as any).lowerCanvasEl) return;
          img.set({
            scaleX: canvasConfig.width / img.width!,
            scaleY: canvasConfig.height / img.height!,
            originX: "left",
            originY: "top"
          });
          (canvas as any).setBackgroundImage(img, canvas.renderAll.bind(canvas));
        });
      } else {
        canvas.backgroundImage = null as any;
        canvas.backgroundColor = "#ffffff";
        canvas.renderAll();
      }
    }
  }, [canvasConfig.backgroundType, canvasConfig.backgroundColor, canvasConfig.backgroundGradient, canvasConfig.backgroundImage, canvas, canvasConfig.width, canvasConfig.height]);

  // ── Fit to screen trigger ───────────────────────────────────────────
  useEffect(() => {
    if (!canvas) return;
    fitToContainer(canvas);
  }, [fitToScreenTrigger, canvas, fitToContainer]);

  // ── File upload ─────────────────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCanvasClick = () => {
    if (!hasImage && fileInputRef.current) fileInputRef.current.click();
  };

  /** Load one URL onto the canvas (replaces ALL current objects on canvas) */
  const loadSingleImageToCanvas = useCallback((url: string, targetCanvas: fabric.Canvas) => {
    if (!targetCanvas || (targetCanvas as any).disposed) return;
    loadingUrlRef.current = url;
    // Clear canvas first
    targetCanvas.clear();
    (targetCanvas as any).backgroundColor = canvasConfig.backgroundColor || "#ffffff";

    const imgEl = new window.Image();
    imgEl.src = url;
    imgEl.onload = () => {
      if (loadingUrlRef.current !== url) return;
      if (!targetCanvas || (targetCanvas as any).disposed) return;
      const img = new fabric.Image(imgEl);
      const cW = canvasConfig.width, cH = canvasConfig.height;
      const scale = Math.min(cW / (img.width || 1), cH / (img.height || 1));
      img.set({
        scaleX: scale, scaleY: scale,
        originX: "center", originY: "center",
        left: cW / 2, top: cH / 2,
        selectable: true,
      });
      targetCanvas.add(img);
      targetCanvas.setActiveObject(img);
      targetCanvas.renderAll();
    };
  }, [canvasConfig]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Add image to canvas WITHOUT clearing (for single file upload) */
  const addImageToCanvas = useCallback((url: string, targetCanvas: fabric.Canvas) => {
    if (!targetCanvas || (targetCanvas as any).disposed) return;
    const imgEl = new window.Image();
    imgEl.src = url;
    imgEl.onload = () => {
      if (!targetCanvas || (targetCanvas as any).disposed) return;
      const img = new fabric.Image(imgEl);
      const cW = canvasConfig.width, cH = canvasConfig.height;
      const scale = Math.min(cW / (img.width || 1), cH / (img.height || 1));
      img.set({
        scaleX: scale, scaleY: scale,
        originX: "center", originY: "center",
        left: cW / 2, top: cH / 2,
        selectable: true,
      });
      targetCanvas.add(img);
      targetCanvas.setActiveObject(img);
      targetCanvas.renderAll();
    };
  }, [canvasConfig]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !canvas) return;

    Promise.all(files.map(f => new Promise<string>(res => {
      const r = new FileReader();
      r.onload = ev => res(ev.target?.result as string);
      r.readAsDataURL(f);
    }))).then(urls => {
      setBatchImages(prev => {
        const next = [...prev, ...urls];
        const firstIdx = prev.length;
        setActiveBatchIdx(firstIdx);
        return next;
      });
    });
    e.target.value = "";
  };

  // ── Track empty state ───────────────────────────────────────────────
  useEffect(() => {
    if (!canvas || !canvas.getElement?.() || (canvas as any).disposed || !(canvas as any).lowerCanvasEl) return;
    const check = () => {
      if (canvas && !(canvas as any).disposed && (canvas as any).lowerCanvasEl) {
        setHasImage(canvas.getObjects().length > 0);
      }
    };
    canvas.on("object:added",   check);
    canvas.on("object:removed", check);
    return () => {
      if (canvas && !(canvas as any).disposed && (canvas as any).lowerCanvasEl) {
        canvas.off("object:added",   check);
        canvas.off("object:removed", check);
      }
    };
  }, [canvas]);

  // ── When batchImages URLs change (e.g. after batch BG removal) clear stale states ──
  const prevBatchImagesRef = useRef<string[]>([]);
  useEffect(() => {
    if (!canvas || (canvas as any).disposed || !(canvas as any).lowerCanvasEl) return;
    const prev = prevBatchImagesRef.current;
    batchImages.forEach((url, idx) => {
      if (prev[idx] && prev[idx] !== url) {
        // This image's source URL changed — stale canvas JSON is now wrong, clear it
        delete batchCanvasStatesRef.current[idx];

        // If this is the currently active image, reload the canvas with the new URL
        if (activeBatchIdxRef.current === idx && canvas && !(canvas as any).disposed && (canvas as any).lowerCanvasEl) {
          loadSingleImageToCanvas(url, canvas);
        }
      }
    });
    prevBatchImagesRef.current = [...batchImages];
  }, [batchImages, canvas, loadSingleImageToCanvas]);

  // ── Sync active batch index from global context ───────────────────
  useEffect(() => {
    if (!canvas || (canvas as any).disposed || !(canvas as any).lowerCanvasEl) return;

    if (activeBatchIdx === null) {
      if (activeBatchIdxRef.current !== null) {
        activeBatchIdxRef.current = null;
        canvas.clear();
        canvas.renderAll();
      }
      return;
    }

    if (activeBatchIdx !== activeBatchIdxRef.current) {
      const src = batchImages[activeBatchIdx];
      if (src) {
        // Save current state for the index we are leaving
        if (activeBatchIdxRef.current !== null && activeBatchIdxRef.current < batchImages.length) {
          batchCanvasStatesRef.current[activeBatchIdxRef.current] = JSON.stringify(canvas.toJSON());
        }
        
        // Update ref
        activeBatchIdxRef.current = activeBatchIdx;
        
        // Restore/load state
        const savedState = batchCanvasStatesRef.current[activeBatchIdx];
        if (savedState) {
          canvas.loadFromJSON(savedState, () => canvas.renderAll());
        } else {
          loadSingleImageToCanvas(src, canvas);
        }
      }
    }
  }, [activeBatchIdx, batchImages, canvas, loadSingleImageToCanvas]);

  // ── Switch batch image ──────────────────────────────────────────────
  const switchToBatchImage = useCallback((src: string, idx: number) => {
    setActiveBatchIdx(idx);
  }, [setActiveBatchIdx]);

  const removeBatchImage = useCallback((e: React.MouseEvent, idx: number) => {
    e.stopPropagation();
    // Remove saved state for this index and reindex remaining ones
    const oldStates = { ...batchCanvasStatesRef.current };
    const newStates: Record<number, string> = {};
    Object.entries(oldStates).forEach(([k, v]) => {
      const n = Number(k);
      if (n < idx) newStates[n] = v;
      else if (n > idx) newStates[n - 1] = v;
    });
    batchCanvasStatesRef.current = newStates;

    setBatchImages(prev => {
      const next = prev.filter((_, i) => i !== idx);
      if (activeBatchIdx === idx) {
        activeBatchIdxRef.current = null;
        setActiveBatchIdx(null);
        if (canvas) { canvas.clear(); canvas.renderAll(); }
      } else if (activeBatchIdx !== null && activeBatchIdx > idx) {
        const newIdx = activeBatchIdx - 1;
        activeBatchIdxRef.current = newIdx;
        setActiveBatchIdx(newIdx);
      }
      return next;
    });
  }, [activeBatchIdx, canvas, setBatchImages, setActiveBatchIdx]);

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <div className="flex-1 overflow-hidden flex flex-col relative bg-[#f0f2f7]">
      {/* Canvas area */}
      <div className="flex-1 p-8 overflow-hidden flex items-center justify-center relative" ref={containerRef}>
        <div
          ref={wrapperRef}
          className={`overflow-hidden bg-white ring-1 ring-slate-200/50 relative flex items-center justify-center ${!hasImage ? "cursor-pointer hover:ring-blue-400" : ""}`}
          style={{ width: canvasConfig.width * zoom, height: canvasConfig.height * zoom, opacity: zoom === 1 ? 0 : 1 }}
          onClick={handleCanvasClick}
        >
          {!hasImage && (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 z-10 pointer-events-none"
              style={{ transform: `scale(${Math.min(1, zoom)})` }}
            >
              <ImageIcon className="w-12 h-12 opacity-20 mb-2" />
              <span className="text-xs font-semibold opacity-40">Click to upload an image</span>
            </div>
          )}
          <div><canvas ref={canvasRef} /></div>
        </div>
      </div>

      {/* ── Bottom Batch Strip ────────────────────────────────────────── */}
      {batchImages.length > 0 && (
        <div className="relative shrink-0 border-t border-slate-200 bg-white/95 backdrop-blur-sm shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
          {/* strip header */}
          <div className="flex items-center gap-2 px-4 pt-2 pb-1">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
              Batch — {batchImages.length} image{batchImages.length !== 1 ? "s" : ""}
            </span>
            <button
              onClick={() => { setBatchImages([]); setActiveBatchIdx(null); if (canvas) { canvas.clear(); canvas.renderAll(); } }}
              className="ml-auto text-[9px] font-semibold text-slate-400 hover:text-rose-500 transition px-2 py-0.5 rounded-md hover:bg-rose-50"
            >
              Clear all
            </button>
          </div>

          {/* thumbnails — padded so ring shadow is not clipped */}
          <div
            className="flex gap-2.5 px-4 pb-3"
            style={{ overflowX: "auto", overflowY: "visible", paddingTop: "6px", scrollbarWidth: "none" }}
          >
            {batchImages.map((src, i) => (
              <div
                key={i}
                onClick={() => switchToBatchImage(src, i)}
                className={`relative shrink-0 w-[72px] h-[72px] rounded-xl overflow-hidden cursor-pointer transition-all duration-200 group
                  ${activeBatchIdx === i
                    ? "ring-2 ring-blue-500 ring-offset-2 shadow-lg scale-105"
                    : "ring-1 ring-slate-200 hover:ring-blue-300 hover:scale-[1.03] hover:shadow-md"
                  }`}
              >
                <img src={src} className="w-full h-full object-cover" />

                {/* active indicator */}
                {activeBatchIdx === i && (
                  <div className="absolute bottom-0 left-0 right-0 bg-blue-500/80 text-white text-[7px] font-bold text-center py-0.5 leading-none">
                    ACTIVE
                  </div>
                )}

                {/* remove btn */}
                <button
                  onClick={e => removeBatchImage(e, i)}
                  className="absolute top-0.5 right-0.5 w-4 h-4 bg-white/90 text-slate-700 hover:text-rose-600 hover:bg-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-sm"
                >
                  <X className="w-2.5 h-2.5" />
                </button>

                {/* number badge */}
                <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-black/40 text-white rounded-full flex items-center justify-center text-[8px] font-bold">
                  {i + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        className="hidden"
        accept="image/*"
        multiple
      />
    </div>
  );
}
