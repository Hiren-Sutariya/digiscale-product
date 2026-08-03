"use client";

import React, { useState } from "react";
import { useWorkspace } from "./WorkspaceProvider";
import { 
  Search, Plus, Folder, FolderPlus, Star, MoreVertical, 
  Trash2, Edit, Copy, Layout, X, ChevronRight, FolderMinus,
  ShoppingBag, Camera, Share2, MessageCircle, Globe, Shirt, Maximize
} from "lucide-react";

export const WorkspaceDashboard = () => {
  const {
    projects,
    folders,
    createProject,
    loadProject,
    renameProject,
    duplicateProject,
    deleteProject,
    toggleFavoriteProject,
    moveProjectToFolder,
    createFolder,
    deleteFolder,
  } = useWorkspace();

  // Navigation state: 'all' | 'favorites' | { type: 'folder'; folderId: string }
  const [currentTab, setCurrentTab] = useState<string>("all");
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);

  // Search input state
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("Untitled Design");
  const [newWidth, setNewWidth] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("digiscale_brand_kit");
      if (saved) {
        try {
          const bk = JSON.parse(saved);
          if (bk.canvasSize?.width) return bk.canvasSize.width;
        } catch (e) {}
      }
    }
    return 1080;
  });
  const [newHeight, setNewHeight] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("digiscale_brand_kit");
      if (saved) {
        try {
          const bk = JSON.parse(saved);
          if (bk.canvasSize?.height) return bk.canvasSize.height;
        } catch (e) {}
      }
    }
    return 1080;
  });

  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  // Template select state
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [confirmProjectName, setConfirmProjectName] = useState("");

  // Dropdown states (id of project currently showing action menu)
  const [activeMenuProjectId, setActiveMenuProjectId] = useState<string | null>(null);
  const [activeMoveFolderProjectId, setActiveMoveFolderProjectId] = useState<string | null>(null);

  // Template presets
  const PRESETS = [
    { name: "Square Post (1:1)", w: 1080, h: 1080, desc: "Instagram, Facebook" },
    { name: "Story (9:16)", w: 1080, h: 1920, desc: "Instagram, TikTok" },
    { name: "YouTube Thumbnail (16:9)", w: 1280, h: 720, desc: "YouTube Thumbnail" },
    { name: "Landscape Link (1.91:1)", w: 1200, h: 630, desc: "Website Banner" },
  ];

  const DASHBOARD_TEMPLATES = [
    { name: "Amazon Product",   category: "amazon",    w: 1000, h: 1000, color: "#FF9900", badge: "Amazon", icon: "ShoppingBag" },
    { name: "Flipkart Product", category: "flipkart",  w: 1080, h: 1080, color: "#2874F0", badge: "Flipkart", icon: "ShoppingBag" },
    { name: "Meesho Product",   category: "meesho",    w: 1080, h: 1080, color: "#F43397", badge: "Meesho", icon: "Shirt" },
    { name: "Shopify Product",  category: "shopify",   w: 2048, h: 2048, color: "#96BF48", badge: "Shopify", icon: "Globe" },
    { name: "Instagram Post",   category: "instagram", w: 1080, h: 1080, color: "#E1306C", badge: "Instagram", icon: "Camera" },
    { name: "Facebook Post",    category: "facebook",  w: 1200, h: 630,  color: "#1877F2", badge: "Facebook", icon: "Share2" },
    { name: "WhatsApp Catalog", category: "whatsapp",  w: 1080, h: 1080, color: "#25D366", badge: "WhatsApp", icon: "MessageCircle" },
    { name: "Custom Canvas",    category: "custom",    w: 1080, h: 1080, color: "#6366F1", badge: "Custom", icon: "Maximize" },
  ];

  // Filtering projects
  const filteredProjects = projects.filter(p => {
    // Tab filter
    if (currentTab === "favorites" && !p.isFavorite) return false;
    if (currentTab === "folder" && p.folderId !== activeFolderId) return false;
    if (currentTab === "all" && p.folderId !== null) return false; // Hide projects that are in folders on 'All Designs' root view

    // Search query filter
    if (searchQuery.trim() !== "") {
      return p.name.toLowerCase().includes(searchQuery.toLowerCase());
    }

    return true;
  });

  const handleCreateProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createProject(newProjectName, newWidth, newHeight);
    setIsCreateModalOpen(false);
    // Reset values
    setNewProjectName("Untitled Design");
    setNewWidth(1080);
    setNewHeight(1080);
  };

  const handleCreateFolderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFolderName.trim() === "") return;
    createFolder(newFolderName.trim());
    setNewFolderName("");
    setIsFolderModalOpen(false);
  };

  const renderTemplateIcon = (iconName: string, color: string, sizeClass = "w-4 h-4") => {
    const props = { className: sizeClass, style: { color } };
    switch (iconName) {
      case "ShoppingBag": return <ShoppingBag {...props} />;
      case "Shirt": return <Shirt {...props} />;
      case "Globe": return <Globe {...props} />;
      case "Camera": return <Camera {...props} />;
      case "Share2": return <Share2 {...props} />;
      case "MessageCircle": return <MessageCircle {...props} />;
      case "Maximize": return <Maximize {...props} />;
      default: return <Layout {...props} />;
    }
  };

  const handleTemplateClick = (tpl: any) => {
    if (tpl.category === "custom") {
      setIsCreateModalOpen(true);
    } else {
      setSelectedTemplate(tpl);
      setConfirmProjectName(`Untitled ${tpl.name}`);
    }
  };

  const handleConfirmTemplateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate) return;
    createProject(confirmProjectName.trim(), selectedTemplate.w, selectedTemplate.h);
    setSelectedTemplate(null);
    setConfirmProjectName("");
  };

  return (
    <div className="flex flex-1 overflow-hidden h-[calc(100vh-80px)] bg-slate-50">
      {/* Sidebar Panel */}
      <div className="w-64 border-r border-slate-200 bg-white flex flex-col justify-between shrink-0">
        <div className="p-4 space-y-6 overflow-y-auto">
          {/* Header title */}
          <div>
            <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Layout className="w-5 h-5 text-blue-600" />
              Workspace Designs
            </h1>
            <p className="text-[11px] text-slate-400 mt-0.5">Manage your graphic designs</p>
          </div>

          {/* Navigation Links */}
          <div className="space-y-1">
            <button
              onClick={() => {
                setCurrentTab("all");
                setActiveFolderId(null);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                currentTab === "all"
                  ? "bg-blue-50 text-blue-600"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Layout className="w-4 h-4" />
              All Designs
            </button>

            <button
              onClick={() => {
                setCurrentTab("favorites");
                setActiveFolderId(null);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                currentTab === "favorites"
                  ? "bg-blue-50 text-blue-600"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Star className="w-4 h-4" />
              Favorite Designs
            </button>
          </div>

          {/* Folders Section */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between px-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Folders</span>
              <button 
                onClick={() => setIsFolderModalOpen(true)}
                className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800 transition cursor-pointer"
                title="Create New Folder"
              >
                <FolderPlus className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              {folders.map(f => (
                <div key={f.id} className="group flex items-center justify-between rounded-xl hover:bg-slate-50">
                  <button
                    onClick={() => {
                      setCurrentTab("folder");
                      setActiveFolderId(f.id);
                    }}
                    className={`flex-1 flex items-center gap-3 px-3 py-2.5 text-xs font-semibold transition text-left cursor-pointer ${
                      currentTab === "folder" && activeFolderId === f.id
                        ? "text-blue-600 font-bold"
                        : "text-slate-600 group-hover:text-slate-900"
                    }`}
                  >
                    <Folder className={`w-4 h-4 ${currentTab === "folder" && activeFolderId === f.id ? "text-blue-600 fill-blue-100" : "text-slate-400 group-hover:text-slate-500"}`} />
                    <span className="truncate max-w-[130px]">{f.name}</span>
                  </button>
                  <button 
                    onClick={() => {
                      if (confirm("Are you sure you want to delete this folder? All projects inside will be moved to root.")) {
                        deleteFolder(f.id);
                        if (activeFolderId === f.id) {
                          setCurrentTab("all");
                          setActiveFolderId(null);
                        }
                      }
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 mr-2 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                    title="Delete Folder"
                  >
                    <FolderMinus className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {folders.length === 0 && (
                <div className="px-3 py-4 text-center border border-dashed border-slate-200 rounded-xl">
                  <Folder className="w-6 h-6 text-slate-300 mx-auto" />
                  <p className="text-[10px] text-slate-400 mt-1">No folders created yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="text-[10px] text-slate-400 text-center font-medium">Digiscale Workspace Dashboard v1.0</div>
        </div>
      </div>

      {/* Main Panel */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header bar */}
        <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-8 gap-4 shrink-0">
          {/* Search bar */}
          <div className="relative max-w-md w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search designs by title..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 transition"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Action button */}
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-sm hover:shadow active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Create New Design
          </button>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6.5xl mx-auto space-y-6">
            
            {/* Template Presets Bar */}
            {currentTab === "all" && searchQuery === "" && (
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Layout className="w-4 h-4 text-blue-600" /> Start with a Template Preset
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Select a pre-sized white template to quickly launch a new graphic design project</p>
                  </div>
                </div>

                {/* Horizontal Scroll Bar */}
                <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin">
                  {DASHBOARD_TEMPLATES.map(tpl => {
                    return (
                      <button
                        key={tpl.name}
                        onClick={() => handleTemplateClick(tpl)}
                        className="flex-shrink-0 w-36 bg-slate-50 hover:bg-blue-50/10 border border-slate-200 hover:border-blue-500 rounded-2xl p-4 text-center transition active:scale-[0.97] cursor-pointer flex flex-col items-center justify-center gap-3 h-36"
                      >
                        {/* Centered Brand Icon */}
                        <div 
                          className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm"
                          style={{ backgroundColor: tpl.color + "12", border: `1.5px solid ${tpl.color}25` }}
                        >
                          {renderTemplateIcon(tpl.icon, tpl.color, "w-6 h-6")}
                        </div>
                        
                        {/* Text info */}
                        <div className="space-y-0.5">
                          <div className="text-[10px] font-black text-slate-700 leading-snug">{tpl.name}</div>
                          <div className="text-[9px] font-medium text-slate-400">{tpl.w} × {tpl.h} px</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Folder Header Banner */}
            {currentTab === "folder" && (
              <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Folder className="w-6 h-6 fill-blue-100" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800">
                    {folders.find(f => f.id === activeFolderId)?.name || "Folder"}
                  </h2>
                  <p className="text-xs text-slate-400">
                    Showing projects categorized in this folder
                  </p>
                </div>
              </div>
            )}

            {/* Folder shortcuts on All Designs tab */}
            {currentTab === "all" && searchQuery === "" && folders.length > 0 && (
              <div className="space-y-2.5">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Folders</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {folders.map(f => {
                    const count = projects.filter(p => p.folderId === f.id).length;
                    return (
                      <button
                        key={f.id}
                        onClick={() => {
                          setCurrentTab("folder");
                          setActiveFolderId(f.id);
                        }}
                        className="group bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md/5 rounded-2xl p-4 transition flex items-center justify-between text-left cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition flex items-center justify-center">
                            <Folder className="w-5 h-5 group-hover:fill-blue-100" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-700 group-hover:text-blue-600 truncate max-w-[120px]">{f.name}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">{count} {count === 1 ? "design" : "designs"}</div>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Projects list */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {currentTab === "all" ? "Designs" : currentTab === "favorites" ? "Favorite Designs" : "Folder Designs"}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredProjects.map(p => (
                  <div 
                    key={p.id} 
                    className="group bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col relative"
                  >
                    {/* Live Thumbnail Card */}
                    <div 
                      onClick={() => loadProject(p.id)}
                      className="h-44 bg-slate-50 relative flex items-center justify-center cursor-pointer overflow-hidden border-b border-slate-100"
                    >
                      {p.thumbnail ? (
                        <img src={p.thumbnail} alt={p.name} className="max-w-full max-h-full object-contain" />
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-1.5">
                          <div className="w-10 h-10 rounded-xl bg-[radial-gradient(#cbd5e1_1.5px,transparent_1.5px)] [background-size:5px_5px] border border-slate-200 bg-white" />
                          <span className="text-[9px] font-semibold text-slate-400">Empty canvas preview</span>
                        </div>
                      )}

                      {/* Dimensions Badge */}
                      <span className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-black/60 text-[9px] font-semibold text-white rounded backdrop-blur-sm">
                        {p.canvasConfig.width} × {p.canvasConfig.height} px
                      </span>
                    </div>

                    {/* Star Favorite Button */}
                    <button
                      onClick={() => toggleFavoriteProject(p.id)}
                      className={`absolute top-2 left-2 p-1.5 rounded-lg transition backdrop-blur-md cursor-pointer ${
                        p.isFavorite 
                          ? "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20" 
                          : "bg-black/40 text-white hover:bg-black/60 opacity-0 group-hover:opacity-100"
                      }`}
                    >
                      <Star className={`w-3.5 h-3.5 ${p.isFavorite ? "fill-amber-500" : ""}`} />
                    </button>

                    {/* Meta Dropdown Menu Button */}
                    <div className="absolute top-2 right-2 z-20">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuProjectId(activeMenuProjectId === p.id ? null : p.id);
                          setActiveMoveFolderProjectId(null);
                        }}
                        className="p-1.5 bg-white border border-slate-100 hover:border-slate-200 text-slate-500 hover:text-slate-800 rounded-lg shadow-sm cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity active:scale-95"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>

                      {/* Dropdown Options Popup */}
                      {activeMenuProjectId === p.id && (
                        <div className="absolute right-0 mt-1 w-44 bg-white border border-slate-200/80 rounded-xl shadow-xl py-1.5 text-xs text-slate-700 animate-in fade-in slide-in-from-top-1 duration-150">
                          <button
                            onClick={() => {
                              const newName = prompt("Enter new project name:", p.name);
                              if (newName && newName.trim() !== "") {
                                renameProject(p.id, newName.trim());
                              }
                              setActiveMenuProjectId(null);
                            }}
                            className="w-full text-left px-3.5 py-2 hover:bg-slate-50 transition font-medium flex items-center gap-2 cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5 text-slate-400" /> Rename
                          </button>
                          
                          <button
                            onClick={() => {
                              duplicateProject(p.id);
                              setActiveMenuProjectId(null);
                            }}
                            className="w-full text-left px-3.5 py-2 hover:bg-slate-50 transition font-medium flex items-center gap-2 cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5 text-slate-400" /> Duplicate
                          </button>

                          <button
                            onClick={() => {
                              setActiveMoveFolderProjectId(p.id);
                            }}
                            className="w-full text-left px-3.5 py-2 hover:bg-slate-50 transition font-medium flex items-center justify-between cursor-pointer"
                          >
                            <span className="flex items-center gap-2">
                              <Folder className="w-3.5 h-3.5 text-slate-400" /> Move to Folder
                            </span>
                            <ChevronRight className="w-3 h-3 text-slate-400" />
                          </button>

                          <div className="border-t border-slate-100 my-1" />

                          <button
                            onClick={() => {
                              if (confirm("Are you sure you want to delete this project? This cannot be undone.")) {
                                deleteProject(p.id);
                              }
                              setActiveMenuProjectId(null);
                            }}
                            className="w-full text-left px-3.5 py-2 hover:bg-rose-50 text-rose-600 transition font-bold flex items-center gap-2 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-500" /> Delete Project
                          </button>
                        </div>
                      )}

                      {/* Nested Folders Selection Panel */}
                      {activeMoveFolderProjectId === p.id && (
                        <div className="absolute right-48 mt-1 w-44 bg-white border border-slate-200/80 rounded-xl shadow-xl py-1.5 text-xs text-slate-700 max-h-56 overflow-y-auto">
                          <div className="px-3 py-1 text-[9px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">Select Folder</div>
                          <button
                            onClick={() => {
                              moveProjectToFolder(p.id, null);
                              setActiveMoveFolderProjectId(null);
                              setActiveMenuProjectId(null);
                            }}
                            className={`w-full text-left px-3 py-2 hover:bg-slate-50 transition flex items-center gap-2 cursor-pointer ${p.folderId === null ? "text-blue-600 font-bold" : ""}`}
                          >
                            <Layout className="w-3.5 h-3.5" /> Root Directory
                          </button>
                          {folders.map(f => (
                            <button
                              key={f.id}
                              onClick={() => {
                                moveProjectToFolder(p.id, f.id);
                                setActiveMoveFolderProjectId(null);
                                setActiveMenuProjectId(null);
                              }}
                              className={`w-full text-left px-3 py-2 hover:bg-slate-50 transition flex items-center gap-2 cursor-pointer ${p.folderId === f.id ? "text-blue-600 font-bold" : ""}`}
                            >
                              <Folder className="w-3.5 h-3.5" /> {f.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Click outside menus to close */}
                    {(activeMenuProjectId || activeMoveFolderProjectId) && (
                      <div className="fixed inset-0 z-10" onClick={() => {
                        setActiveMenuProjectId(null);
                        setActiveMoveFolderProjectId(null);
                      }} />
                    )}

                    {/* Info Section */}
                    <div className="p-4 flex flex-col justify-between flex-1 gap-1">
                      <button 
                        onClick={() => loadProject(p.id)}
                        className="text-xs font-bold text-slate-700 hover:text-blue-600 text-left truncate hover:underline outline-none cursor-pointer"
                      >
                        {p.name}
                      </button>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                        <span>
                          {p.folderId ? `In ${folders.find(f => f.id === p.folderId)?.name}` : "Root Directory"}
                        </span>
                        <span>
                          {new Date(p.updatedAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric"
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Empty State */}
                {filteredProjects.length === 0 && (
                  <div className="col-span-full py-16 bg-white border border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-center p-6">
                    <div className="w-16 h-16 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mb-4">
                      <Layout className="w-8 h-8" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-700">No designs found</h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-[280px]">
                      {searchQuery 
                        ? "We couldn't find any designs matching your search term."
                        : currentTab === "favorites"
                          ? "Star your favorite designs to see them grouped in this tab."
                          : "Create your first canvas template project to get started."}
                    </p>
                    <button
                      onClick={() => setIsCreateModalOpen(true)}
                      className="mt-4 flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm active:scale-95 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Create New Design
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* CREATE PROJECT MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">Create New Canvas Design</h3>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProjectSubmit} className="p-6 space-y-4">
              {/* Name */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Design Title</label>
                <input
                  type="text"
                  required
                  value={newProjectName}
                  onChange={e => setNewProjectName(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 transition"
                  placeholder="e.g. Summer Promo Sale Banner"
                />
              </div>

              {/* Dimensions Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Width (px)</label>
                  <input
                    type="number"
                    min={100}
                    max={5000}
                    required
                    value={newWidth}
                    onChange={e => setNewWidth(Number(e.target.value))}
                    className="w-full text-xs border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 transition"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Height (px)</label>
                  <input
                    type="number"
                    min={100}
                    max={5000}
                    required
                    value={newHeight}
                    onChange={e => setNewHeight(Number(e.target.value))}
                    className="w-full text-xs border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 transition"
                  />
                </div>
              </div>

              {/* Preset Templates Grid */}
              <div className="space-y-2 pt-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Or select template preset</span>
                <div className="grid grid-cols-2 gap-2">
                  {PRESETS.map(p => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => {
                        setNewWidth(p.w);
                        setNewHeight(p.h);
                      }}
                      className="p-3 text-left border border-slate-200 hover:border-blue-500 hover:bg-blue-50/20 rounded-2xl transition cursor-pointer"
                    >
                      <div className="text-[11px] font-bold text-slate-700">{p.name}</div>
                      <div className="text-[9px] text-slate-400 mt-0.5">{p.w} × {p.h} px</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow active:scale-[0.98] cursor-pointer"
                >
                  Start Designing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE FOLDER MODAL */}
      {isFolderModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">Create New Folder</h3>
              <button 
                onClick={() => setIsFolderModalOpen(false)}
                className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateFolderSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Folder Name</label>
                <input
                  type="text"
                  required
                  value={newFolderName}
                  onChange={e => setNewFolderName(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 transition"
                  placeholder="e.g. Social Campaigns"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow active:scale-[0.98] cursor-pointer"
                >
                  Create Folder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM TEMPLATE MODAL */}
      {selectedTemplate && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">New {selectedTemplate.name}</h3>
              <button 
                onClick={() => setSelectedTemplate(null)}
                className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmTemplateSubmit} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Design Title</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={confirmProjectName}
                  onChange={e => setConfirmProjectName(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 transition"
                  placeholder="e.g. Amazon Product Listing Banner"
                />
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-[10px] text-slate-500 space-y-1">
                <div className="flex justify-between"><span className="font-medium">Category:</span> <span className="font-bold text-slate-700 uppercase">{selectedTemplate.badge}</span></div>
                <div className="flex justify-between"><span className="font-medium">Dimensions:</span> <span className="font-bold text-slate-700">{selectedTemplate.w} × {selectedTemplate.h} px</span></div>
                <div className="flex justify-between"><span className="font-medium">Canvas Color:</span> <span className="font-bold text-slate-700">White (#ffffff)</span></div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedTemplate(null)}
                  className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow active:scale-[0.98] cursor-pointer"
                >
                  Start Designing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
