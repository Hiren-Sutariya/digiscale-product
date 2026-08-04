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

class WorkspaceIndexedDB {
  private dbName = "digiscale_workspace_db";
  private storeName = "projects";
  private db: IDBDatabase | null = null;

  init(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof window === "undefined" || !window.indexedDB) {
        return reject("IndexedDB is not supported on this platform");
      }
      const request = indexedDB.open(this.dbName, 1);
      
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: "id" });
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }

  getAll(): Promise<WorkspaceProject[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) return resolve([]);
      const transaction = this.db.transaction(this.storeName, "readonly");
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  saveAll(projects: WorkspaceProject[]): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject("Database not initialized");
      const transaction = this.db.transaction(this.storeName, "readwrite");
      const store = transaction.objectStore(this.storeName);
      
      const clearRequest = store.clear();
      clearRequest.onsuccess = () => {
        if (projects.length === 0) {
          resolve();
          return;
        }
        let count = 0;
        let errored = false;
        projects.forEach(p => {
          const addRequest = store.put(p);
          addRequest.onsuccess = () => {
            count++;
            if (count === projects.length && !errored) {
              resolve();
            }
          };
          addRequest.onerror = () => {
            if (!errored) {
              errored = true;
              reject(addRequest.error);
            }
          };
        });
      };
      clearRequest.onerror = () => reject(clearRequest.error);
    });
  }
}

const dbHelper = new WorkspaceIndexedDB();

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

  // Update helper that sets state and updates IndexedDB / LocalStorage backup
  const updateProjectsInStorage = async (updatedList: WorkspaceProject[]) => {
    setProjects(updatedList);
    try {
      await dbHelper.saveAll(updatedList);
    } catch (e) {
      console.error("IndexedDB save failed:", e);
    }
    
    // Fallback/minimized localStorage backup to prevent QuotaExceededError
    try {
      const minimized = updatedList.map(p => ({
        ...p,
        canvasData: p.canvasData.length > 30000 ? JSON.stringify({ version: "5.3.0", objects: [] }) : p.canvasData,
        batchImages: p.batchImages.length > 0 ? [] : p.batchImages,
        thumbnail: p.thumbnail && p.thumbnail.length > 30000 ? null : p.thumbnail
      }));
      localStorage.setItem("digiscale_workspace_projects", JSON.stringify(minimized));
    } catch (err) {
      console.warn("LocalStorage backup failed:", err);
    }
  };

  // Load projects and folders on mount
  useEffect(() => {
    const initAndLoad = async () => {
      let loaded: WorkspaceProject[] = [];
      try {
        await dbHelper.init();
        loaded = await dbHelper.getAll();
        
        // Migrate legacy projects from localStorage to IndexedDB if needed
        if (loaded.length === 0 && typeof window !== "undefined") {
          const savedProjects = localStorage.getItem("digiscale_workspace_projects");
          if (savedProjects) {
            try {
              const parsed = JSON.parse(savedProjects) as WorkspaceProject[];
              if (parsed.length > 0) {
                await dbHelper.saveAll(parsed);
                loaded = parsed;
              }
            } catch (e) {
              console.error("Error migrating projects:", e);
            }
          }
        }
        
        loaded.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        setProjects(loaded);
      } catch (err) {
        console.error("Failed to initialize IndexedDB:", err);
        if (typeof window !== "undefined") {
          const savedProjects = localStorage.getItem("digiscale_workspace_projects");
          if (savedProjects) {
            try {
              const parsed = JSON.parse(savedProjects) as WorkspaceProject[];
              setProjects(parsed);
              loaded = parsed;
            } catch (e) {
              console.error("Error parsing projects fallback:", e);
            }
          }
        }
      }
      
      if (typeof window !== "undefined") {
        const savedFolders = localStorage.getItem("digiscale_workspace_folders");
        if (savedFolders) {
          try {
            setFolders(JSON.parse(savedFolders));
          } catch (e) {
            console.error("Error parsing folders:", e);
          }
        }

        // Restore active project ID on mount if it exists
        const savedActiveId = localStorage.getItem("digiscale_active_project_id");
        if (savedActiveId && loaded.some(p => p.id === savedActiveId)) {
          const target = loaded.find(p => p.id === savedActiveId)!;
          setActiveProjectId(savedActiveId);
          setProjectName(target.name);
          setCanvasConfig(target.canvasConfig);
          setBatchImages(target.batchImages);
          setActiveBatchIdx(null);
          setActiveTool("assets");
        }
      }
    };

    initAndLoad();
  }, []);

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

  // Sync projects list to a ref to avoid dependency loop in auto-save Effect
  const projectsRef = useRef(projects);
  useEffect(() => {
    projectsRef.current = projects;
  }, [projects]);

  const loadedProjectIdRef = useRef<string | null>(null);

  // Sync activeProjectId to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (activeProjectId) {
        localStorage.setItem("digiscale_active_project_id", activeProjectId);
      } else {
        localStorage.removeItem("digiscale_active_project_id");
      }
    }
  }, [activeProjectId]);

  // Load project data when canvas becomes available/changes and a project is active
  useEffect(() => {
    if (!canvas || !activeProjectId || loadedProjectIdRef.current === activeProjectId) return;
    const target = projects.find(p => p.id === activeProjectId);
    if (!target) return;

    loadedProjectIdRef.current = activeProjectId;
    isHistoryUpdate.current = true;
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
  }, [canvas, activeProjectId, projects]);

  // Auto-save active project state when canvas, name, config, or batch changes
  useEffect(() => {
    if (!canvas || !activeProjectId || isHistoryUpdate.current) return;

    const timer = setTimeout(async () => {
      let dataUrl = null;
      try {
        const canvasWidth = canvas.getWidth ? canvas.getWidth() : 0;
        const multiplier = canvasWidth > 0 ? (360 / canvasWidth) : 0.25;
        dataUrl = canvas.toDataURL({
          format: "jpeg",
          quality: 0.35,
          multiplier: multiplier,
        });
      } catch (e) {
        console.warn("Could not generate auto-save thumbnail:", e);
      }

      const updated = projectsRef.current.map(p => {
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
      
      await updateProjectsInStorage(updated);
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
    loadedProjectIdRef.current = id;

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
        const canvasWidth = canvas.getWidth ? canvas.getWidth() : 0;
        const multiplier = canvasWidth > 0 ? (360 / canvasWidth) : 0.25;
        dataUrl = canvas.toDataURL({
          format: "jpeg",
          quality: 0.35,
          multiplier: multiplier,
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
    loadedProjectIdRef.current = null;
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
