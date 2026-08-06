"use client";

import React from "react";
import Link from "next/link";
import Logo from "@/components/ui/logo";
import { 
  Phone, 
  Warehouse, 
  Truck, 
  Package, 
  FileText 
} from "lucide-react";

export default function PrivacyPage() {
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
            <Link href="/about" className={`text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl px-4 transition-all duration-300 cursor-pointer ${
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

      {/* Main Content Container */}
      <main className="flex-grow bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 pt-32 pb-16">
          <div className="space-y-6">
            <h1 className="text-3xl font-black text-slate-950 tracking-tight">Privacy Policy</h1>
            <p className="text-xs text-slate-400 font-bold">Last Updated: August 4, 2026</p>

            <hr className="border-slate-100" />

            <div className="prose prose-slate max-w-none text-slate-600 font-semibold text-sm leading-relaxed space-y-6">
              <p>
                At DigiScale Product Studio, accessible from digiscaleinfotech.com, one of our main priorities is the privacy of our visitors. This Privacy Policy document contains types of information that is collected and recorded by DigiScale and how we use it.
              </p>

              <h2 className="text-lg font-black text-slate-900 pt-4">1. Consent</h2>
              <p>
                By using our website, you hereby consent to our Privacy Policy and agree to its terms.
              </p>

              <h2 className="text-lg font-black text-slate-900 pt-4">2. Information We Collect</h2>
              <p>
                The personal information that you are asked to provide, and the reasons why you are asked to provide it, will be made clear to you at the point we ask you to provide your personal information.
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>If you contact us directly, we may receive additional information about you such as your name, email address, phone number, the contents of the message and/or attachments you may send us, and any other information you may choose to provide.</li>
                <li>When you register for an Account, we may ask for your contact information, including items such as name, company name, address, email address, and telephone number.</li>
              </ul>

              <h2 className="text-lg font-black text-slate-900 pt-4">3. How We Use Your Information</h2>
              <p>
                We use the information we collect in various ways, including to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide, operate, and maintain our website and B2B cataloging console.</li>
                <li>Improve, personalize, and expand our website features and logistics tools.</li>
                <li>Understand and analyze how you use our digital warehouse sheets and catalog tools.</li>
                <li>Develop new products, services, features, and functionalities.</li>
                <li>Communicate with you, either directly or through one of our partners, including for customer service, to provide you with updates and other information relating to the website, and for marketing and promotional purposes.</li>
                <li>Send you emails and transaction updates.</li>
                <li>Find and prevent fraud.</li>
              </ul>

              <h2 className="text-lg font-black text-slate-900 pt-4">4. Log Files</h2>
              <p>
                DigiScale follows a standard procedure of using log files. These files log visitors when they visit websites. All hosting companies do this and a part of hosting services' analytics. The information collected by log files include internet protocol (IP) addresses, browser type, Internet Service Provider (ISP), date and time stamp, referring/exit pages, and possibly the number of clicks. These are not linked to any information that is personally identifiable. The purpose of the information is for analyzing trends, administering the site, tracking users' movement on the website, and gathering demographic information.
              </p>

              <h2 className="text-lg font-black text-slate-900 pt-4">5. Contact Information</h2>
              <p>
                If you have any questions or suggestions about our Privacy Policy, do not hesitate to contact us at <a href="mailto:hello@digiscaleinfotech.com" className="text-blue-600 underline">hello@digiscaleinfotech.com</a> or via phone at <span className="font-mono text-slate-800">+91 98982 13183</span>.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Connected B2B Footer */}
      <footer className="w-full bg-[#0b0f19] border-t border-slate-900 text-white pt-24 pb-20 mt-auto relative overflow-hidden select-none">
        <div className="absolute -bottom-24 -left-20 w-80 h-80 rounded-full bg-blue-500/5 blur-3xl pointer-events-none" />
        <div className="absolute top-10 right-0 w-72 h-72 rounded-full bg-sky-400/5 blur-3xl pointer-events-none" />

        <div className="max-w-[1600px] mx-auto px-6 md:px-12">
          {/* B2B highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pb-12 mb-12 border-b border-slate-800/80">
            <div className="flex gap-4 p-5 rounded-2xl bg-slate-900/40 border border-slate-800/60 hover:border-slate-800 transition">
              <div className="p-3.5 rounded-xl bg-blue-500/10 text-blue-400 shrink-0 h-fit">
                <Warehouse className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-100">Godown Management</h4>
                <p className="text-xs font-semibold text-slate-400 leading-relaxed">
                  Track rack coordinates, mapping shelf slots, and batch-wise warehouse location planning.
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-5 rounded-2xl bg-slate-900/40 border border-slate-800/60 hover:border-slate-800 transition">
              <div className="p-3.5 rounded-xl bg-amber-500/10 text-amber-400 shrink-0 h-fit">
                <Truck className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-100">Logistics & Dispatch</h4>
                <p className="text-xs font-semibold text-slate-400 leading-relaxed">
                  Optimize carton packing quantities, shipping loads, and bulk packaging logistics workflows.
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-5 rounded-2xl bg-slate-900/40 border border-slate-800/60 hover:border-slate-800 transition">
              <div className="p-3.5 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0 h-fit">
                <Package className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-100">Cataloging Studio</h4>
                <p className="text-xs font-semibold text-slate-400 leading-relaxed">
                  Generate digital designs, group items by unique style codes, and organize product catalogs.
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-5 rounded-2xl bg-slate-900/40 border border-slate-800/60 hover:border-slate-800 transition">
              <div className="p-3.5 rounded-xl bg-rose-500/10 text-rose-400 shrink-0 h-fit">
                <FileText className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-100">Client Quotations</h4>
                <p className="text-xs font-semibold text-slate-400 leading-relaxed">
                  Instantly output high-fidelity PDF/Excel quotations with direct rates and dispatch metrics.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-8 pb-12 border-b border-slate-800/80">
            <div className="md:col-span-5 space-y-4">
              <div className="flex items-center gap-2">
                <Logo />
              </div>
              <p className="text-sm font-semibold text-slate-400 leading-relaxed max-w-md">
                DigiScale Product Studio is a cloud cataloging and digital assets workspace. 
                Manage your product collections, catalog designs by codes, remove backgrounds instantly using AI, and generate high-fidelity PDF/Excel quotations for clients.
              </p>
            </div>

            <div className="col-span-2 space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">Workspace</h4>
              <ul className="space-y-3 text-xs sm:text-[13px] font-bold text-slate-400">
                <li><Link href="/workspace" className="hover:text-blue-400 transition">Design Canvas</Link></li>
                <li><Link href="/projects" className="hover:text-blue-400 transition">Code Collections</Link></li>
                <li><Link href="/projects" className="hover:text-blue-400 transition">Named Collections</Link></li>
              </ul>
            </div>

            <div className="col-span-2 space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">Operations</h4>
              <ul className="space-y-3 text-xs sm:text-[13px] font-bold text-slate-400">
                <li><Link href="/warehouse" className="hover:text-blue-400 transition">Warehouse Layout</Link></li>
                <li><Link href="/quotation" className="hover:text-blue-400 transition">Generate Quotes</Link></li>
                <li><Link href="/clients" className="hover:text-blue-400 transition">Client Directory</Link></li>
              </ul>
            </div>

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

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-10 text-xs text-slate-500 font-bold">
            <div>
              &copy; {new Date().getFullYear()} DigiScale Product Studio. All rights reserved.
            </div>
            <div className="flex gap-6">
              <Link href="/about" className="hover:text-slate-400 transition">About Us</Link>
              <Link href="/privacy" className="hover:text-slate-400 transition">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-slate-400 transition">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
