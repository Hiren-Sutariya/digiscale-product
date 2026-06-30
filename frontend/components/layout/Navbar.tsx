import React from "react";

export default function Navbar() {
  return (
    <header className="w-full border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Logo & Title */}
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            DigiScale Product Studio
          </h1>
          <p className="text-sm text-gray-500">
            AI Powered Product Photo Editor
          </p>
        </div>

        {/* Version */}
        <div className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
          v1.0 MVP
        </div>
      </div>
    </header>
  );
}