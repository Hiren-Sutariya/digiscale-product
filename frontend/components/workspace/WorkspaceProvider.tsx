"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { fabric } from "fabric";

import { WorkspaceProject, WorkspaceFolder } from "@/types/workspace";

interface WorkspaceContextType {
  canvas: fabric.Canvas | null;
  setCanvas: (canvas: fabric.Canvas) => void;
  activeObject: fabric.Object | null;
  canvasConfig: {
    width: number;
    height: number;
    backgroundType: 'color' | 'gradient' | 'image' | 'transparent';
    backgroundColor: string;
    backgroundGradient: {
      color1: string;
      color2: string;
      type: 'linear' | 'radial';
    };
    backgroundImage: string | null;
  };
  setCanvasConfig: React.Dispatch<React.SetStateAction<WorkspaceContextType['canvasConfig']>>;
  history: string[];
  historyIndex: number;
  saveHistoryState: () => void;
  undo: () => void;
  redo: () => void;
  zoom: number;
  setZoom: (zoom: number) => void;
  activeBatchIdx: number | null;
  setActiveBatchIdx: (idx: number | null) => void;
  batchImages: string[];
  setBatchImages: React.Dispatch<React.SetStateAction<string[]>>;
  projectName: string;
  setProjectName: React.Dispatch<React.SetStateAction<string>>;
  fitToScreenTrigger: number;
  triggerFitToScreen: () => void;
  activeTool: string | null;
  setActiveTool: React.Dispatch<React.SetStateAction<string | null>>;

