"use client";

import React, { useEffect, useLayoutEffect, useRef, useState, useCallback } from "react";
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;
import { fabric } from "fabric";
import { useWorkspace } from "./WorkspaceProvider";
import { ImageIcon, X, Upload, Loader2, AlertCircle } from "lucide-react";

// Image compression utility
const compressImage = (dataUrl: string, maxWidth = 1600, maxHeight = 1600, quality = 0.8): Promise<string> => {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(dataUrl);
    if (!dataUrl.startsWith("data:image/")) return resolve(dataUrl);
    const img = new window.Image();
    img.src = dataUrl;
    img.onload = () => {
      let w = img.width, h = img.height;
      if (w <= maxWidth && h <= maxHeight) { resolve(dataUrl); return; }
      const ratio = Math.min(maxWidth / w, maxHeight / h);
      w = Math.round(w * ratio); h = Math.round(h * ratio);
      const c = document.createElement("canvas"); c.width = w; c.height = h;
      const ctx = c.getContext("2d");
      if (ctx) { ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high"; ctx.drawImage(img, 0, 0, w, h); }
      resolve(c.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => resolve(dataUrl);
  });
};

// ── Smart Guidelines Helper ─────────────────────────────────────────────
// Returns snap lines + adjusted position for a moving object relative to siblings
function computeSmartGuides(
  movingObj: fabric.Object,
  allObjects: fabric.Object[],
  canvasW: number,
  canvasH: number,
  snapThreshold = 6
) {
  const lines: { x1: number; y1: number; x2: number; y2: number }[] = [];
  const bound = movingObj.getBoundingRect(true);
  const mCx = bound.left + bound.width / 2;
  const mCy = bound.top + bound.height / 2;
  const mL = bound.left, mR = bound.left + bound.width;
  const mT = bound.top, mB = bound.top + bound.height;

  let snapDx = Infinity, snapDy = Infinity;
  let bestDx = 0, bestDy = 0;

  // Snap targets: canvas edges, canvas center, and all other objects
  const targets: { l: number; r: number; t: number; b: number; cx: number; cy: number }[] = [
    { l: 0, r: canvasW, t: 0, b: canvasH, cx: canvasW / 2, cy: canvasH / 2 },
  ];

  allObjects.forEach(obj => {
    if (obj === movingObj || obj === (movingObj as any).group) return;
    if ((obj as any).__isGuideLine) return;
    const b = obj.getBoundingRect(true);
    targets.push({ l: b.left, r: b.left + b.width, t: b.top, b: b.top + b.height, cx: b.left + b.width / 2, cy: b.top + b.height / 2 });
  });

  // Check horizontal alignments (left, center, right of moving vs target)
  const hChecks = [
    { mv: mL, key: "l" as const, offset: 0 },
    { mv: mCx, key: "cx" as const, offset: -bound.width / 2 },
    { mv: mR, key: "r" as const, offset: -bound.width },
  ];
  const vChecks = [
    { mv: mT, key: "t" as const, offset: 0 },
    { mv: mCy, key: "cy" as const, offset: -bound.height / 2 },
    { mv: mB, key: "b" as const, offset: -bound.height },
  ];

  for (const tgt of targets) {
    for (const hc of hChecks) {
      for (const tKey of ["l", "cx", "r"] as const) {
        const d = Math.abs(hc.mv - tgt[tKey]);
        if (d < snapThreshold && d < Math.abs(snapDx)) {
          snapDx = d;
          bestDx = tgt[tKey] - hc.mv;
        }
      }
    }
    for (const vc of vChecks) {
      for (const tKey of ["t", "cy", "b"] as const) {
        const d = Math.abs(vc.mv - tgt[tKey]);
        if (d < snapThreshold && d < Math.abs(snapDy)) {
          snapDy = d;
          bestDy = tgt[tKey] - vc.mv;
        }
      }
    }
  }

  // After snap adjustments, recalculate and build lines
  const adjL = mL + (Math.abs(snapDx) < snapThreshold ? bestDx : 0);
  const adjT = mT + (Math.abs(snapDy) < snapThreshold ? bestDy : 0);
  const adjR = adjL + bound.width;
  const adjB = adjT + bound.height;
  const adjCx = adjL + bound.width / 2;
  const adjCy = adjT + bound.height / 2;

  for (const tgt of targets) {
    // Vertical guide lines (x-axis alignment)
    for (const x of [tgt.l, tgt.cx, tgt.r]) {
      if (Math.abs(adjL - x) < 1 || Math.abs(adjCx - x) < 1 || Math.abs(adjR - x) < 1) {
        lines.push({ x1: x, y1: Math.min(adjT, tgt.t) - 20, x2: x, y2: Math.max(adjB, tgt.b) + 20 });
      }
    }
    // Horizontal guide lines (y-axis alignment)
    for (const y of [tgt.t, tgt.cy, tgt.b]) {
      if (Math.abs(adjT - y) < 1 || Math.abs(adjCy - y) < 1 || Math.abs(adjB - y) < 1) {
        lines.push({ x1: Math.min(adjL, tgt.l) - 20, y1: y, x2: Math.max(adjR, tgt.r) + 20, y2: y });
      }
    }
  }

  return {
    dx: Math.abs(snapDx) < snapThreshold ? bestDx : 0,
    dy: Math.abs(snapDy) < snapThreshold ? bestDy : 0,
    lines,
  };
}


export function CanvasArea() {
  const {
    canvas, setCanvas, canvasConfig, setZoom, zoom,
    fitToScreenTrigger, batchImages, setBatchImages,
    activeBatchIdx, setActiveBatchIdx, undo, redo,
  } = useWorkspace();

  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasImage, setHasImage] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, visible: boolean } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Buffer for copy/paste
  const copiedObjectRef = useRef<any>(null);
  // Alt+Drag duplicate tracking
  const altDragCloneRef = useRef<fabric.Object | null>(null);
  const altDragOriginalRef = useRef<{ left: number; top: number } | null>(null);

  // Guideline overlay lines drawn on canvas
  const guidelinesRef = useRef<fabric.Line[]>([]);

  // Persist canvas JSON per batch image
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

  // ── Helper: clear guideline overlays ────────────────────────────────
  const clearGuidelines = useCallback((c: fabric.Canvas) => {
    guidelinesRef.current.forEach(line => c.remove(line));
    guidelinesRef.current = [];
  }, []);

  // ── Helper: draw guideline overlays ─────────────────────────────────
  const drawGuidelines = useCallback((c: fabric.Canvas, lines: { x1: number; y1: number; x2: number; y2: number }[]) => {
    clearGuidelines(c);
    lines.forEach(({ x1, y1, x2, y2 }) => {
      const line = new fabric.Line([x1, y1, x2, y2], {
        stroke: "#f43f5e",
        strokeWidth: 0.8,
        strokeDashArray: [4, 3],
        selectable: false,
        evented: false,
        excludeFromExport: true,
      });
      (line as any).__isGuideLine = true;
      c.add(line);
      guidelinesRef.current.push(line);
    });
    c.renderAll();
  }, [clearGuidelines]);

  // ── Clipboard Operations ───────────────────────────────────────────
  const copyObject = useCallback(() => {
    if (!canvas) return;
    const activeObj = canvas.getActiveObject();
    if (!activeObj) return;
    activeObj.clone((cloned: any) => { copiedObjectRef.current = cloned; });
  }, [canvas]);

  const pasteObject = useCallback(() => {
    if (!canvas || !copiedObjectRef.current) return;
    copiedObjectRef.current.clone((clonedObj: any) => {
      canvas.discardActiveObject();
      clonedObj.set({ left: clonedObj.left + 25, top: clonedObj.top + 25, evented: true });
      if (clonedObj.type === 'activeSelection') {
        clonedObj.canvas = canvas;
        clonedObj.forEachObject((obj: any) => canvas.add(obj));
        clonedObj.setCoords();
      } else {
        canvas.add(clonedObj);
      }
      copiedObjectRef.current.top += 25;
      copiedObjectRef.current.left += 25;
      canvas.setActiveObject(clonedObj);
      canvas.requestRenderAll();
    });
  }, [canvas]);

  const duplicateObject = useCallback(() => {
    if (!canvas) return;
    const activeObj = canvas.getActiveObject();
    if (!activeObj) return;
    activeObj.clone((cloned: any) => {
      cloned.set({ left: cloned.left + 30, top: cloned.top + 30, evented: true });
      if (cloned.type === 'activeSelection') {
        cloned.canvas = canvas;
        cloned.forEachObject((obj: any) => canvas.add(obj));
        cloned.setCoords();
      } else {
        canvas.add(cloned);
      }
      canvas.setActiveObject(cloned);
      canvas.requestRenderAll();
    });
  }, [canvas]);

  const deleteSelected = useCallback(() => {
    if (!canvas) return;
    const activeObjects = canvas.getActiveObjects();
    if (!activeObjects.length) return;
    if (canvas.getActiveObject() instanceof fabric.IText &&
        (canvas.getActiveObject() as fabric.IText).isEditing) return;
    activeObjects.forEach(obj => canvas.remove(obj));
    canvas.discardActiveObject();
    canvas.requestRenderAll();
  }, [canvas]);

  const bringToFront = useCallback(() => {
    if (!canvas) return;
    const a = canvas.getActiveObject(); if (!a) return;
    a.bringToFront(); canvas.requestRenderAll();
  }, [canvas]);

  const sendToBack = useCallback(() => {
    if (!canvas) return;
    const a = canvas.getActiveObject(); if (!a) return;
    a.sendToBack(); canvas.requestRenderAll();
  }, [canvas]);

  // ── Group / Ungroup ────────────────────────────────────────────────
  const groupSelected = useCallback(() => {
    if (!canvas) return;
    const activeObj = canvas.getActiveObject();
    if (!activeObj || activeObj.type !== 'activeSelection') return;
    const group = (activeObj as fabric.ActiveSelection).toGroup();
    canvas.setActiveObject(group);
    canvas.requestRenderAll();
  }, [canvas]);

  const ungroupSelected = useCallback(() => {
    if (!canvas) return;
    const activeObj = canvas.getActiveObject();
    if (!activeObj || activeObj.type !== 'group') return;
    const items = (activeObj as fabric.Group).toActiveSelection();
    canvas.requestRenderAll();
  }, [canvas]);

  // ── Hide / Show ────────────────────────────────────────────────────
  const toggleVisibility = useCallback(() => {
    if (!canvas) return;
    const activeObjects = canvas.getActiveObjects();
    if (!activeObjects.length) return;
    activeObjects.forEach(obj => {
      obj.set("visible", !obj.visible);
      obj.set("evented", obj.visible!);
    });
    canvas.discardActiveObject();
    canvas.requestRenderAll();
  }, [canvas]);

  // ── Alignment helpers (for multi-select or single vs canvas) ───────
  const alignObjects = useCallback((direction: "left" | "right" | "top" | "bottom" | "h-center" | "v-center") => {
    if (!canvas) return;
    const activeObj = canvas.getActiveObject();
    if (!activeObj) return;

    const objects = canvas.getActiveObjects();

    if (objects.length <= 1) {
      // Align single object to canvas
      const obj = objects[0] || activeObj;
      const bound = obj.getBoundingRect(true);
      switch (direction) {
        case "left": obj.set("left", (obj.left || 0) - bound.left); break;
        case "right": obj.set("left", (obj.left || 0) + (canvasConfig.width - bound.left - bound.width)); break;
        case "top": obj.set("top", (obj.top || 0) - bound.top); break;
        case "bottom": obj.set("top", (obj.top || 0) + (canvasConfig.height - bound.top - bound.height)); break;
        case "h-center": obj.set("left", (obj.left || 0) + (canvasConfig.width / 2 - bound.left - bound.width / 2)); break;
        case "v-center": obj.set("top", (obj.top || 0) + (canvasConfig.height / 2 - bound.top - bound.height / 2)); break;
      }
      obj.setCoords();
    } else {
      // Align multiple objects relative to selection bounding box
      const bounds = objects.map(o => ({ obj: o, rect: o.getBoundingRect(true) }));
      const minL = Math.min(...bounds.map(b => b.rect.left));
      const maxR = Math.max(...bounds.map(b => b.rect.left + b.rect.width));
      const minT = Math.min(...bounds.map(b => b.rect.top));
      const maxB = Math.max(...bounds.map(b => b.rect.top + b.rect.height));

      bounds.forEach(({ obj, rect }) => {
        switch (direction) {
          case "left": obj.set("left", (obj.left || 0) + (minL - rect.left)); break;
          case "right": obj.set("left", (obj.left || 0) + (maxR - rect.left - rect.width)); break;
          case "top": obj.set("top", (obj.top || 0) + (minT - rect.top)); break;
          case "bottom": obj.set("top", (obj.top || 0) + (maxB - rect.top - rect.height)); break;
          case "h-center": {
            const cx = (minL + maxR) / 2;
            obj.set("left", (obj.left || 0) + (cx - rect.left - rect.width / 2));
            break;
          }
          case "v-center": {
            const cy = (minT + maxB) / 2;
            obj.set("top", (obj.top || 0) + (cy - rect.top - rect.height / 2));
            break;
          }
        }
        obj.setCoords();
      });
    }
    canvas.requestRenderAll();
  }, [canvas, canvasConfig.width, canvasConfig.height]);

  // ── Distribute ─────────────────────────────────────────────────────
  const distributeObjects = useCallback((axis: "horizontal" | "vertical") => {
    if (!canvas) return;
    const objects = canvas.getActiveObjects();
    if (objects.length < 3) return;

    const bounds = objects.map(o => ({ obj: o, rect: o.getBoundingRect(true) }));

    if (axis === "horizontal") {
      bounds.sort((a, b) => a.rect.left - b.rect.left);
      const totalObjWidth = bounds.reduce((s, b) => s + b.rect.width, 0);
      const minL = bounds[0].rect.left;
      const maxR = bounds[bounds.length - 1].rect.left + bounds[bounds.length - 1].rect.width;
      const totalSpace = maxR - minL - totalObjWidth;
      const gap = totalSpace / (bounds.length - 1);
      let cursor = minL;
      bounds.forEach(({ obj, rect }) => {
        obj.set("left", (obj.left || 0) + (cursor - rect.left));
        obj.setCoords();
        cursor += rect.width + gap;
      });
    } else {
      bounds.sort((a, b) => a.rect.top - b.rect.top);
      const totalObjHeight = bounds.reduce((s, b) => s + b.rect.height, 0);
      const minT = bounds[0].rect.top;
      const maxB = bounds[bounds.length - 1].rect.top + bounds[bounds.length - 1].rect.height;
      const totalSpace = maxB - minT - totalObjHeight;
      const gap = totalSpace / (bounds.length - 1);
      let cursor = minT;
      bounds.forEach(({ obj, rect }) => {
        obj.set("top", (obj.top || 0) + (cursor - rect.top));
        obj.setCoords();
        cursor += rect.height + gap;
      });
    }
    canvas.requestRenderAll();
  }, [canvas]);

  // Keep references updated for keydown handler
  const handlersRef = useRef({
    copyObject, pasteObject, duplicateObject, deleteSelected,
    undo, redo, canvas, zoom, canvasConfig, setZoom,
    groupSelected, ungroupSelected, toggleVisibility,
  });

  useEffect(() => {
    handlersRef.current = {
      copyObject, pasteObject, duplicateObject, deleteSelected,
      undo, redo, canvas, zoom, canvasConfig, setZoom,
      groupSelected, ungroupSelected, toggleVisibility,
    };
  }, [copyObject, pasteObject, duplicateObject, deleteSelected, undo, redo, canvas, zoom, canvasConfig, setZoom, groupSelected, ungroupSelected, toggleVisibility]);

  // Close context menu on window click
  useEffect(() => {
    const closeMenu = () => setContextMenu(null);
    window.addEventListener("click", closeMenu);
    return () => window.removeEventListener("click", closeMenu);
  }, []);

  // ── Init Fabric canvas ──────────────────────────────────────────────
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    // Performance
    fabric.Object.prototype.objectCaching = true;
    fabric.Object.prototype.statefullCache = false;
    fabric.Object.prototype.noScaleCache = false;

    // Figma-like handle styling
    fabric.Object.prototype.transparentCorners = false;
    fabric.Object.prototype.cornerColor = "#ffffff";
    fabric.Object.prototype.cornerStrokeColor = "#3b82f6";
    fabric.Object.prototype.borderColor = "#3b82f6";
    fabric.Object.prototype.cornerSize = 9;
    fabric.Object.prototype.cornerStyle = "circle";
    fabric.Object.prototype.borderScaleFactor = 1.5;
    fabric.Object.prototype.padding = 6;
    if (fabric.Object.prototype.controls?.mtr) {
      fabric.Object.prototype.controls.mtr.withConnection = true;
      fabric.Object.prototype.controls.mtr.y = -0.5;
    }

    const fabCanvas = new fabric.Canvas(canvasRef.current, {
      width: canvasConfig.width,
      height: canvasConfig.height,
      backgroundColor: canvasConfig.backgroundColor,
      preserveObjectStacking: true,
      imageSmoothingEnabled: true,
    });

    fabCanvas.selectionColor = "rgba(59, 130, 246, 0.12)";
    fabCanvas.selectionBorderColor = "#3b82f6";
    fabCanvas.selectionLineWidth = 1.5;

    setCanvas(fabCanvas);

    // ── Smart Guidelines + Snap to Objects on move ────────────────
    fabCanvas.on("object:moving", (e) => {
      const obj = e.target;
      if (!obj) return;

      // Alt+Drag duplicate: if Alt pressed on first move, clone the original
      if ((e.e as MouseEvent)?.altKey && !altDragCloneRef.current) {
        altDragOriginalRef.current = { left: obj.left!, top: obj.top! };
        obj.clone((cloned: fabric.Object) => {
          cloned.set({ left: altDragOriginalRef.current!.left, top: altDragOriginalRef.current!.top });
          fabCanvas.add(cloned);
          altDragCloneRef.current = cloned;
          fabCanvas.renderAll();
        });
      }

      // Smart Guidelines: compute snap and draw guide lines
      const allObjs = fabCanvas.getObjects().filter(o => !(o as any).__isGuideLine);
      const { dx, dy, lines } = computeSmartGuides(obj, allObjs, canvasConfig.width, canvasConfig.height);
      if (dx !== 0) obj.set("left", obj.left! + dx);
      if (dy !== 0) obj.set("top", obj.top! + dy);
      drawGuidelines(fabCanvas, lines);
    });

    fabCanvas.on("object:modified", () => {
      clearGuidelines(fabCanvas);
      altDragCloneRef.current = null;
      altDragOriginalRef.current = null;
    });

    fabCanvas.on("mouse:up", () => {
      clearGuidelines(fabCanvas);
      altDragCloneRef.current = null;
      altDragOriginalRef.current = null;
    });

    // ── Mouse wheel zoom ────────────────────────────────────────
    fabCanvas.on("mouse:wheel", (opt) => {
      const delta = opt.e.deltaY;
      let currentZ = handlersRef.current.zoom;
      currentZ = delta < 0 ? currentZ * 1.08 : currentZ / 1.08;
      if (currentZ > 12) currentZ = 12;
      if (currentZ < 0.05) currentZ = 0.05;
      handlersRef.current.setZoom(currentZ);
      fabCanvas.setZoom(currentZ);
      fabCanvas.setWidth(handlersRef.current.canvasConfig.width * currentZ);
      fabCanvas.setHeight(handlersRef.current.canvasConfig.height * currentZ);
      if (wrapperRef.current) {
        wrapperRef.current.style.width = `${handlersRef.current.canvasConfig.width * currentZ}px`;
        wrapperRef.current.style.height = `${handlersRef.current.canvasConfig.height * currentZ}px`;
      }
      fabCanvas.renderAll();
      opt.e.preventDefault();
      opt.e.stopPropagation();
    });

    // ── Keyboard shortcuts ──────────────────────────────────────
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeObj = handlersRef.current.canvas?.getActiveObject();
      if (activeObj instanceof fabric.IText && (activeObj as fabric.IText).isEditing) return;
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      if (e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault(); handlersRef.current.deleteSelected();
      } else if (modifier && e.key.toLowerCase() === "c") {
        e.preventDefault(); handlersRef.current.copyObject();
      } else if (modifier && e.key.toLowerCase() === "v") {
        e.preventDefault(); handlersRef.current.pasteObject();
      } else if (modifier && e.key.toLowerCase() === "d") {
        e.preventDefault(); handlersRef.current.duplicateObject();
      } else if (modifier && e.key.toLowerCase() === "a") {
        e.preventDefault();
        if (handlersRef.current.canvas) {
          handlersRef.current.canvas.discardActiveObject();
          const sel = new fabric.ActiveSelection(
            handlersRef.current.canvas.getObjects().filter(o => !(o as any).__isGuideLine),
            { canvas: handlersRef.current.canvas }
          );
          handlersRef.current.canvas.setActiveObject(sel);
          handlersRef.current.canvas.requestRenderAll();
        }
      } else if (modifier && e.key.toLowerCase() === "g") {
        e.preventDefault();
        if (e.shiftKey) {
          handlersRef.current.ungroupSelected();
        } else {
          handlersRef.current.groupSelected();
        }
      } else if (modifier && e.key.toLowerCase() === "h") {
        e.preventDefault();
        handlersRef.current.toggleVisibility();
      } else if (modifier && e.key.toLowerCase() === "z") {
        e.preventDefault();
        e.shiftKey ? handlersRef.current.redo() : handlersRef.current.undo();
      } else if (modifier && e.key.toLowerCase() === "y") {
        e.preventDefault(); handlersRef.current.redo();
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
    const objects = canvas.getObjects();
    const cW = canvasConfig.width, cH = canvasConfig.height;
    objects.forEach(obj => {
      if (obj instanceof fabric.Image) {
        const scale = Math.min(cW / (obj.width || 1), cH / (obj.height || 1));
        obj.set({ scaleX: scale, scaleY: scale, left: cW / 2, top: cH / 2 });
        obj.setCoords();
      }
    });
    fitToContainer(canvas);
  }, [canvasConfig.width, canvasConfig.height, canvas, fitToContainer]);

  // ── Sync background config ──────────────────────────────────────────
  useEffect(() => {
    if (!canvas || !canvas.getElement?.() || (canvas as any).disposed || !(canvas as any).lowerCanvasEl) return;
    if (canvasConfig.backgroundType !== "image") canvas.backgroundImage = null as any;
    if (canvasConfig.backgroundType === "transparent") {
      canvas.backgroundColor = ""; canvas.renderAll();
    } else if (canvasConfig.backgroundType === "color") {
      canvas.backgroundColor = canvasConfig.backgroundColor; canvas.renderAll();
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
        setIsImageLoading(true);
        fabric.Image.fromURL(canvasConfig.backgroundImage, (img) => {
          setIsImageLoading(false);
          if (!canvas || (canvas as any).disposed || !(canvas as any).lowerCanvasEl) return;
          img.set({ scaleX: canvasConfig.width / img.width!, scaleY: canvasConfig.height / img.height!, originX: "left", originY: "top" });
          (canvas as any).setBackgroundImage(img, canvas.renderAll.bind(canvas));
        }, { crossOrigin: "anonymous" });
      } else {
        canvas.backgroundImage = null as any; canvas.backgroundColor = "#ffffff"; canvas.renderAll();
      }
    }
  }, [canvasConfig.backgroundType, canvasConfig.backgroundColor, canvasConfig.backgroundGradient, canvasConfig.backgroundImage, canvas, canvasConfig.width, canvasConfig.height]);

  // ── Fit to screen trigger ───────────────────────────────────────────
  useEffect(() => { if (canvas) fitToContainer(canvas); }, [fitToScreenTrigger, canvas, fitToContainer]);

  // ── File upload ─────────────────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleCanvasClick = () => { if (!hasImage && fileInputRef.current) fileInputRef.current.click(); };

  const loadSingleImageToCanvas = useCallback((url: string, targetCanvas: fabric.Canvas) => {
    if (!targetCanvas || (targetCanvas as any).disposed) return;
    loadingUrlRef.current = url;
    setIsImageLoading(true); setErrorMsg(null);
    targetCanvas.clear();
    (targetCanvas as any).backgroundColor = canvasConfig.backgroundColor || "#ffffff";
    const imgEl = new window.Image();
    imgEl.crossOrigin = "anonymous"; imgEl.src = url;
    imgEl.onload = () => {
      setIsImageLoading(false);
      if (loadingUrlRef.current !== url || !targetCanvas || (targetCanvas as any).disposed) return;
      const img = new fabric.Image(imgEl);
      const cW = canvasConfig.width, cH = canvasConfig.height;
      const scale = Math.min(cW / (img.width || 1), cH / (img.height || 1));
      img.set({ scaleX: scale, scaleY: scale, originX: "center", originY: "center", left: cW / 2, top: cH / 2, selectable: true });
      targetCanvas.add(img); targetCanvas.setActiveObject(img); targetCanvas.renderAll();
    };
    imgEl.onerror = () => { setIsImageLoading(false); setErrorMsg("Failed to load selected image."); };
  }, [canvasConfig]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !canvas) return;
    setIsImageLoading(true);
    Promise.all(files.map(f => new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = ev => res(ev.target?.result as string); r.onerror = () => rej(); r.readAsDataURL(f); })))
      .then(async urls => {
        const compressed = await Promise.all(urls.map(url => compressImage(url)));
        setIsImageLoading(false);
        setBatchImages(prev => { const next = [...prev, ...compressed]; setActiveBatchIdx(prev.length); return next; });
      })
      .catch(() => { setIsImageLoading(false); setErrorMsg("Failed to upload image file(s)."); });
    e.target.value = "";
  };

  // ── Drag & Drop ────────────────────────────────────────────────────
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDraggingOver(true); };
  const handleDragLeave = () => setIsDraggingOver(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDraggingOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (!files.length || !canvas) return;
    setIsImageLoading(true);
    Promise.all(files.map(f => new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = ev => res(ev.target?.result as string); r.onerror = () => rej(); r.readAsDataURL(f); })))
      .then(async urls => {
        const compressed = await Promise.all(urls.map(url => compressImage(url)));
        setIsImageLoading(false);
        setBatchImages(prev => { const next = [...prev, ...compressed]; setActiveBatchIdx(prev.length); return next; });
      })
      .catch(() => { setIsImageLoading(false); setErrorMsg("Failed to import dropped files."); });
  };

  // ── Context Menu ───────────────────────────────────────────────────
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!canvas) return;
    setContextMenu({ x: e.clientX, y: e.clientY, visible: true });
  };

  // ── Track empty state ──────────────────────────────────────────────
  useEffect(() => {
    if (!canvas || !canvas.getElement?.() || (canvas as any).disposed || !(canvas as any).lowerCanvasEl) return;
    const check = () => {
      if (canvas && !(canvas as any).disposed && (canvas as any).lowerCanvasEl) {
        const hasObjs = canvas.getObjects().filter(o => !(o as any).__isGuideLine).length > 0;
        Promise.resolve().then(() => {
          if (canvas && !(canvas as any).disposed && (canvas as any).lowerCanvasEl) {
            setHasImage(hasObjs);
          }
        });
      }
    };
    canvas.on("object:added", check); canvas.on("object:removed", check);
    return () => { if (canvas && !(canvas as any).disposed && (canvas as any).lowerCanvasEl) { canvas.off("object:added", check); canvas.off("object:removed", check); } };
  }, [canvas]);

  // ── Sync batch image URL changes ───────────────────────────────────
  const prevBatchImagesRef = useRef<string[]>([]);
  useEffect(() => {
    if (!canvas || (canvas as any).disposed || !(canvas as any).lowerCanvasEl) return;
    const prev = prevBatchImagesRef.current;
    batchImages.forEach((url, idx) => {
      if (prev[idx] && prev[idx] !== url) {
        delete batchCanvasStatesRef.current[idx];
        if (activeBatchIdxRef.current === idx && canvas && !(canvas as any).disposed && (canvas as any).lowerCanvasEl) loadSingleImageToCanvas(url, canvas);
      }
    });
    prevBatchImagesRef.current = [...batchImages];
  }, [batchImages, canvas, loadSingleImageToCanvas]);

  // ── Sync active batch index ────────────────────────────────────────
  useEffect(() => {
    if (!canvas || (canvas as any).disposed || !(canvas as any).lowerCanvasEl) return;
    if (activeBatchIdx === null) {
      if (activeBatchIdxRef.current !== null) { activeBatchIdxRef.current = null; canvas.clear(); canvas.renderAll(); }
      return;
    }
    if (activeBatchIdx !== activeBatchIdxRef.current) {
      const src = batchImages[activeBatchIdx];
      if (src) {
        if (activeBatchIdxRef.current !== null && activeBatchIdxRef.current < batchImages.length) {
          batchCanvasStatesRef.current[activeBatchIdxRef.current] = JSON.stringify(canvas.toJSON());
        }
        activeBatchIdxRef.current = activeBatchIdx;
        const savedState = batchCanvasStatesRef.current[activeBatchIdx];
        if (savedState) { canvas.loadFromJSON(savedState, () => canvas.renderAll()); }
        else { loadSingleImageToCanvas(src, canvas); }
      }
    }
  }, [activeBatchIdx, batchImages, canvas, loadSingleImageToCanvas]);

  const switchToBatchImage = useCallback((src: string, idx: number) => setActiveBatchIdx(idx), [setActiveBatchIdx]);

  const removeBatchImage = useCallback((e: React.MouseEvent, idx: number) => {
    e.stopPropagation();
    const oldStates = { ...batchCanvasStatesRef.current };
    const newStates: Record<number, string> = {};
    Object.entries(oldStates).forEach(([k, v]) => { const n = Number(k); if (n < idx) newStates[n] = v; else if (n > idx) newStates[n - 1] = v; });
    batchCanvasStatesRef.current = newStates;
    setBatchImages(prev => {
      const next = prev.filter((_, i) => i !== idx);
      if (activeBatchIdx === idx) { activeBatchIdxRef.current = null; setActiveBatchIdx(null); if (canvas) { canvas.clear(); canvas.renderAll(); } }
      else if (activeBatchIdx !== null && activeBatchIdx > idx) { const newIdx = activeBatchIdx - 1; activeBatchIdxRef.current = newIdx; setActiveBatchIdx(newIdx); }
      return next;
    });
  }, [activeBatchIdx, canvas, setBatchImages, setActiveBatchIdx]);

  // ── Ruler Rendering ────────────────────────────────────────────────
  const renderRulerTicks = useCallback((orientation: "h" | "v") => {
    const ticks: React.ReactNode[] = [];
    const total = orientation === "h" ? canvasConfig.width : canvasConfig.height;
    const step = total <= 600 ? 50 : total <= 1500 ? 100 : 200;
    for (let i = 0; i <= total; i += step) {
      const pos = i * zoom;
      if (orientation === "h") {
        ticks.push(
          <div key={i} className="absolute top-0 flex flex-col items-center" style={{ left: pos }}>
            <div className="w-px h-2 bg-slate-400" />
            <span className="text-[7px] text-slate-400 font-bold mt-px select-none">{i}</span>
          </div>
        );
      } else {
        ticks.push(
          <div key={i} className="absolute left-0 flex items-center" style={{ top: pos }}>
            <div className="h-px w-2 bg-slate-400" />
            <span className="text-[7px] text-slate-400 font-bold ml-px select-none whitespace-nowrap" style={{ writingMode: "vertical-lr", transform: "rotate(180deg)" }}>{i}</span>
          </div>
        );
      }
    }
    return ticks;
  }, [canvasConfig.width, canvasConfig.height, zoom]);

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <div
      className="flex-1 overflow-hidden flex flex-col relative bg-[#f0f2f7]"
      onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
    >
      {/* Drag & Drop Overlay */}
      {isDraggingOver && (
        <div className="absolute inset-0 bg-blue-500/10 backdrop-blur-[2px] border-2 border-dashed border-blue-500 z-50 flex flex-col items-center justify-center pointer-events-none animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-6 shadow-xl border border-blue-100 flex flex-col items-center gap-3 animate-in zoom-in-95 duration-200">
            <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 animate-bounce"><Upload className="h-6 w-6" /></div>
            <div className="text-center">
              <p className="text-sm font-black text-slate-800">Drop your files here</p>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Release to upload instantly to canvas</p>
            </div>
          </div>
        </div>
      )}

      {/* Error Toast */}
      {errorMsg && (
        <div className="absolute top-4 right-4 z-50 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl flex items-center gap-3 shadow-lg max-w-sm animate-in slide-in-from-top-4 duration-200">
          <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />
          <p className="text-xs font-bold flex-1">{errorMsg}</p>
          <button onClick={() => setErrorMsg(null)} className="text-rose-400 hover:text-rose-600 transition p-0.5 rounded-lg hover:bg-rose-100 shrink-0 cursor-pointer"><X className="h-4 w-4" /></button>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && contextMenu.visible && (
        <div
          className="fixed bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 min-w-[190px] z-[9999] animate-in fade-in zoom-in-95 duration-100"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={() => { copyObject(); setContextMenu(null); }}
            className="w-full text-left px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-between cursor-pointer">
            <span>Copy</span><span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">⌘C</span>
          </button>
          <button onClick={() => { pasteObject(); setContextMenu(null); }}
            className="w-full text-left px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-between cursor-pointer"
            disabled={!copiedObjectRef.current}>
            <span className={!copiedObjectRef.current ? "text-slate-300" : ""}>Paste</span><span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">⌘V</span>
          </button>
          <button onClick={() => { duplicateObject(); setContextMenu(null); }}
            className="w-full text-left px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-between cursor-pointer">
            <span>Duplicate</span><span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">⌘D</span>
          </button>
          <button onClick={() => { deleteSelected(); setContextMenu(null); }}
            className="w-full text-left px-3.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 flex items-center justify-between font-bold cursor-pointer">
            <span>Delete</span><span className="text-[9px] text-rose-400 font-bold uppercase tracking-wider">Del</span>
          </button>

          <div className="border-t border-slate-100 my-1" />

          {/* Group / Ungroup */}
          <button onClick={() => { groupSelected(); setContextMenu(null); }}
            className="w-full text-left px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-between cursor-pointer">
            <span>Group</span><span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">⌘G</span>
          </button>
          <button onClick={() => { ungroupSelected(); setContextMenu(null); }}
            className="w-full text-left px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-between cursor-pointer">
            <span>Ungroup</span><span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">⌘⇧G</span>
          </button>

          {/* Hide/Show */}
          <button onClick={() => { toggleVisibility(); setContextMenu(null); }}
            className="w-full text-left px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-between cursor-pointer">
            <span>Hide / Show</span><span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">⌘H</span>
          </button>

          <div className="border-t border-slate-100 my-1" />

          {/* Ordering */}
          <button onClick={() => { bringToFront(); setContextMenu(null); }}
            className="w-full text-left px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 cursor-pointer">Bring to Front</button>
          <button onClick={() => { sendToBack(); setContextMenu(null); }}
            className="w-full text-left px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 cursor-pointer">Send to Back</button>

          <div className="border-t border-slate-100 my-1" />

          {/* Align */}
          <div className="px-3.5 py-1 text-[9px] font-bold text-slate-400 uppercase tracking-wider">Align</div>
          <div className="flex gap-0.5 px-3 pb-1.5">
            {(["left", "h-center", "right", "top", "v-center", "bottom"] as const).map(dir => (
              <button key={dir} onClick={() => { alignObjects(dir); setContextMenu(null); }}
                className="flex-1 py-1.5 text-[8px] font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-600 rounded-md transition cursor-pointer text-center uppercase"
                title={`Align ${dir}`}>
                {dir === "left" ? "L" : dir === "right" ? "R" : dir === "top" ? "T" : dir === "bottom" ? "B" : dir === "h-center" ? "HC" : "VC"}
              </button>
            ))}
          </div>

          {/* Distribute */}
          <div className="flex gap-1 px-3 pb-1.5">
            <button onClick={() => { distributeObjects("horizontal"); setContextMenu(null); }}
              className="flex-1 py-1.5 text-[8px] font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-600 rounded-md transition cursor-pointer text-center">
              Distribute H
            </button>
            <button onClick={() => { distributeObjects("vertical"); setContextMenu(null); }}
              className="flex-1 py-1.5 text-[8px] font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-600 rounded-md transition cursor-pointer text-center">
              Distribute V
            </button>
          </div>
        </div>
      )}

      {/* ── Canvas Area with Rulers ──────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden" ref={containerRef} onContextMenu={handleContextMenu}>
        {/* Vertical Ruler (Left) */}
        <div className="w-5 bg-white border-r border-slate-200 relative overflow-hidden shrink-0 select-none" style={{ height: "100%" }}>
          <div className="absolute top-0 left-0 w-full" style={{ height: canvasConfig.height * zoom }}>
            {renderRulerTicks("v")}
          </div>
        </div>

        {/* Main canvas column */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Horizontal Ruler (Top) */}
          <div className="h-5 bg-white border-b border-slate-200 relative overflow-hidden shrink-0 select-none">
            <div className="absolute top-0 left-0 h-full" style={{ width: canvasConfig.width * zoom }}>
              {renderRulerTicks("h")}
            </div>
          </div>

          {/* Canvas viewport */}
          <div className="flex-1 p-6 overflow-auto flex items-center justify-center relative">
            <div
              ref={wrapperRef}
              className={`overflow-hidden bg-white ring-1 ring-slate-200/50 relative flex items-center justify-center select-none shadow-sm ${!hasImage ? "cursor-pointer hover:ring-blue-400" : ""}`}
              style={{ width: canvasConfig.width * zoom, height: canvasConfig.height * zoom, opacity: zoom === 1 ? 0 : 1 }}
              onClick={handleCanvasClick}
            >
              {isImageLoading && (
                <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[1px] flex flex-col items-center justify-center z-40 animate-in fade-in duration-100">
                  <div className="bg-white/95 rounded-2xl shadow-lg border border-slate-100 p-5 flex items-center gap-3.5 max-w-[200px]">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600 shrink-0" />
                    <span className="text-xs font-black text-slate-700 tracking-wide">Loading...</span>
                  </div>
                </div>
              )}
              {!hasImage && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 z-10 pointer-events-none p-6"
                  style={{ transform: `scale(${Math.min(1, zoom)})` }}>
                  <div className="h-16 w-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-350 shadow-inner mb-4 animate-pulse">
                    <ImageIcon className="w-8 h-8 stroke-[1.5]" />
                  </div>
                  <p className="text-sm font-black text-slate-750 tracking-wide">Empty Canvas</p>
                  <p className="text-[11px] text-slate-400 font-semibold mt-1 max-w-[220px] text-center leading-relaxed">
                    Click here to browse files or drag and drop images directly to get started
                  </p>
                </div>
              )}
              <div><canvas ref={canvasRef} /></div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Batch Strip ─────────────────────────────────────── */}
      {batchImages.length > 0 && (
        <div className="relative shrink-0 border-t border-slate-200 bg-white/95 backdrop-blur-sm shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
          <div className="flex items-center gap-2 px-4 pt-2 pb-1">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
              Batch — {batchImages.length} image{batchImages.length !== 1 ? "s" : ""}
            </span>
            <button onClick={() => { setBatchImages([]); setActiveBatchIdx(null); if (canvas) { canvas.clear(); canvas.renderAll(); } }}
              className="ml-auto text-[9px] font-semibold text-slate-400 hover:text-rose-500 transition px-2 py-0.5 rounded-md hover:bg-rose-50 cursor-pointer">
              Clear all
            </button>
          </div>
          <div className="flex gap-2.5 px-4 pb-3" style={{ overflowX: "auto", overflowY: "visible", paddingTop: "6px", scrollbarWidth: "none" }}>
            {batchImages.map((src, i) => (
              <div key={i} onClick={() => switchToBatchImage(src, i)}
                className={`relative shrink-0 w-[72px] h-[72px] rounded-xl overflow-hidden cursor-pointer transition-all duration-200 group
                  ${activeBatchIdx === i ? "ring-2 ring-blue-500 ring-offset-2 shadow-lg scale-105" : "ring-1 ring-slate-200 hover:ring-blue-300 hover:scale-[1.03] hover:shadow-md"}`}>
                <img src={src} className="w-full h-full object-cover" loading="lazy" />
                {activeBatchIdx === i && (
                  <div className="absolute bottom-0 left-0 right-0 bg-blue-500/80 text-white text-[7px] font-bold text-center py-0.5 leading-none">ACTIVE</div>
                )}
                <button onClick={e => removeBatchImage(e, i)}
                  className="absolute top-0.5 right-0.5 w-4 h-4 bg-white/90 text-slate-700 hover:text-rose-600 hover:bg-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-sm cursor-pointer">
                  <X className="w-2.5 h-2.5" />
                </button>
                <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-black/40 text-white rounded-full flex items-center justify-center text-[8px] font-bold">{i + 1}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" multiple />
    </div>
  );
}
