"use client";

import React from "react";
import { Undo2, Redo2, ZoomIn, ZoomOut, Download, Trash2, Save, Hexagon, ArrowLeft } from "lucide-react";
import { useWorkspace } from "./WorkspaceProvider";

export function TopBar() {
  const { 
    canvas, undo, redo, zoom, setZoom, historyIndex, history, 
    projectName, setProjectName, triggerFitToScreen, closeProject 
  } = useWorkspace();

  const handleDownload = () => {
    if (!canvas) return;
    canvas.discardActiveObject();
    canvas.renderAll();
    const dataUrl = canvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 2
    });
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `${projectName.replace(/\s+/g, '-').toLowerCase() || 'workspace-design'}.png`;
    a.click();
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

  const handleSave = () => {
    if (!canvas) return;
    const json = JSON.stringify(canvas.toJSON());
    localStorage.setItem("digiscale_autosave", json);
    alert("Project saved successfully!");
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
          <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
        </button>
        <div className="w-px h-5 bg-slate-200 mx-1" />
        <input 
          type="text" 
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          className="text-[13px] font-bold text-slate-800 bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-100 rounded px-2 py-1 w-40"
        />
      </div>
      
      <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-100">
        <button 
          onClick={undo}
          disabled={!canUndo}
          className={`p-1.5 rounded-md transition active:scale-95 ${canUndo ? 'text-slate-700 hover:bg-white hover:shadow-sm' : 'text-slate-300 cursor-not-allowed'}`}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button 
          onClick={redo}
          disabled={!canRedo}
          className={`p-1.5 rounded-md transition active:scale-95 ${canRedo ? 'text-slate-700 hover:bg-white hover:shadow-sm' : 'text-slate-300 cursor-not-allowed'}`}
          title="Redo (Ctrl+Y)"
        >
          <Redo2 className="w-4 h-4" />
        </button>
        
        <div className="w-px h-4 bg-slate-200 mx-1" />

        <button 
          onClick={() => setZoom(Math.max(0.1, zoom - 0.1))}
          className="p-1.5 text-slate-700 hover:bg-white hover:shadow-sm rounded-md transition active:scale-95"
          title="Zoom Out"
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
          <option value="fit">Fit</option>
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
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={deleteSelected} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition active:scale-95" title="Delete Selected">
          <Trash2 className="w-4 h-4" />
        </button>

        <button onClick={handleSave} className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition active:scale-95">
          <Save className="w-4 h-4" />
          <span>Save</span>
        </button>

        <button onClick={handleDownload} className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition shadow-sm active:scale-95" title="Export Design">
          <Download className="w-4 h-4" />
          <span>Export</span>
        </button>
      </div>
    </div>
  );
}
