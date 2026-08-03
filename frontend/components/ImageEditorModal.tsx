"use client";
import React, { useEffect, useRef, useState } from "react";
import { X, Type, Trash2, Save } from "lucide-react";
import { fabric } from "fabric";

interface ImageEditorModalProps {
  imageUrl: string;
  onClose: () => void;
  onSave: (file: File) => Promise<void>;
}

export function ImageEditorModal({ imageUrl, onClose, onSave }: ImageEditorModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize Fabric canvas
    const fabCanvas = new fabric.Canvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: "#f8fafc" // slate-50
    });
    setCanvas(fabCanvas);

    // Load initial image
    fabric.Image.fromURL(imageUrl, (img) => {
      // Scale image to fit canvas while maintaining aspect ratio
      const canvasWidth = fabCanvas.width || 800;
      const canvasHeight = fabCanvas.height || 600;
      const imgWidth = img.width || 1;
      const imgHeight = img.height || 1;
      
      const scale = Math.min(
        (canvasWidth - 60) / imgWidth,
        (canvasHeight - 60) / imgHeight
      );

      img.set({
        scaleX: scale,
        scaleY: scale,
        originX: "center",
        originY: "center",
        left: canvasWidth / 2,
        top: canvasHeight / 2,
        selectable: true
      });

      fabCanvas.add(img);
      fabCanvas.sendToBack(img);
      fabCanvas.renderAll();
    }, { crossOrigin: "anonymous" });

    // Handle delete key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Backspace" || e.key === "Delete") {
        const activeObjects = fabCanvas.getActiveObjects();
        if (activeObjects.length) {
          // Don't delete if we are actively editing text
          if (fabCanvas.getActiveObject() instanceof fabric.IText && (fabCanvas.getActiveObject() as fabric.IText).isEditing) {
            return;
          }
          activeObjects.forEach(obj => fabCanvas.remove(obj));
          fabCanvas.discardActiveObject();
          fabCanvas.renderAll();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      fabCanvas.dispose();
    };
  }, [imageUrl]);

  const addText = () => {
    if (!canvas) return;
    const text = new fabric.IText("Double click to edit", {
      left: canvas.width ? canvas.width / 2 : 100,
      top: canvas.height ? canvas.height / 2 : 100,
      originX: "center",
      originY: "center",
      fontFamily: "Inter, sans-serif",
      fill: "#1e293b", // slate-800
      fontSize: 40,
    });
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
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
    setSaving(true);
    
    // Deselect active objects to avoid saving bounding boxes
    canvas.discardActiveObject();
    canvas.renderAll();

    try {
      const dataUrl = canvas.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 1 // Adjust if higher resolution needed
      });

      // Convert Data URL to File
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], "edited-image.png", { type: "image/png" });

      await onSave(file);
    } catch (err) {
      console.error("Failed to save edited image", err);
      alert("Failed to save the image. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden max-w-5xl w-full max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Edit Photo</h2>
            <p className="text-xs text-slate-500 mt-0.5">Resize, rotate, and add text to your product image.</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar & Canvas area */}
        <div className="flex flex-1 bg-slate-100 min-h-[600px]">
          {/* Left Sidebar Toolbar */}
          <div className="w-24 bg-white border-r border-slate-200 flex flex-col items-center py-6 gap-6 shrink-0">
            <button 
              onClick={addText}
              className="flex flex-col items-center gap-2 p-3 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition group w-full px-2"
              title="Add Text"
            >
              <Type className="w-6 h-6" />
              <span className="text-xs font-semibold">Text</span>
            </button>
            <button 
              onClick={deleteSelected}
              className="flex flex-col items-center gap-2 p-3 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition group w-full px-2"
              title="Delete Selected"
            >
              <Trash2 className="w-6 h-6" />
              <span className="text-xs font-semibold">Delete</span>
            </button>
            
            <div className="mt-auto px-4 text-center">
              <p className="text-[10px] text-slate-400 leading-tight">
                Select an object to drag, resize, or rotate it.
              </p>
            </div>
          </div>

          {/* Canvas Container */}
          <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
            <div className="shadow-xl rounded-lg overflow-hidden bg-white ring-1 ring-slate-200/50">
              <canvas ref={canvasRef} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-white flex justify-end gap-3 shrink-0">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 hover:shadow-lg hover:-translate-y-0.5 transition disabled:opacity-50 disabled:pointer-events-none"
          >
            {saving ? (
              <>
                <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Edits
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