  // Project management dashboard properties
  activeProjectId: string | null;
  setActiveProjectId: (id: string | null) => void;
  projects: WorkspaceProject[];
  folders: WorkspaceFolder[];
  loadProject: (id: string) => void;
  closeProject: () => void;
  createProject: (name: string, width: number, height: number) => void;
  renameProject: (id: string, name: string) => void;
  duplicateProject: (id: string) => void;
  deleteProject: (id: string) => void;
  toggleFavoriteProject: (id: string) => void;
  moveProjectToFolder: (id: string, folderId: string | null) => void;
  createFolder: (name: string) => void;
  deleteFolder: (id: string) => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | null>(null);

export const WorkspaceProvider = ({ children }: { children: React.ReactNode }) => {
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [activeObject, setActiveObject] = useState<fabric.Object | null>(null);
  
  const [canvasConfig, setCanvasConfig] = useState<WorkspaceContextType['canvasConfig']>({
    width: 1080,
    height: 1080,
    backgroundType: 'color',
    backgroundColor: "#ffffff",
    backgroundGradient: {
      color1: "#ff0000",
      color2: "#0000ff",
      type: "linear"
    },
    backgroundImage: null,
  });

  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [projects, setProjects] = useState<WorkspaceProject[]>([]);
  const [folders, setFolders] = useState<WorkspaceFolder[]>([]);

  // Load projects and folders on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedProjects = localStorage.getItem("digiscale_workspace_projects");
      if (savedProjects) {
        try {
          setProjects(JSON.parse(savedProjects));
        } catch (e) {
          console.error("Error parsing projects:", e);
        }
      }
      
      const savedFolders = localStorage.getItem("digiscale_workspace_folders");
      if (savedFolders) {
        try {
          setFolders(JSON.parse(savedFolders));
        } catch (e) {
          console.error("Error parsing folders:", e);
        }
      }
    }
  }, []);

  // Update helper that sets state and updates localStorage
  const updateProjectsInStorage = (updatedList: WorkspaceProject[]) => {
    setProjects(updatedList);
    localStorage.setItem("digiscale_workspace_projects", JSON.stringify(updatedList));
  };

  const updateFoldersInStorage = (updatedList: WorkspaceFolder[]) => {
    setFolders(updatedList);
    localStorage.setItem("digiscale_workspace_folders", JSON.stringify(updatedList));
  };

  const [historyState, setHistoryState] = useState<{ history: string[], historyIndex: number }>({ history: [], historyIndex: -1 });
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef<number>(-1);
  const [zoom, setZoom] = useState(1);
  const [activeBatchIdx, setActiveBatchIdx] = useState<number | null>(null);
  const [batchImages, setBatchImages] = useState<string[]>([]);
  const [projectName, setProjectName] = useState("Untitled Project");
  const [fitToScreenTrigger, setFitToScreenTrigger] = useState(0);
  const [activeTool, setActiveTool] = useState<string | null>("assets");
  const isHistoryUpdate = useRef(false);

  // Auto-save active project state when canvas, name, config, or batch changes
  useEffect(() => {
    if (!canvas || !activeProjectId || isHistoryUpdate.current) return;

    const timer = setTimeout(() => {
      let dataUrl = null;
      try {
        dataUrl = canvas.toDataURL({
          format: "jpeg",
          quality: 0.25,
          multiplier: 0.1,
        });
      } catch (e) {
        console.warn("Could not generate auto-save thumbnail:", e);
      }

      const saved = JSON.parse(localStorage.getItem("digiscale_workspace_projects") || "[]") as WorkspaceProject[];
      const updated = saved.map(p => {
        if (p.id === activeProjectId) {
          return {
            ...p,
            name: projectName,
            canvasConfig: canvasConfig,
            canvasData: JSON.stringify(canvas.toJSON()),
            batchImages: batchImages,
            thumbnail: dataUrl || p.thumbnail,
            updatedAt: new Date().toISOString()
          };
        }
        return p;
      });
      setProjects(updated);
      localStorage.setItem("digiscale_workspace_projects", JSON.stringify(updated));
    }, 1200);

    return () => clearTimeout(timer);
  }, [canvas, activeProjectId, projectName, canvasConfig, batchImages]);

  const createProject = (name: string, width: number, height: number) => {
    const newProj: WorkspaceProject = {
      id: Math.random().toString(36).substring(2, 9),
      name: name || "Untitled Design",
      canvasConfig: {
        width,
        height,
        backgroundType: "color",
        backgroundColor: "#ffffff",
        backgroundGradient: { color1: "#ff0000", color2: "#0000ff", type: "linear" },
        backgroundImage: null,
      },
      canvasData: JSON.stringify({ version: "5.3.0", objects: [] }),
      batchImages: [],
      thumbnail: null,
      folderId: null,
      isFavorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [newProj, ...projects];
    updateProjectsInStorage(updated);
    
    // Auto-load this newly created project
    loadProject(newProj.id);
  };

  const loadProject = (id: string) => {
    const target = projects.find(p => p.id === id);
    if (!target) return;

    isHistoryUpdate.current = true;
    setActiveProjectId(id);
    setProjectName(target.name);
    setCanvasConfig(target.canvasConfig);
    setBatchImages(target.batchImages);
    setActiveBatchIdx(null);
    setActiveTool("assets");

    if (canvas) {
      canvas.loadFromJSON(target.canvasData, () => {
        canvas.renderAll();
        isHistoryUpdate.current = false;
        
        historyRef.current = [JSON.stringify({
          canvasJson: target.canvasData,
          canvasConfig: target.canvasConfig
        })];
        historyIndexRef.current = 0;
        setHistoryState({
          history: historyRef.current,
          historyIndex: 0
        });
      });
    } else {
      isHistoryUpdate.current = false;
    }
  };

  const closeProject = () => {
    if (canvas && activeProjectId) {
      let dataUrl = null;
      try {
        dataUrl = canvas.toDataURL({
          format: "jpeg",
          quality: 0.25,
          multiplier: 0.1,
        });
      } catch (e) {
        console.warn("Could not generate thumbnail on close:", e);
      }

      const updated = projects.map(p => {
        if (p.id === activeProjectId) {
          return {
            ...p,
            name: projectName,
            canvasConfig: canvasConfig,
            canvasData: JSON.stringify(canvas.toJSON()),
            batchImages: batchImages,
            thumbnail: dataUrl || p.thumbnail,
            updatedAt: new Date().toISOString()
          };
        }
        return p;
      });
      updateProjectsInStorage(updated);
    }
    
    setActiveProjectId(null);
    setProjectName("Untitled Project");
    setBatchImages([]);
    setActiveBatchIdx(null);
    if (canvas) {
      canvas.clear();
      canvas.renderAll();
    }
  };

  const renameProject = (id: string, name: string) => {
    const updated = projects.map(p => p.id === id ? { ...p, name, updatedAt: new Date().toISOString() } : p);
    updateProjectsInStorage(updated);
    if (activeProjectId === id) {
      setProjectName(name);
    }
  };

  const duplicateProject = (id: string) => {
    const target = projects.find(p => p.id === id);
    if (!target) return;

    const dupProj: WorkspaceProject = {
      ...target,
      id: Math.random().toString(36).substring(2, 9),
      name: `${target.name} Copy`,
      isFavorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [dupProj, ...projects];
    updateProjectsInStorage(updated);
  };

  const deleteProject = (id: string) => {
    const updated = projects.filter(p => p.id !== id);
    updateProjectsInStorage(updated);
    if (activeProjectId === id) {
      setActiveProjectId(null);
    }
  };

  const toggleFavoriteProject = (id: string) => {
    const updated = projects.map(p => p.id === id ? { ...p, isFavorite: !p.isFavorite } : p);
    updateProjectsInStorage(updated);
  };

  const moveProjectToFolder = (id: string, folderId: string | null) => {
    const updated = projects.map(p => p.id === id ? { ...p, folderId, updatedAt: new Date().toISOString() } : p);
    updateProjectsInStorage(updated);
  };

  const createFolder = (name: string) => {
    const newFolder: WorkspaceFolder = {
      id: Math.random().toString(36).substring(2, 9),
      name,
      createdAt: new Date().toISOString(),
    };
    const updated = [...folders, newFolder];
    updateFoldersInStorage(updated);
  };

  const deleteFolder = (id: string) => {
    const updatedFolders = folders.filter(f => f.id !== id);
    updateFoldersInStorage(updatedFolders);
    const updatedProjects = projects.map(p => p.folderId === id ? { ...p, folderId: null } : p);
    updateProjectsInStorage(updatedProjects);
  };

  const triggerFitToScreen = () => setFitToScreenTrigger(prev => prev + 1);

  useEffect(() => {
    if (!canvas) return;

    const updateActiveObject = () => {
      setActiveObject(canvas.getActiveObject() || null);
    };

    canvas.on("selection:created", updateActiveObject);
    canvas.on("selection:updated", updateActiveObject);
    canvas.on("selection:cleared", updateActiveObject);
    
    // Save state on canvas init
    setTimeout(() => {
      if (historyIndexRef.current === -1) {
        saveHistoryState();
      }
    }, 100);

    const handleObjectChange = () => {
      if (isHistoryUpdate.current) return;
      saveHistoryState();
    };

    canvas.on("object:modified", handleObjectChange);
    canvas.on("object:added", handleObjectChange);
    canvas.on("object:removed", handleObjectChange);

    return () => {
      canvas.off("selection:created", updateActiveObject);
      canvas.off("selection:updated", updateActiveObject);
      canvas.off("selection:cleared", updateActiveObject);
      canvas.off("object:modified", handleObjectChange);
      canvas.off("object:added", handleObjectChange);
      canvas.off("object:removed", handleObjectChange);
    };
  }, [canvas]);

  // Debounced listener to auto-save canvasConfig changes in history
  const lastSavedConfigRef = useRef(canvasConfig);
  useEffect(() => {
    if (isHistoryUpdate.current) {
      lastSavedConfigRef.current = canvasConfig;
      return;
    }
    if (canvasConfig === lastSavedConfigRef.current) return;

    const timer = setTimeout(() => {
      saveHistoryState();
      lastSavedConfigRef.current = canvasConfig;
    }, 450); // 450ms debounce for sliders/inputs

    return () => clearTimeout(timer);
  }, [canvasConfig]);

  const saveHistoryState = () => {
    if (!canvas || isHistoryUpdate.current) return;
    
    const entry = {
      canvasJson: JSON.stringify(canvas.toJSON()),
      canvasConfig: canvasConfig
    };
    const json = JSON.stringify(entry);
    
    const currentIndex = historyIndexRef.current;
    const currentHistory = historyRef.current;
    
    const newHistory = currentHistory.slice(0, currentIndex + 1);
    newHistory.push(json);
    
    historyRef.current = newHistory;
    historyIndexRef.current = currentIndex + 1;
    
    setHistoryState({
      history: newHistory,
      historyIndex: currentIndex + 1
    });
  };

  const loadHistoryState = (index: number) => {
    if (!canvas || index < 0 || index >= historyRef.current.length) return;
    
    isHistoryUpdate.current = true;
    try {
      const parsed = JSON.parse(historyRef.current[index]);
      if (parsed && parsed.canvasJson && parsed.canvasConfig) {
        setCanvasConfig(parsed.canvasConfig);
        canvas.loadFromJSON(parsed.canvasJson, () => {
          canvas.renderAll();
          isHistoryUpdate.current = false;
        });
      } else {
        // Fallback for old format
        canvas.loadFromJSON(historyRef.current[index], () => {
          canvas.renderAll();
          isHistoryUpdate.current = false;
        });
      }
    } catch (e) {
      console.error("Error loading history state:", e);
      canvas.loadFromJSON(historyRef.current[index], () => {
        canvas.renderAll();
        isHistoryUpdate.current = false;
      });
    }
  };

  const undo = () => {
    const currentIndex = historyIndexRef.current;
    if (currentIndex > 0) {
      historyIndexRef.current = currentIndex - 1;
      setHistoryState(prev => ({ ...prev, historyIndex: currentIndex - 1 }));
      loadHistoryState(currentIndex - 1);
    }
  };

  const redo = () => {
    const currentIndex = historyIndexRef.current;
    if (currentIndex < historyRef.current.length - 1) {
      historyIndexRef.current = currentIndex + 1;
      setHistoryState(prev => ({ ...prev, historyIndex: currentIndex + 1 }));
      loadHistoryState(currentIndex + 1);
    }
  };

  return (
    <WorkspaceContext.Provider
      value={{
        canvas,
        setCanvas,
        activeObject,
        canvasConfig,
        setCanvasConfig,
        history: historyState.history,
        historyIndex: historyState.historyIndex,
        saveHistoryState,
        undo,
        redo,
        zoom,
        setZoom,
        activeBatchIdx,
        setActiveBatchIdx,
        batchImages,
        setBatchImages,
        projectName,
        setProjectName,
        fitToScreenTrigger,
        triggerFitToScreen,
        activeTool,
        setActiveTool,

        // Dashboard props
        activeProjectId,
        setActiveProjectId,
        projects,
        folders,
        loadProject,
        closeProject,
        createProject,
        renameProject,
        duplicateProject,
        deleteProject,
        toggleFavoriteProject,
        moveProjectToFolder,
        createFolder,
        deleteFolder,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
};
