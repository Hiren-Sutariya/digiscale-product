"use client";

import React from "react";
import Link from "next/link";
import Logo from "@/components/ui/logo";
import { 
  Phone, 
  Warehouse, 
  Truck, 
  Package, 
  FileText,
  Sparkles,
  Users,
  Building,
  Target
} from "lucide-react";

export default function AboutPage() {
  const [isScrolled, setIsScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header / Navbar */}
      <header className={`fixed z-50 left-1/2 -translate-x-1/2 w-full transition-all duration-500 ease-in-out backdrop-blur-sm flex items-center justify-between ${
        isScrolled 
          ? "top-4 w-[92%] max-w-[1400px] h-14 bg-gradient-to-r from-slate-50/95 via-white/95 to-blue-50/95 border border-blue-200/80 rounded-full shadow-xl shadow-slate-200/50" 
          : "top-0 w-full h-20 bg-slate-50/90 border-b border-slate-200/60 rounded-none shadow-sm shadow-slate-100/50"
      }`}>
        <div className={`mx-auto max-w-[1400px] w-full h-full flex items-center justify-between transition-all duration-300 ${
          isScrolled ? "px-8" : "px-6"
        }`}>
          {/* Logo */}
          <div className={`flex items-center flex-shrink-0 transition-all duration-300 origin-left ${
            isScrolled ? "scale-90" : "scale-100"
          }`}>
            <Logo href="/" />
          </div>

          {/* Center Links */}
          <nav className="hidden md:flex items-center justify-center gap-1 flex-1">
            <a href="/#features" className={`text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl px-4 transition-all duration-300 cursor-pointer ${
              isScrolled ? "py-1.5" : "py-2.5"
            }`}>
              Features
            </a>
            <a href="/#remove-bg-tool" className={`text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl px-4 transition-all duration-300 cursor-pointer ${
              isScrolled ? "py-1.5" : "py-2.5"
            }`}>
              Remove BG
            </a>
            <a href="/#pricing" className={`text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl px-4 transition-all duration-300 cursor-pointer ${
              isScrolled ? "py-1.5" : "py-2.5"
            }`}>
              Pricing
            </a>
            <Link href="/about" className={`text-sm font-semibold text-blue-600 bg-blue-50 rounded-xl px-4 transition-all duration-300 cursor-pointer ${
              isScrolled ? "py-1.5" : "py-2.5"
            }`}>
              About
            </Link>
            <Link href="/contact" className={`text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl px-4 transition-all duration-300 cursor-pointer ${
              isScrolled ? "py-1.5" : "py-2.5"
            }`}>
              Contact
            </Link>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2.5 w-64 flex-shrink-0 justify-end">
            <Link href="/login" className={`flex items-center justify-center rounded-xl border border-slate-200 bg-white font-semibold text-slate-600 transition-all duration-300 hover:bg-slate-50 cursor-pointer shadow-sm ${
              isScrolled ? "h-9 px-3.5 text-xs" : "h-10 px-4 text-sm"
            }`}>
              Login
            </Link>
            <Link href="/signup" className={`flex items-center justify-center rounded-xl bg-blue-600 font-semibold text-white transition-all duration-300 hover:bg-blue-700 active:scale-[0.98] cursor-pointer shadow-sm shadow-blue-500/10 ${
              isScrolled ? "h-9 px-3.5 text-xs" : "h-10 px-4 text-sm"
            }`}>
              Sign Up
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow bg-white border-b border-slate-200 pt-32 pb-24">
        {/* Intro Hero */}
        <div className="max-w-5xl mx-auto px-6 text-center space-y-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Introducing DigiScale</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-black text-slate-950 tracking-tight max-w-3xl mx-auto leading-tight">
            Bridging the Gap Between Digital Design & Physical Logistics
          </h1>
          
          <p className="text-lg text-slate-500 font-semibold max-w-2xl mx-auto leading-relaxed">
            DigiScale Product Studio is a unified software console engineered for B2B manufacturers, warehouse coordinators, and modern retail brands to automate design operations.
          </p>
        </div>

        {/* Dynamic Grid Background Section */}
        <div className="max-w-6xl mx-auto px-6 mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Mission Card */}
          <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200/60 hover:shadow-md transition duration-300 space-y-4">
            <div className="p-3 bg-blue-500/10 text-blue-600 rounded-2xl w-fit">
              <Target className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Our Mission</h3>
            <p className="text-sm font-semibold text-slate-500 leading-relaxed">
              To simplify warehouse catalog planning by unifying image background removals, custom design layout coordinates, and instant quotation outputs under one seamless ecosystem.
            </p>
          </div>

          {/* Tech Stack Card */}
          <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200/60 hover:shadow-md transition duration-300 space-y-4">
            <div className="p-3 bg-amber-500/10 text-amber-600 rounded-2xl w-fit">
              <Building className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Gujarat Roots</h3>
            <p className="text-sm font-semibold text-slate-500 leading-relaxed">
              Based in India (Gujarat), DigiScale Infotech works directly with textile, apparel, and hardware manufacturers to build digital assets that improve global logistics efficiency.
            </p>
          </div>

          {/* Culture Card */}
          <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200/60 hover:shadow-md transition duration-300 space-y-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-2xl w-fit">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Our Values</h3>
            <p className="text-sm font-semibold text-slate-500 leading-relaxed">
              We value clarity, data privacy, and robust design precision. Every pixel mapped, shelf coordinated, or rate generated is focused on scaling your operational output.
            </p>
          </div>
        </div>

        {/* Highlight Section: The Core Product Pillars */}
        <div className="max-w-5xl mx-auto px-6 mt-24">
          <div className="text-center space-y-3 mb-16">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              The 3 Pillars of DigiScale
            </h2>
            <p className="text-sm font-semibold text-slate-400">
              Three modular tools working as one powerful system.
            </p>
          </div>

          <div className="space-y-12">
            {/* Pillar 1 */}
            <div className="flex flex-col md:flex-row gap-8 items-center border-b border-slate-100 pb-10">
              <div className="p-5 bg-blue-500/5 text-blue-600 rounded-3xl shrink-0">
                <Sparkles className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h4 className="text-xl font-bold text-slate-900">1. AI Background Removal & Graphics</h4>
                <p className="text-sm font-semibold text-slate-500 leading-relaxed">
                  Upload raw product photos and clean them instantly using AI background removal. Seamlessly overlay text grids and custom frames optimized for ecommerce and online cataloging portals.
                </p>
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="flex flex-col md:flex-row gap-8 items-center border-b border-slate-100 pb-10">
              <div className="p-5 bg-amber-500/5 text-amber-600 rounded-3xl shrink-0">
                <Warehouse className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h4 className="text-xl font-bold text-slate-900">2. Interactive Warehouse Layouts</h4>
                <p className="text-sm font-semibold text-slate-500 leading-relaxed">
                  Map and catalog products by unique warehouse coordinates. Configure racks, drawers, and shelf rows to pinpoint inventory items inside warehouses, preventing catalog mismatch.
                </p>
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="p-5 bg-rose-500/5 text-rose-600 rounded-3xl shrink-0">
                <FileText className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h4 className="text-xl font-bold text-slate-900">3. B2B Client Quotation Generator</h4>
                <p className="text-sm font-semibold text-slate-500 leading-relaxed">
                  Generate professional PDF and Excel quotation sheets containing style names, specific stock rates, and delivery logistics parameters for swift approval and purchase flows.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-16 mt-auto border-t border-slate-900 relative overflow-hidden">
        {/* Dynamic footer top-border decoration line */}
        <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500" />

        <div className="max-w-[1400px] mx-auto px-6 space-y-12">
          {/* Feature highlights inside footer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pb-12 border-b border-slate-900">
            {/* Feature 1 */}
            <div className="flex gap-4 p-5 rounded-2xl bg-slate-900/40 border border-slate-850">
              <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 shrink-0 h-fit">
                <Warehouse className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-100">Godown Management</h4>
                <p className="text-xs font-semibold text-slate-500 leading-relaxed">
                  Track rack coordinates, mapping shelf slots, and batch-wise warehouse location planning.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex gap-4 p-5 rounded-2xl bg-slate-900/40 border border-slate-850">
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 shrink-0 h-fit">
                <Truck className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-100">Logistics & Dispatch</h4>
                <p className="text-xs font-semibold text-slate-500 leading-relaxed">
                  Optimize carton packing quantities, shipping loads, and bulk packaging logistics workflows.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex gap-4 p-5 rounded-2xl bg-slate-900/40 border border-slate-850">
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0 h-fit">
                <Package className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-100">Cataloging Studio</h4>
                <p className="text-xs font-semibold text-slate-500 leading-relaxed">
                  Generate digital designs, group items by unique style codes, and organize product catalogs.
                </p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="flex gap-4 p-5 rounded-2xl bg-slate-900/40 border border-slate-850">
              <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400 shrink-0 h-fit">
                <FileText className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-100">Client Quotations</h4>
                <p className="text-xs font-semibold text-slate-500 leading-relaxed">
                  Instantly output high-fidelity PDF/Excel quotations with direct rates and dispatch metrics.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-8 pb-12 border-b border-slate-800/80">
            {/* Logo column */}
            <div className="md:col-span-5 space-y-4">
              <div className="flex items-center gap-2">
                <Logo />
              </div>
              <p className="text-sm font-semibold text-slate-400 leading-relaxed max-w-md">
                DigiScale Product Studio is a cloud cataloging and digital assets workspace. 
                Manage your product collections, catalog designs by codes, remove backgrounds instantly using AI, and generate high-fidelity PDF/Excel quotations for clients.
              </p>
            </div>

            {/* Workspace Column */}
            <div className="col-span-2 space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">Workspace</h4>
              <ul className="space-y-3 text-xs sm:text-[13px] font-bold text-slate-400">
                <li><Link href="/workspace" className="hover:text-blue-400 transition">Design Canvas</Link></li>
                <li><Link href="/projects" className="hover:text-blue-400 transition">Code Collections</Link></li>
                <li><Link href="/projects" className="hover:text-blue-400 transition">Named Collections</Link></li>
              </ul>
            </div>

            {/* Operations Column */}
            <div className="col-span-2 space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">Operations</h4>
              <ul className="space-y-3 text-xs sm:text-[13px] font-bold text-slate-400">
                <li><Link href="/warehouse" className="hover:text-blue-400 transition">Warehouse Layout</Link></li>
                <li><Link href="/quotation" className="hover:text-blue-400 transition">Generate Quotes</Link></li>
                <li><Link href="/clients" className="hover:text-blue-400 transition">Client Directory</Link></li>
              </ul>
            </div>

            {/* Support Column */}
            <div className="col-span-3 space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">Contact & Support</h4>
              <ul className="space-y-3 text-xs sm:text-[13px] font-bold text-slate-400">
                <li>
                  <a href="mailto:hello@digiscaleinfotech.com" className="hover:text-blue-400 transition font-semibold">
                    hello@digiscaleinfotech.com
                  </a>
                </li>
                <li className="flex items-center gap-1.5 font-semibold">
                  <Phone className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>+91 98982 13183</span>
                </li>
                <li className="text-xs text-slate-500 font-medium leading-relaxed">
                  Available Mon-Sat (10 AM - 7 PM IST)
                </li>
              </ul>
            </div>
          </div>

          {/* Copyright Section */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-10 text-xs text-slate-500 font-bold">
            <div>
              &copy; {new Date().getFullYear()} DigiScale Product Studio. All rights reserved.
            </div>
            <div className="flex gap-6">
              <Link href="/privacy" className="hover:text-slate-400 transition">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-slate-400 transition">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
