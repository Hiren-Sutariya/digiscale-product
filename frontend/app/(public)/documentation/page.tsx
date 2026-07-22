"use client";

import LandingNavbar from "@/components/layout/LandingNavbar";

export default function DocumentationPage() {
  return (
    <>
      <LandingNavbar />

      <main className="flex-grow flex items-center justify-center py-32 px-6">
        <div className="text-center space-y-3">
          <h1 className="text-3xl sm:text-4xl font-black text-slate-800 tracking-tight leading-tight">
            API Documentation Coming Soon
          </h1>
          
          <p className="text-sm font-semibold text-slate-500 max-w-md mx-auto leading-relaxed">
            We are currently polishing our developer tools and REST API endpoints. Sandbox testing and native tokens will launch in our next major release cycle.
          </p>
        </div>
      </main>
    </>
  );
}
