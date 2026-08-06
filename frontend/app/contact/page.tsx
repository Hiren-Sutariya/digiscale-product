"use client";

import React, { useState } from "react";
import Link from "next/link";
import Logo from "@/components/ui/logo";
import { 
  Phone, 
  Mail, 
  Clock, 
  ArrowLeft, 
  CheckCircle2, 
  Warehouse, 
  Truck, 
  Package, 
  FileText 
} from "lucide-react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API request
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    setIsSubmitting(false);
    setIsSuccess(true);
    setFormData({ name: "", email: "", phone: "", company: "", message: "" });
    setTimeout(() => setIsSuccess(false), 5000);
  };

  const [isScrolled, setIsScrolled] = useState(false);

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
            <Link href="/contact" className={`text-sm font-semibold text-blue-600 bg-blue-50 rounded-xl px-4 transition-all duration-300 cursor-pointer ${
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
      <main className="flex-1 max-w-[1400px] mx-auto w-full px-6 pt-32 pb-24 grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
        {/* Contact Info & B2B Strengths */}
        <div className="lg:col-span-5 space-y-10">
          <div className="space-y-5">
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 leading-tight animate-fade-in">
              Let's Scale Your Product Operations
            </h1>
            <p className="text-sm font-semibold text-slate-500 leading-relaxed">
              Have questions about mapping shelves, setting carton packing volumes, managing product codes, or setting up bulk PDF catalog generation? Our B2B operations desk is here to help.
            </p>
          </div>

          {/* Direct Details (Simple, clean, cardless layout) */}
          <div className="space-y-8 pl-1">
            <div className="flex items-start gap-4">
              <div className="p-1 text-blue-600 mt-1 shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Email Support</p>
                <a href="mailto:hello@digiscaleinfotech.com" className="text-base font-bold text-slate-800 hover:text-blue-600 transition">
                  hello@digiscaleinfotech.com
                </a>
                <p className="text-xs font-semibold text-slate-500 leading-relaxed pt-0.5">
                  Write to us for general inquiries, B2B quotes, and custom catalog setup.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-1 text-emerald-600 mt-1 shrink-0">
                <Phone className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Helpline Number</p>
                <a href="tel:+919898213183" className="text-base font-bold text-slate-800 hover:text-emerald-600 transition font-mono">
                  +91 98982 13183
                </a>
                <p className="text-xs font-semibold text-slate-500 leading-relaxed pt-0.5">
                  Call our logistics desk for instant warehouse, shelf-mapping, and login support.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-1 text-purple-600 mt-1 shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Operational Hours</p>
                <p className="text-base font-bold text-slate-800 leading-relaxed">
                  Monday - Saturday, 10:00 AM - 7:00 PM IST
                </p>
                <p className="text-xs font-semibold text-slate-500 leading-relaxed pt-0.5">
                  We are closed on Sundays and national public holidays.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-sm relative overflow-hidden">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Send us a message</h2>
          <p className="text-sm font-semibold text-slate-450 mb-10">We will review your inquiry and respond within 24 hours.</p>

          {isSuccess && (
            <div className="mb-8 flex items-start gap-3 rounded-2xl bg-emerald-50 border border-emerald-100 p-5 text-emerald-800">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold">Message sent successfully!</p>
                <p className="text-xs font-semibold text-emerald-600 mt-1">Thank you for contacting us. We'll be in touch shortly.</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-2">Your Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-2">Work Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@company.com"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-2">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98982 13183"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-2">Company Name</label>
                <input
                  type="text"
                  required
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="Lumina Textiles"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-2">Message</label>
              <textarea
                required
                rows={8}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Tell us about your warehousing requirements, product codes volume, or any custom integrations you need."
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 resize-none"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm px-6 py-4 transition duration-300 shadow-md active:scale-95 cursor-pointer"
              >
                {isSubmitting ? "Sending inquiry..." : "Send Message"}
              </button>
            </div>
          </form>
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
