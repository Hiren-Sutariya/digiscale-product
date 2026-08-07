// "use client";
// 
// import React from "react";
// import { WorkspaceProvider, useWorkspace } from "@/components/workspace/WorkspaceProvider";
// import { WorkspaceDashboard } from "@/components/workspace/WorkspaceDashboard";
// import { TopBar } from "@/components/workspace/TopBar";
// import { Sidebar } from "@/components/workspace/Sidebar";
// import { PropertiesPanel } from "@/components/workspace/PropertiesPanel";
// import { CanvasArea } from "@/components/workspace/CanvasArea";
// 
// function WorkspaceContent() {
//   const { activeProjectId } = useWorkspace();
// 
//   if (!activeProjectId) {
//     return <WorkspaceDashboard />;
//   }
// 
//   return (
//     <div className="flex flex-col h-[calc(100vh-80px)] overflow-hidden bg-slate-50">
//       <TopBar />
//       <div className="flex flex-1 overflow-hidden">
//         <Sidebar />
//         <CanvasArea />
//         <PropertiesPanel />
//       </div>
//     </div>
//   );
// }
// 
// export default function WorkspacePage() {
//   return (
//     <WorkspaceProvider>
//       <WorkspaceContent />
//     </WorkspaceProvider>
//   );
// }

export default function WorkspacePage() {
  return null;
}
