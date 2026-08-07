"use client";

import Logo from "@/components/ui/logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full flex flex-col bg-gradient-to-br from-blue-50/50 via-slate-50 to-indigo-50/50 relative overflow-hidden">
      
      {/* Main content body centered */}
      <div className="flex-1 w-full flex items-center justify-center p-4 sm:p-6 my-6 sm:my-12 relative">
        {/* Background subtle glowing accent blobs */}
        <div className="absolute left-1/4 top-1/4 h-80 w-80 rounded-full bg-blue-400/10 blur-[100px] pointer-events-none" />
        <div className="absolute right-1/4 bottom-1/4 h-80 w-80 rounded-full bg-indigo-400/10 blur-[100px] pointer-events-none" />

        {/* Centered White Card with Logo */}
        <div className="relative z-10 w-full max-w-md bg-white rounded-3xl shadow-[0_20px_50px_rgba(8,112,184,0.06)] border border-slate-200/80 p-6 sm:p-10 flex flex-col gap-6">
          <div className="flex justify-center border-b border-slate-100 pb-5">
            <Logo href="/" />
          </div>
          <div>
            {children}
          </div>
        </div>
      </div>

    </div>
  );
}
