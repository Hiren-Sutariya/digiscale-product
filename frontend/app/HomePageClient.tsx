"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Logo from "@/components/ui/logo";
import { 
  ArrowRight, 
  Play, 
  Check, 
  Sparkles, 
  Layers, 
  Grid, 
  FileDown, 
  Maximize2, 
  FolderHeart, 
  History, 
  Sliders, 
  Star,
  ChevronDown,
  Upload,
  User,
  Quote,
  ShieldCheck,
  TrendingUp,
  Workflow,
  Package,
  FileText,
  Trash2,
  Download,
  Image as ImageIcon,
  RefreshCw,
  Scissors,
  Phone,
  Truck,
  Warehouse
} from "lucide-react";

export default function HomePageClient() {
  const [demoActiveIndex, setDemoActiveIndex] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [emailSubscribed, setEmailSubscribed] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [isMounted, setIsMounted] = useState(false);

  // Background removal tool states
  const [originalImage, setOriginalImage] = useState<string>("https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=800&auto=format&fit=crop&q=80");
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [previewBg, setPreviewBg] = useState<'transparent' | 'white' | 'slate-900'>('transparent');
  const [sliderPosition, setSliderPosition] = useState(50);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const presetBgImages = [
    {
      name: "Serum Bottle",
      url: "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=800&auto=format&fit=crop&q=80"
    },
    {
      name: "Sneaker Sport",
      url: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&auto=format&fit=crop&q=80"
    },
    {
      name: "Audio Headphone",
      url: "https://images.unsplash.com/photo-1588444839799-eaa432d87920?w=800&auto=format&fit=crop&q=80"
    }
  ];

  const clientLogos = [
    "STRIPE",
    "SHOPIFY",
    "FIGMA",
    "WEBFLOW",
    "MAILCHIMP",
    "VERCEL",
    "SUPABASE",
    "PRISMA"
  ];

  const testimonials = [
    {
      initials: "SM",
      name: "Sarah Miller",
      role: "Head of Art, Studio X",
      quote: "DigiScale saved our marketing catalog team hundreds of hours. Designing templates, snapping guides in place, and running imports from folders is extremely fluid."
    },
    {
      initials: "RK",
      name: "Rohan K.",
      role: "Operations Lead, PrintFast",
      quote: "The layout rules snapping works identically to Figma, which made onboarding our designers immediate. The local storage makes backups incredibly simple."
    },
    {
      initials: "JB",
      name: "Julian Becker",
      role: "Founder, Aura Apparel",
      quote: "Switching background colors, swapping image assets dynamically, and running instant high-res batch downloads has cut down our production cycle by 80%."
    },
    {
      initials: "AN",
      name: "Aanya Nair",
      role: "E-commerce Director, FabIndia",
      quote: "Managing shelf coordinates and batch catalog generation from one dashboard is a game-changer. Our inventory photos are now processed in seconds."
    },
    {
      initials: "DH",
      name: "David H.",
      role: "Logistics Manager, ShelveIt",
      quote: "Exporting quotations with exact warehouse shelf tags has made client approvals incredibly fast. The IndexedDB sync works flawlessly offline."
    }
  ];

  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);

    if (window.location.hash) {
      const id = window.location.hash.substring(1);
      const element = document.getElementById(id);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth" });
        }, 300);
      }
    }

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const demoImages = [
    {
      src: "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=800&auto=format&fit=crop&q=80",
      title: "LUMINA COSMETICS",
      desc: "Hydrating Facial Serum • Eco-Luxury",
      category: "Social Campaign",
      badge: "Organic Skin Elixir",
      bgColor: "bg-[#F7F4F0]"
    },
    {
      src: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&auto=format&fit=crop&q=80",
      title: "NORDIC SHELF",
      desc: "Minimalist Birch Wood Rack • 15% OFF",
      category: "Pinterest Pin",
      badge: "Mid-Century Design",
      bgColor: "bg-[#EFEFEF]"
    },
    {
      src: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80",
      title: "SOLO WIRELESS",
      desc: "Active Noise Cancelling • Pre-Order Now",
      category: "Facebook Ad",
      badge: "Studio Audio",
      bgColor: "bg-[#F3F4F6]"
    },
    {
      src: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&auto=format&fit=crop&q=80",
      title: "APEX RUNNER",
      desc: "Ultra-Light Breathable Knit • New Release",
      category: "Instagram Post",
      badge: "Elite Activewear",
      bgColor: "bg-[#F5F5F7]"
    }
  ];

  const steps = [
    {
      title: "1. Upload Product Assets",
      desc: "Drag and drop high-resolution product photos directly into your workspace catalog."
    },
    {
      title: "2. Snaps & Alignments",
      desc: "Leverage smart snap boundaries and canvas guides for mathematically perfect layouts."
    },
    {
      title: "3. Run Batch Processing",
      desc: "Swap, preview, and process hundreds of graphics simultaneously without leaving the tab."
    }
  ];


  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailInput.trim()) {
      setEmailSubscribed(true);
      setEmailInput("");
      setTimeout(() => setEmailSubscribed(false), 5000);
    }
  };

  // Background removal logic using backend BiRefNet-general API
  const handleRemoveBackground = async (imageSrc?: any) => {
    const srcToProcess = typeof imageSrc === "string" ? imageSrc : originalImage;
    setIsScanning(true);
    setScanProgress(10);
    
    const progressInterval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 95) return 95;
        return prev + 5;
      });
    }, 150);

    try {
      const res = await fetch("/api/remove-bg", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_url: srcToProcess })
      });
      
      if (!res.ok) {
        throw new Error(await res.text());
      }
      
      const data = await res.json();
      setProcessedImage(data.image_url);
      setScanProgress(100);
    } catch (err) {
      console.error("BiRefNet API background removal failed, falling back to local chroma key:", err);
      // Fallback to local chroma key if API fails so the user still gets a result
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          setIsScanning(false);
          return;
        }
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        try {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const dataBytes = imageData.data;
          const targetR = dataBytes[0];
          const targetG = dataBytes[1];
          const targetB = dataBytes[2];
          const threshold = (30 / 100) * 255;
          for (let i = 0; i < dataBytes.length; i += 4) {
            const r = dataBytes[i];
            const g = dataBytes[i + 1];
            const b = dataBytes[i + 2];
            const diffR = Math.abs(r - targetR);
            const diffG = Math.abs(g - targetG);
            const diffB = Math.abs(b - targetB);
            if (diffR < threshold && diffG < threshold && diffB < threshold) {
              dataBytes[i + 3] = 0;
            }
          }
          ctx.putImageData(imageData, 0, 0);
          setProcessedImage(canvas.toDataURL("image/png"));
        } catch (e) {
          setProcessedImage(img.src);
        }
        setIsScanning(false);
      };
      img.src = srcToProcess;
    } finally {
      clearInterval(progressInterval);
      setIsScanning(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setOriginalImage(result);
        setProcessedImage(null);
        // Automatically trigger background removal loader and API call
        handleRemoveBackground(result);
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isMounted) {
    return <div className="min-h-screen bg-slate-50" />;
  }

  return (
    <div className="min-h-screen bg-slate-50/30 text-slate-700 font-sans selection:bg-blue-500/10 selection:text-blue-600 antialiased overflow-x-hidden relative">
      
      {/* Dynamic Keyframe Animation Styles */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes subtlePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.85; transform: scale(1.03); }
        }
        @keyframes gridPan {
          from { background-position: 0 0; }
          to { background-position: 48px 48px; }
        }
        @keyframes orbit {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes orbitReverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes dashFlow {
          to {
            stroke-dashoffset: -20;
          }
        }
        @keyframes layerExpand {
          0%, 100% {
            transform: translateZ(0px);
          }
          50% {
            transform: translateZ(24px);
          }
        }
        @keyframes layerExpandTop {
          0%, 100% {
            transform: translateZ(0px);
          }
          50% {
            transform: translateZ(48px);
          }
        }
        @keyframes canvasScan {
          0% { top: 0%; opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes shimmerGlint {
          0% { left: -60%; }
          100% { left: 125%; }
        }
        @keyframes laserSweepVertical {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-fade-in {
          animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-subtle-pulse {
          animation: subtlePulse 3.5s ease-in-out infinite;
        }
        .animate-grid-pan {
          animation: gridPan 25s linear infinite;
        }
        .animate-orbit {
          animation: orbit 30s linear infinite;
        }
        .animate-orbit-reverse {
          animation: orbitReverse 30s linear infinite;
        }
        .animate-dash-flow {
          stroke-dasharray: 4 6;
          animation: dashFlow 1.2s linear infinite;
        }
        .animate-dash-flow-reverse {
          stroke-dasharray: 4 6;
          animation: dashFlow 1.2s linear infinite;
          animation-direction: reverse;
        }
        .animate-layer-mid {
          animation: layerExpand 6s ease-in-out infinite;
        }
        .animate-layer-top {
          animation: layerExpandTop 6s ease-in-out infinite;
        }
        .animate-canvas-scan {
          animation: canvasScan 4s ease-in-out infinite;
        }
        .animate-laser-sweep {
          animation: laserSweepVertical 2.2s ease-in-out infinite;
        }
        .animate-marquee {
          display: flex;
          width: max-content;
          animation: marquee 25s linear infinite;
        }
        .animate-marquee-slow {
          display: flex;
          width: max-content;
          animation: marquee 60s linear infinite;
        }
        .isometric-container {
          perspective: 1000px;
          transform-style: preserve-3d;
        }
        .isometric-stack {
          transform: rotateX(55deg) rotateZ(-45deg);
          transform-style: preserve-3d;
        }
        .btn-shimmer {
          position: relative;
          overflow: hidden;
        }
        .btn-shimmer::after {
          content: '';
          position: absolute;
          top: -50%;
          left: -60%;
          width: 30%;
          height: 200%;
          background: rgba(255, 255, 255, 0.25);
          transform: rotate(30deg);
          animation: shimmerGlint 4s ease-in-out infinite;
        }
        .bg-checkerboard {
          background-image: linear-gradient(45deg, #f1f5f9 25%, transparent 25%),
                            linear-gradient(-45deg, #f1f5f9 25%, transparent 25%),
                            linear-gradient(45deg, transparent 75%, #f1f5f9 75%),
                            linear-gradient(-45deg, transparent 75%, #f1f5f9 75%);
          background-size: 16px 16px;
          background-position: 0 0, 0 8px, 8px -8px, -8px 0px;
        }
      `}</style>

      {/* Hero Section Background - Blueprint Grid (faint for clean look) */}
      <div className="absolute top-0 inset-x-0 h-[600px] overflow-hidden pointer-events-none select-none z-0 border-b border-slate-200/50 bg-gradient-to-b from-white to-slate-50/20">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#cbd5e1_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e1_1px,transparent_1px)] bg-[size:48px_48px] animate-grid-pan [mask-image:radial-gradient(ellipse_60%_50%_at_50%_35%,#000_70%,transparent_100%)] opacity-15" />
      </div>

      {/* Header / Navbar */}
      <header className={`fixed z-50 left-1/2 -translate-x-1/2 transition-all duration-500 ease-in-out backdrop-blur-sm flex items-center justify-between ${
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
            <a href="#features" className={`text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl px-4 transition-all duration-300 cursor-pointer ${
              isScrolled ? "py-1.5" : "py-2.5"
            }`}>
              Features
            </a>
            <a href="#remove-bg-tool" className={`text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl px-4 transition-all duration-300 cursor-pointer ${
              isScrolled ? "py-1.5" : "py-2.5"
            }`}>
              Remove BG
            </a>
            <a href="#pricing" className={`text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl px-4 transition-all duration-300 cursor-pointer ${
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

      {/* Hero Section Container */}
      <section className="max-w-[1400px] mx-auto px-6 pt-32 pb-12 relative z-10 flex flex-col gap-8 items-center">
        
        {/* Symmetrical Hero Row: Left Workspace console, Center text contents, Right Warehouse console */}
        <div className="w-full flex flex-col lg:flex-row items-center justify-between gap-8">
          
          {/* Left Column (Workspace Symmetrical HUD Console) */}
          <div className="hidden lg:flex justify-center items-center w-1/4 select-none relative h-[280px]">
            <div className="absolute w-44 h-44 rounded-full bg-blue-500/5 blur-xl pointer-events-none" />
            
            <div className="relative w-[240px] h-[240px] flex items-center justify-center shrink-0">
              
              {/* Connected Tech Graph SVG Backplane */}
              <svg width="240" height="240" viewBox="0 0 240 240" className="absolute pointer-events-none z-0">
                {/* Concentric Tech Rings */}
                <circle cx="120" cy="120" r="42" stroke="#e2e8f0" strokeWidth="1" fill="none" />
                
                {/* DOTTED ROTATING ORBIT RING (Clockwise) */}
                <g className="animate-orbit origin-center" style={{ transformOrigin: "120px 120px" }}>
                  <circle cx="120" cy="120" r="85" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="3 3" fill="none" />
                </g>

                {/* Connectors */}
                <line x1="120" y1="35" x2="120" y2="205" stroke="#e2e8f0" strokeWidth="1.5" />
                <line x1="35" y1="120" x2="205" y2="120" stroke="#e2e8f0" strokeWidth="1.5" />
                {/* Flowing Laser Dashes flowing INTO center */}
                <line x1="120" y1="35" x2="120" y2="78" stroke="#3b82f6" strokeWidth="1.5" className="animate-dash-flow" />
                <line x1="120" y1="205" x2="120" y2="162" stroke="#3b82f6" strokeWidth="1.5" className="animate-dash-flow-reverse" />
                <line x1="35" y1="120" x2="78" y2="120" stroke="#3b82f6" strokeWidth="1.5" className="animate-dash-flow" />
                <line x1="205" y1="120" x2="162" y2="120" stroke="#3b82f6" strokeWidth="1.5" className="animate-dash-flow-reverse" />
              </svg>

              {/* Center Core Glass Hub (Workspace) */}
              <div className="absolute left-[96px] top-[96px] w-12 h-12 rounded-full bg-blue-600/90 text-white flex flex-col items-center justify-center font-bold text-[9px] shadow-md shadow-blue-500/20 z-20 border-2 border-white animate-subtle-pulse">
                <span>WORK</span>
              </div>

              {/* Node 1: Canvas Snapping (Top: 120, 35) */}
              <div className="absolute left-[96px] top-[11px] z-10 flex flex-col items-center">
                <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-blue-600 hover:border-blue-500 transition cursor-pointer">
                  <Maximize2 className="w-5 h-5" />
                </div>
                <span className="absolute -top-6 text-[8px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Snapping</span>
              </div>

              {/* Node 2: Layer Stack (Right: 205, 120) */}
              <div className="absolute left-[181px] top-[96px] z-10 flex items-center">
                <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-blue-600 hover:border-blue-500 transition cursor-pointer">
                  <Layers className="w-5 h-5" />
                </div>
                <span className="absolute -right-12 text-[8px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Layers</span>
              </div>

              {/* Node 3: Batch Queue (Bottom: 120, 205) */}
              <div className="absolute left-[96px] top-[181px] z-10 flex flex-col items-center">
                <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-blue-600 hover:border-blue-500 transition cursor-pointer">
                  <Grid className="w-5 h-5" />
                </div>
                <span className="absolute -bottom-6 text-[8px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Queue</span>
              </div>

              {/* Node 4: PDF/ZIP Export (Left: 35, 120) */}
              <div className="absolute left-[11px] top-[96px] z-10 flex items-center justify-end">
                <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-blue-600 hover:border-blue-500 transition cursor-pointer">
                  <FileDown className="w-5 h-5" />
                </div>
                <span className="absolute -left-14 text-[8px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Exports</span>
              </div>

            </div>
          </div>
          
          {/* Center Column (Centered Text Content) */}
          <div className="w-full lg:w-2/4 flex flex-col items-center text-center animate-fade-in relative z-10">
            {/* Heading */}
            <h1 className="max-w-xl text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-slate-950 mb-4 leading-tight">
              Automate Product Graphics & Warehouse Inventory at Scale
            </h1>

            {/* Subheading */}
            <p className="max-w-lg text-slate-500 text-sm sm:text-base font-normal leading-relaxed mb-8">
              Design custom layouts, map shelf coordinates to warehouse inventory, track client quote logs, and run mass batch image renders. The unified studio workspace for product coordinators.
            </p>

            {/* CTA Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-3 justify-center">
              <Link href="/signup" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-blue-500/10 active:scale-95 cursor-pointer btn-shimmer">
                Try for free now
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Right Orbit Column (Warehouse Symmetrical HUD Console) */}
          <div className="hidden lg:flex justify-center items-center w-1/4 select-none relative h-[280px]">
            <div className="absolute w-44 h-44 rounded-full bg-blue-500/5 blur-xl pointer-events-none" />

            <div className="relative w-[240px] h-[240px] flex items-center justify-center shrink-0">
              
              {/* Connected Tech Graph SVG Backplane */}
              <svg width="240" height="240" viewBox="0 0 240 240" className="absolute pointer-events-none z-0">
                {/* Concentric Tech Rings */}
                <circle cx="120" cy="120" r="42" stroke="#e2e8f0" strokeWidth="1" fill="none" />
                
                {/* DOTTED ROTATING ORBIT RING (Counter-Clockwise) */}
                <g className="animate-orbit-reverse origin-center" style={{ transformOrigin: "120px 120px" }}>
                  <circle cx="120" cy="120" r="85" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="3 3" fill="none" />
                </g>

                {/* Connectors */}
                <line x1="120" y1="35" x2="120" y2="205" stroke="#e2e8f0" strokeWidth="1.5" />
                <line x1="35" y1="120" x2="205" y2="120" stroke="#e2e8f0" strokeWidth="1.5" />
                {/* Flowing Laser Dashes flowing INTO center */}
                <line x1="120" y1="35" x2="120" y2="78" stroke="#3b82f6" strokeWidth="1.5" className="animate-dash-flow-reverse" />
                <line x1="120" y1="205" x2="120" y2="162" stroke="#3b82f6" strokeWidth="1.5" className="animate-dash-flow" />
                <line x1="35" y1="120" x2="78" y2="120" stroke="#3b82f6" strokeWidth="1.5" className="animate-dash-flow-reverse" />
                <line x1="205" y1="120" x2="162" y2="120" stroke="#3b82f6" strokeWidth="1.5" className="animate-dash-flow" />
              </svg>

              {/* Center Core Glass Hub (Warehouse) */}
              <div className="absolute left-[96px] top-[96px] w-12 h-12 rounded-full bg-emerald-600/90 text-white flex flex-col items-center justify-center font-bold text-[9px] shadow-md shadow-emerald-500/20 z-20 border-2 border-white animate-subtle-pulse">
                <span>STOCK</span>
              </div>

              {/* Node 1: Stock Items (Top: 120, 35) */}
              <div className="absolute left-[96px] top-[11px] z-10 flex flex-col items-center">
                <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-emerald-600 hover:border-emerald-500 transition cursor-pointer">
                  <Package className="w-5 h-5" />
                </div>
                <span className="absolute -top-6 text-[8px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Stock</span>
              </div>

              {/* Node 2: Shelf Rows (Right: 205, 120) */}
              <div className="absolute left-[181px] top-[96px] z-10 flex items-center">
                <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-emerald-600 hover:border-emerald-500 transition cursor-pointer">
                  <Sliders className="w-5 h-5" />
                </div>
                <span className="absolute -right-14 text-[8px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Shelves</span>
              </div>

              {/* Node 3: Quotes List (Bottom: 120, 205) */}
              <div className="absolute left-[96px] top-[181px] z-10 flex flex-col items-center">
                <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-emerald-600 hover:border-emerald-500 transition cursor-pointer">
                  <FileText className="w-5 h-5" />
                </div>
                <span className="absolute -bottom-6 text-[8px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Quotes</span>
              </div>

              {/* Node 4: Database backup (Left: 35, 120) */}
              <div className="absolute left-[11px] top-[96px] z-10 flex items-center justify-end">
                <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-emerald-600 hover:border-emerald-500 transition cursor-pointer">
                  <FolderHeart className="w-5 h-5" />
                </div>
                <span className="absolute -left-14 text-[8px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Backups</span>
              </div>

            </div>
          </div>

        </div>

        {/* Mockup wrapper with absolute side details */}
        <div className="relative w-full max-w-5xl">
          
          {/* Left Symmetrical Exploded 3D Template Layers Stack */}
          <div className="hidden xl:flex absolute -left-48 top-[40px] w-40 h-[200px] items-center justify-center isometric-container select-none">
            <div className="relative w-28 h-28 isometric-stack">
              {/* Base Grid Layer (Static) */}
              <div className="absolute inset-0 bg-slate-100/30 border border-slate-200/80 rounded-xl flex items-center justify-center">
                <Grid className="w-8 h-8 text-slate-300/50" />
              </div>
              {/* Middle Layer (Lifting Z-axis) */}
              <div className="absolute inset-0 bg-blue-500/5 border border-blue-500/20 rounded-xl animate-layer-mid flex items-center justify-center">
                <Layers className="w-8 h-8 text-blue-500/30" />
              </div>
              {/* Top Layout Focus Layer (Higher lifting Z-axis) */}
              <div className="absolute inset-0 bg-white/70 backdrop-blur-sm border border-slate-350 rounded-xl shadow-md animate-layer-top flex items-center justify-center text-blue-600">
                <Maximize2 className="w-6 h-6" />
              </div>
            </div>
            {/* Connecting dashed axis line */}
            <div className="absolute top-1/2 -right-8 w-8 border-t border-dashed border-slate-300/80" />
          </div>

          {/* Right Symmetrical Exploded 3D Warehouse Shelving Stack */}
          <div className="hidden xl:flex absolute -right-48 top-[260px] w-40 h-[200px] items-center justify-center isometric-container select-none">
            <div className="relative w-28 h-28 isometric-stack">
              {/* Base Coordinates Layer */}
              <div className="absolute inset-0 bg-slate-100/30 border border-slate-200/80 rounded-xl flex items-center justify-center">
                <Sliders className="w-8 h-8 text-slate-300/50" />
              </div>
              {/* Middle Stock Box Layer */}
              <div className="absolute inset-0 bg-emerald-500/5 border border-emerald-500/20 rounded-xl animate-layer-mid flex items-center justify-center">
                <Package className="w-8 h-8 text-emerald-500/30" />
              </div>
              {/* Top Quote Invoice Layer */}
              <div className="absolute inset-0 bg-white/70 backdrop-blur-sm border border-slate-350 rounded-xl shadow-md animate-layer-top flex items-center justify-center text-emerald-600">
                <FileText className="w-6 h-6" />
              </div>
            </div>
            {/* Connecting dashed axis line */}
            <div className="absolute top-1/2 -left-8 w-8 border-t border-dashed border-slate-300/80" />
          </div>

          {/* ── Dynamic Product Studio Mockup (Software Representation) ── */}
          <div id="demo" className="w-full rounded-2xl border border-slate-200 bg-white p-3 shadow-md relative overflow-hidden transition-all duration-500 hover:shadow-lg">
            
            {/* Symmetrical Outer Corner Framing Ticks */}
            <span className="absolute -top-1.5 -left-1.5 w-4.5 h-4.5 border-t-2 border-l-2 border-slate-400 pointer-events-none" />
            <span className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 border-t-2 border-r-2 border-slate-400 pointer-events-none" />
            <span className="absolute -bottom-1.5 -left-1.5 w-4.5 h-4.5 border-b-2 border-l-2 border-slate-400 pointer-events-none" />
            <span className="absolute -bottom-1.5 -right-1.5 w-4.5 h-4.5 border-b-2 border-r-2 border-slate-400 pointer-events-none" />

            {/* Editor Workspace Container */}
            <div className="flex h-[450px] overflow-hidden border border-slate-200 rounded-xl relative bg-[#f8fafc]">
              
              {/* Left Sidebar */}
              <div className="w-14 bg-[#0f172a] flex flex-col items-center py-4 gap-4 border-r border-slate-800 shrink-0">
                <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center cursor-pointer hover:bg-slate-800 transition"><Grid className="w-4 h-4" /></div>
                <div className="w-8 h-8 rounded-lg text-slate-500 hover:text-slate-300 flex items-center justify-center transition cursor-pointer"><Layers className="w-4 h-4" /></div>
                <div className="w-8 h-8 rounded-lg text-slate-500 hover:text-slate-300 flex items-center justify-center transition cursor-pointer"><Sliders className="w-4 h-4" /></div>
                <div className="w-8 h-8 rounded-lg text-slate-500 hover:text-slate-300 flex items-center justify-center transition cursor-pointer"><History className="w-4 h-4" /></div>
              </div>

              {/* Rulers & Canvas Viewport */}
              <div className="flex-1 bg-[#f1f5f9] flex flex-col overflow-hidden relative select-none">
                
                {/* Horizontal Ruler */}
                <div className="h-5 bg-white border-b border-slate-200 relative overflow-hidden flex items-center shrink-0">
                  <div className="absolute left-5 w-[1000px] h-full flex gap-20 pl-4 items-end text-[7px] text-slate-400 font-bold pb-[2px]">
                    <span>0</span><span>200</span><span>400</span><span>600</span><span>800</span><span>1000</span>
                  </div>
                </div>

                {/* Main Workspace Body */}
                <div className="flex-1 flex overflow-hidden">
                  
                  {/* Vertical Ruler */}
                  <div className="w-5 bg-white border-r border-slate-200 relative overflow-hidden shrink-0">
                    <div className="absolute top-5 h-[1000px] w-full flex flex-col gap-20 pt-4 items-end text-[7px] text-slate-400 font-bold pr-[4px]">
                      <span>0</span><span>200</span><span>400</span><span>600</span><span>800</span><span>1000</span>
                    </div>
                  </div>

                  {/* Canvas Viewport containing Product Post */}
                  <div className="flex-1 p-6 flex items-center justify-center overflow-hidden relative">
                    
                    {/* Simulated 1080x1080 design Canvas */}
                    <div className={`w-80 h-80 ${demoImages[demoActiveIndex].bgColor} rounded-xl shadow-md border border-slate-200 relative overflow-hidden flex flex-col items-center justify-center transition-colors duration-500`}>
                      
                      {/* Grid Calibration Laser Scan Line */}
                      <div className="absolute left-0 right-0 w-full h-[1.5px] bg-gradient-to-r from-transparent via-blue-500/70 to-transparent shadow-[0_0_6px_rgba(59,130,246,0.4)] animate-canvas-scan pointer-events-none z-30" />

                      {/* Active bounding box outlines with transform handles */}
                      <div className="absolute inset-4 border border-blue-500 pointer-events-none z-20">
                        {/* Bounding box transform handles */}
                        <span className="absolute -top-1 -left-1 w-2 h-2 bg-white border border-blue-600" />
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-white border border-blue-600" />
                        <span className="absolute -bottom-1 -left-1 w-2 h-2 bg-white border border-blue-600" />
                        <span className="absolute -bottom-1 -right-1 w-2 h-2 bg-white border border-blue-600" />
                        <span className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-white border border-blue-600" />
                        <span className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-2 bg-white border border-blue-600" />
                        <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white border border-blue-600" />
                        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white border border-blue-600" />
                      </div>

                      {/* Clean B2B Product Banner layout */}
                      <div className="w-[88%] h-[88%] flex flex-col justify-between items-center text-center p-4 relative z-10">
                        
                        {/* Category Label */}
                        <span className="text-[8px] font-bold tracking-widest text-slate-400 uppercase">
                          {demoImages[demoActiveIndex].category}
                        </span>

                        {/* Product Center Image Frame with drop shadow */}
                        <div className="w-36 h-36 relative flex items-center justify-center my-1 select-none">
                          <div className="absolute inset-0 bg-black/5 rounded-full blur-md" />
                          <img 
                            src={demoImages[demoActiveIndex].src} 
                            alt="Workspace Active sneaker" 
                            className="max-w-[90%] max-h-[90%] object-contain select-none transition-all duration-500 scale-105"
                          />
                        </div>

                        {/* Content block */}
                        <div className="flex flex-col items-center">
                          <div className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-600 text-white text-[7px] font-bold rounded mb-1 uppercase tracking-wide">
                            {demoImages[demoActiveIndex].badge}
                          </div>
                          <h4 className="text-slate-900 text-xs font-bold tracking-tight">{demoImages[demoActiveIndex].title}</h4>
                          <p className="text-slate-500 text-[8px] font-medium mt-0.5">{demoImages[demoActiveIndex].desc}</p>
                        </div>
                      </div>

                      {/* Simulated Alignment Guide overlays */}
                      <div className="absolute inset-0 border border-dashed border-rose-450/30 pointer-events-none" />
                      <div className="absolute top-1/2 left-0 right-0 h-px border-t border-rose-450/40 border-dashed pointer-events-none" />
                      <div className="absolute left-1/2 top-0 bottom-0 w-px border-l border-rose-450/40 border-dashed pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Bottom Batch Strip */}
                <div className="h-24 bg-white border-t border-slate-200 shrink-0 flex flex-col justify-center px-4 overflow-hidden relative">
                  <div className="text-[8px] font-bold uppercase text-slate-400 tracking-wider mb-2">
                    Batch Queue — Click items to process
                  </div>
                  <div className="flex gap-2.5">
                    {demoImages.map((img, i) => (
                      <div 
                        key={i}
                        onClick={() => setDemoActiveIndex(i)}
                        className={`relative w-12 h-12 rounded-xl overflow-hidden cursor-pointer transition-all border ${
                          demoActiveIndex === i 
                            ? "ring-2 ring-blue-600 ring-offset-1 border-transparent scale-105 shadow-sm" 
                            : "border-slate-200 bg-slate-50 hover:border-slate-350 hover:scale-[1.02]"
                        } flex items-center justify-center p-1`}
                      >
                        <img src={img.src} className="max-w-full max-h-full object-contain" />
                        <div className="absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full bg-slate-900/60 text-white flex items-center justify-center text-[7px] font-bold">
                          {i + 1}
                        </div>
                        {demoActiveIndex === i && (
                          <div className="absolute bottom-0 inset-x-0 bg-blue-600 text-white text-[5px] font-bold text-center py-0.5 leading-none uppercase">
                            Active
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Right Properties Panel */}
              <div className="w-52 bg-white border-l border-slate-200 py-4 px-4 flex flex-col gap-4 shrink-0 select-none">
                <h5 className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Properties</h5>
                
                {/* Dimensions Grid */}
                <div className="grid grid-cols-2 gap-2 text-left">
                  <div>
                    <label className="text-[8px] font-bold text-slate-450 uppercase tracking-wider">Width</label>
                    <div className="h-7 border border-slate-200 rounded-lg px-2 flex items-center text-[9px] font-bold text-slate-700 bg-slate-50 mt-1">1080px</div>
                  </div>
                  <div>
                    <label className="text-[8px] font-bold text-slate-450 uppercase tracking-wider">Height</label>
                    <div className="h-7 border border-slate-200 rounded-lg px-2 flex items-center text-[9px] font-bold text-slate-700 bg-slate-50 mt-1">1080px</div>
                  </div>
                </div>

                {/* Render Format Dropdown */}
                <div className="text-left">
                  <label className="text-[8px] font-bold text-slate-450 uppercase tracking-wider">Format</label>
                  <div className="h-7 border border-slate-200 rounded-lg px-2.5 flex items-center justify-between text-[9px] font-bold text-slate-700 bg-slate-50 mt-1 cursor-pointer hover:border-slate-300 transition">
                    <span>PNG (Transparent)</span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </div>
                </div>

                {/* Snap Guides Toggle */}
                <div className="text-left flex items-center justify-between p-1.5 border border-slate-100 bg-slate-50/60 rounded-xl mt-1">
                  <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">Smart Snap Guides</span>
                  <div className="w-6 h-3.5 bg-blue-600 rounded-full p-0.5 cursor-pointer flex items-center justify-end transition-all">
                    <span className="w-2.5 h-2.5 bg-white rounded-full shadow" />
                  </div>
                </div>

                {/* Elements Stack list */}
                <div className="text-left">
                  <label className="text-[8px] font-bold text-slate-450 uppercase tracking-wider">Active Layers</label>
                  <div className="space-y-1.5 mt-1.5">
                    <div className="flex items-center gap-2 p-1.5 border border-slate-100 bg-slate-50/50 rounded-lg text-[9px] font-bold text-slate-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                      Text: {demoImages[demoActiveIndex].title}
                    </div>
                    <div className="flex items-center gap-2 p-1.5 border border-slate-100 bg-slate-50/50 rounded-lg text-[9px] font-bold text-slate-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                      Image: Product Shot
                    </div>
                  </div>
                </div>

                {/* Export Button */}
                <div className="mt-auto">
                  <button className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-sm">
                    <FileDown className="w-3.5 h-3.5" />
                    Export batch
                  </button>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ── CLIENT BRANDS INFINITE LOGO MARQUEE SLIDER ── */}
      <section className="py-4 relative overflow-hidden select-none z-10">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="relative overflow-hidden h-7 w-full">
            {/* Symmetrical fade masks */}
            <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-slate-50/30 via-slate-50/10 to-transparent z-10 pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-slate-50/30 via-slate-50/10 to-transparent z-10 pointer-events-none" />
            
            {/* Sliding Loop Container */}
            <div className="animate-marquee items-center gap-16">
              {clientLogos.map((logo, idx) => (
                <span 
                  key={idx} 
                  className="h-8 inline-flex items-center justify-center text-sm font-extrabold tracking-widest text-slate-400 hover:text-slate-800 hover:scale-105 transition duration-200 cursor-pointer whitespace-nowrap"
                >
                  {logo}
                </span>
              ))}
              {/* Duplicated for seamless loop */}
              {clientLogos.map((logo, idx) => (
                <span 
                  key={`dup-${idx}`} 
                  className="h-8 inline-flex items-center justify-center text-sm font-extrabold tracking-widest text-slate-400 hover:text-slate-800 hover:scale-105 transition duration-200 cursor-pointer whitespace-nowrap"
                >
                  {logo}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── BACKGROUND REMOVAL PLAYGROUND SECTION ── */}
      <section id="remove-bg-tool" className="pt-16 pb-24 bg-slate-50/30 relative z-10 scroll-mt-28">
        <div className="max-w-[1000px] mx-auto px-6 flex flex-col items-center">
          
          {/* Header block with target frame guides */}
          <div className="text-center max-w-xl mb-12 relative px-8 py-3.5">
            <span className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-blue-500" />
            <span className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-blue-500" />
            <span className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-blue-500" />
            <span className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-blue-500" />
            
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950">
              Remove Backdrop Instantly
            </h2>
          </div>

          {/* Sandbox Canvas Workspace */}
          <div className="w-full bg-white border border-slate-200 rounded-3xl p-5 shadow-md flex flex-col gap-6">
            
            {/* Condition 1: Upload Dropzone State */}
            {!processedImage && !isScanning && (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-[400px] border-2 border-dashed border-slate-200 hover:border-blue-500 bg-slate-50/40 hover:bg-slate-50/70 transition duration-300 rounded-2xl flex flex-col items-center justify-center cursor-pointer p-6 group select-none"
              >
                <div className="w-16 h-16 rounded-2xl bg-white border border-slate-150 shadow-sm flex items-center justify-center text-slate-400 group-hover:text-blue-500 group-hover:scale-105 transition-all mb-4">
                  <Upload className="w-6 h-6" />
                </div>
                
                <h4 className="text-sm font-bold text-slate-800">
                  Drag and drop product shot here
                </h4>
                <p className="text-[11px] text-slate-400 mt-1 max-w-xs text-center leading-relaxed">
                  Support PNG or JPG. Files are processed locally in your browser context with no server logs.
                </p>
              </div>
            )}

            {/* Condition 2: Scanning Loader State */}
            {isScanning && (
              <div className="w-full h-[400px] border border-slate-100 bg-slate-50/30 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden select-none">
                {/* Simulated blueprint sweeps */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:24px_24px] opacity-25" />
                <div className="absolute left-0 right-0 w-full h-[2px] bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)] animate-laser-sweep z-20 pointer-events-none" />

                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-4 animate-subtle-pulse border border-blue-100">
                    <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">Isolating Silhouette</h4>
                  <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-black">
                    Processing... {scanProgress}%
                  </p>
                </div>
              </div>
            )}

            {/* Condition 3: Split Before/After Slider Result State */}
            {processedImage && (
              <div className="flex flex-col gap-6 select-none">
                
                {/* Draggable Split Comparison Canvas Slider */}
                <div className="w-full h-[400px] border border-slate-200 rounded-2xl overflow-hidden relative bg-slate-50 flex items-center justify-center shadow-inner">
                  
                  {/* Checkerboard Underlay (visible on the right cut side) */}
                  <div className="absolute inset-0 bg-checkerboard z-0" />

                  {/* Left Side: Original Image (Clipped dynamically by slider position) */}
                  <div 
                    className="absolute inset-0 z-10 flex items-center justify-center overflow-hidden pointer-events-none bg-slate-50"
                    style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                  >
                    <img 
                      src={originalImage} 
                      alt="Original snapshot" 
                      className="max-h-[85%] max-w-[85%] object-contain"
                    />
                  </div>

                  {/* Right Side: Transparent Cutout Image (Fully visible below original clip) */}
                  <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
                    <img 
                      src={processedImage} 
                      alt="Transparent cutout snapshot" 
                      className="max-h-[85%] max-w-[85%] object-contain"
                    />
                  </div>

                  {/* Invisible Drag Overlay Input (Fills frame for bulletproof mouse/touch coordinate binding) */}
                  <input 
                    type="range"
                    min="0"
                    max="100"
                    value={sliderPosition}
                    onChange={(e) => setSliderPosition(parseInt(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-35 pointer-events-auto"
                  />

                  {/* Vertical sliding divider handle line */}
                  <div 
                    className="absolute top-0 bottom-0 w-[2px] bg-blue-500 shadow-[0_0_6px_#3b82f6] z-30 pointer-events-none flex items-center justify-center"
                    style={{ left: `${sliderPosition}%` }}
                  >
                    {/* Double arrow glass cursor ring */}
                    <div className="w-8 h-8 rounded-full bg-white border-2 border-blue-500 shadow-md flex items-center justify-center text-blue-500">
                      <Maximize2 className="w-3.5 h-3.5 rotate-45" />
                    </div>
                  </div>

                  {/* Symmetrical framing badges */}
                  <span className="absolute bottom-4 left-4 z-20 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider rounded bg-slate-900/80 text-white shadow-sm">
                    Original
                  </span>
                  <span className="absolute bottom-4 right-4 z-20 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider rounded bg-blue-600/80 text-white shadow-sm">
                    Isolated
                  </span>
                </div>

                {/* Settings & Action Bars */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-row items-center justify-end gap-2.5 text-left">
                  
                  {/* Downloads & Reset actions */}
                  <button 
                    onClick={() => {
                      setProcessedImage(null);
                      setOriginalImage("https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=800&auto=format&fit=crop&q=80");
                    }}
                    className="px-4 py-2 bg-white border border-slate-200 hover:border-slate-350 text-slate-600 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-slate-400" />
                    Reset Workspace
                  </button>
                  
                  <a 
                    href={processedImage} 
                    download="digiscale_isolated_product.png"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download transparent PNG
                  </a>
                </div>
              </div>
            )}

            {/* Hidden native input */}
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden" 
            />

          </div>
        </div>
      </section>

      {/* Core Features Grid Section (USPs Showcase) */}
      <section id="features" className="pt-16 pb-24 bg-white border-t border-slate-200 relative overflow-hidden z-10 scroll-mt-28">
        {/* Decorative Grid Lines inside Features */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_0.5px,transparent_0.5px),linear-gradient(to_bottom,#e2e8f0_0.5px,transparent_0.5px)] bg-[size:96px_96px] opacity-10 pointer-events-none" />

        <div className="max-w-[1400px] mx-auto px-6 relative">
          
          {/* Header */}
          <div className="text-center max-w-4xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-slate-950 md:whitespace-nowrap">
              The Complete Toolkit for Product Operations
            </h2>
            <p className="text-slate-500 text-sm sm:text-base font-normal mt-3.5 leading-relaxed max-w-2xl mx-auto">
              DigiScale merges batch asset design, warehouse inventory maps, and client quotation logs into a single lightning-fast client-side workspace.
            </p>
          </div>

          {/* 6-Card USP Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* USP 1: AI Background Removal */}
            <div className="group bg-white/70 backdrop-blur-md border border-slate-200/80 rounded-2xl p-7 hover:shadow-[0_12px_30px_rgba(59,130,246,0.06)] hover:border-blue-500/25 hover:-translate-y-1.5 transition-all duration-300 relative overflow-hidden flex flex-col justify-between min-h-[230px]">
              {/* Top hover indicator line */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
              
              <div>
                <div className="flex items-center gap-3.5 mb-5">
                  <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 group-hover:bg-blue-600 group-hover:text-white group-hover:scale-105 transition-all duration-300 shadow-sm">
                    <Scissors className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-950 group-hover:text-blue-600 transition-colors">
                      AI Backdrop Removal
                    </h3>
                    <span className="text-[8px] font-bold text-blue-500 uppercase tracking-widest block mt-0.5">BiRefNet Engine</span>
                  </div>
                </div>
                <p className="text-slate-500 text-xs font-normal mt-1 leading-relaxed">
                  Isolate product silhouettes perfectly with the BiRefNet model. Process files securely in your browser and download transparent cutouts instantly.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-slate-400">
                <span>100% Private Local Operations</span>
                <span className="flex h-1.5 w-1.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500"></span>
                </span>
              </div>
            </div>

            {/* USP 2: Smart Guideline Snapping */}
            <div className="group bg-white/70 backdrop-blur-md border border-slate-200/80 rounded-2xl p-7 hover:shadow-[0_12px_30px_rgba(59,130,246,0.06)] hover:border-blue-500/25 hover:-translate-y-1.5 transition-all duration-300 relative overflow-hidden flex flex-col justify-between min-h-[230px]">
              {/* Top hover indicator line */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
              
              <div>
                <div className="flex items-center gap-3.5 mb-5">
                  <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 group-hover:bg-blue-600 group-hover:text-white group-hover:scale-105 transition-all duration-300 shadow-sm">
                    <Maximize2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-950 group-hover:text-blue-600 transition-colors">
                      Smart Guideline Snapping
                    </h3>
                    <span className="text-[8px] font-bold text-blue-500 uppercase tracking-widest block mt-0.5">Alignment Anchors</span>
                  </div>
                </div>
                <p className="text-slate-500 text-xs font-normal mt-1 leading-relaxed">
                  Figma-like boundary anchors, dynamic coordinates, and snapping guides ensure all layout assets, logos, and elements align perfectly.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-slate-400">
                <span>Mathematical Grid Anchors</span>
                <span className="flex h-1.5 w-1.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500"></span>
                </span>
              </div>
            </div>

            {/* USP 3: Mass Batch Processing */}
            <div className="group bg-white/70 backdrop-blur-md border border-slate-200/80 rounded-2xl p-7 hover:shadow-[0_12px_30px_rgba(59,130,246,0.06)] hover:border-blue-500/25 hover:-translate-y-1.5 transition-all duration-300 relative overflow-hidden flex flex-col justify-between min-h-[230px]">
              {/* Top hover indicator line */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
              
              <div>
                <div className="flex items-center gap-3.5 mb-5">
                  <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 group-hover:bg-blue-600 group-hover:text-white group-hover:scale-105 transition-all duration-300 shadow-sm">
                    <Grid className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-950 group-hover:text-blue-600 transition-colors">
                      Mass Batch Processing
                    </h3>
                    <span className="text-[8px] font-bold text-blue-500 uppercase tracking-widest block mt-0.5">Queue Pipelines</span>
                  </div>
                </div>
                <p className="text-slate-500 text-xs font-normal mt-1 leading-relaxed">
                  Upload bulk assets to your active queue. Dynamically map sizes, apply design templates, and download processed collections in one go.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-slate-400">
                <span>Multi-Format Rendering</span>
                <span className="flex h-1.5 w-1.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500"></span>
                </span>
              </div>
            </div>

            {/* USP 4: Warehouse Shelf Mapping */}
            <div className="group bg-white/70 backdrop-blur-md border border-slate-200/80 rounded-2xl p-7 hover:shadow-[0_12px_30px_rgba(16,185,129,0.06)] hover:border-emerald-500/25 hover:-translate-y-1.5 transition-all duration-300 relative overflow-hidden flex flex-col justify-between min-h-[230px]">
              {/* Top hover indicator line */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
              
              <div>
                <div className="flex items-center gap-3.5 mb-5">
                  <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white group-hover:scale-105 transition-all duration-300 shadow-sm">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-955 group-hover:text-emerald-600 transition-colors">
                      Warehouse Shelf Mapping
                    </h3>
                    <span className="text-[8px] font-bold text-emerald-600 uppercase tracking-widest block mt-0.5">Inventory Indexing</span>
                  </div>
                </div>
                <p className="text-slate-500 text-xs font-normal mt-1 leading-relaxed">
                  Coordinate storage grids, shelf sections, and box locations. Map visual indexes to inventory codes to track stock dynamically.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-slate-400">
                <span>Location Coordinate Maps</span>
                <span className="flex h-1.5 w-1.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
              </div>
            </div>

            {/* USP 5: Quotations & Client Logs */}
            <div className="group bg-white/70 backdrop-blur-md border border-slate-200/80 rounded-2xl p-7 hover:shadow-[0_12px_30px_rgba(16,185,129,0.06)] hover:border-emerald-500/25 hover:-translate-y-1.5 transition-all duration-300 relative overflow-hidden flex flex-col justify-between min-h-[230px]">
              {/* Top hover indicator line */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
              
              <div>
                <div className="flex items-center gap-3.5 mb-5">
                  <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white group-hover:scale-105 transition-all duration-300 shadow-sm">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-955 group-hover:text-emerald-600 transition-colors">
                      Quotations & Client Logs
                    </h3>
                    <span className="text-[8px] font-bold text-emerald-600 uppercase tracking-widest block mt-0.5">Commercial Portfolio</span>
                  </div>
                </div>
                <p className="text-slate-500 text-xs font-normal mt-1 leading-relaxed">
                  Draft commercial quote proposals, customize catalog cost sheets, and log client history. Export professional PDF files instantly.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-slate-400">
                <span>PDF Commercial Invoices</span>
                <span className="flex h-1.5 w-1.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
              </div>
            </div>

            {/* USP 6: Offline-Ready Database Sync */}
            <div className="group bg-white/70 backdrop-blur-md border border-slate-200/80 rounded-2xl p-7 hover:shadow-[0_12px_30px_rgba(59,130,246,0.06)] hover:border-blue-500/25 hover:-translate-y-1.5 transition-all duration-300 relative overflow-hidden flex flex-col justify-between min-h-[230px]">
              {/* Top hover indicator line */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
              
              <div>
                <div className="flex items-center gap-3.5 mb-5">
                  <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 group-hover:bg-blue-600 group-hover:text-white group-hover:scale-105 transition-all duration-300 shadow-sm">
                    <FolderHeart className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-955 group-hover:text-blue-600 transition-colors">
                      Offline-Ready DB Sync
                    </h3>
                    <span className="text-[8px] font-bold text-blue-500 uppercase tracking-widest block mt-0.5">IndexedDB Storage</span>
                  </div>
                </div>
                <p className="text-slate-500 text-xs font-normal mt-1 leading-relaxed">
                  Synchronize client records, canvas layouts, and pricing history locally in your browser. Runs fully offline with zero data latency.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-slate-400">
                <span>Offline local-first storage</span>
                <span className="flex h-1.5 w-1.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500"></span>
                </span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Pricing Grid Section */}
      <section id="pricing" className="pt-16 pb-24 border-t border-slate-200 bg-white relative z-10 scroll-mt-28">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Simple, Transparent Pricing
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm font-normal mt-2 leading-relaxed">
              Start creating designs for free. Upgrade to unlock bulk exports and advanced client quotation modules.
            </p>

            {/* Toggle Switch */}
            <div className="flex justify-center items-center mt-6">
              <div className="bg-slate-100 p-1 rounded-full flex items-center border border-slate-200 shadow-inner">
                <button
                  onClick={() => setBillingInterval('monthly')}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 ${
                    billingInterval === 'monthly'
                      ? "bg-white text-slate-955 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingInterval('yearly')}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 flex items-center gap-1.5 ${
                    billingInterval === 'yearly'
                      ? "bg-white text-slate-955 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Yearly
                  <span className="bg-emerald-100 text-emerald-700 text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-wide">
                    Save 20%
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
            {/* Free Tier */}
            <div className="group bg-white/70 backdrop-blur-md border border-slate-200/80 rounded-2xl p-7 hover:shadow-xl hover:border-slate-300 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between min-h-[480px]">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Free Plan</h3>
                <div className="flex items-baseline gap-1 mt-3">
                  <span className="text-3xl font-extrabold text-slate-900 tracking-tight">₹0</span>
                  <span className="text-xs text-slate-400 font-semibold">/ forever</span>
                </div>
                <p className="text-slate-500 text-xs mt-2.5 leading-relaxed">Perfect for learning the basics of design layout snapping.</p>
                <div className="border-t border-slate-100 my-5" />
                <ul className="space-y-3.5">
                  <li className="flex items-center gap-2.5 text-xs font-semibold text-slate-600">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>1 Active Design Project</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-xs font-semibold text-slate-600">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Basic Snapping Rules</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-xs font-semibold text-slate-600">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>3 free backdrop removals / day</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-xs font-semibold text-slate-600">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Standard resolution exports</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-xs font-semibold text-slate-600">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Draft up to 3 quotation logs</span>
                  </li>
                </ul>
              </div>
              <Link href="/signup" className="w-full mt-6 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold text-center tracking-wide transition shadow-sm active:scale-95">
                Start for Free
              </Link>
            </div>

            {/* Growth Tier (Popular Dark Card) */}
            <div className="group bg-slate-950 text-white rounded-3xl p-7 hover:shadow-[0_20px_50px_rgba(59,130,246,0.15)] shadow-md hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between min-h-[490px] relative border border-blue-500/35 overflow-hidden">
              {/* Glowing top line */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500" />
              
              <span className="absolute top-4 right-4 bg-blue-500 text-white text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md shadow-sm">
                Most Popular
              </span>

              <div>
                <h3 className="text-base font-extrabold text-white">Growth Plan</h3>
                <div className="flex items-baseline gap-1 mt-3">
                  <span className="text-3xl font-extrabold text-white tracking-tight">
                    ₹{billingInterval === 'monthly' ? '399' : '319'}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">/ month</span>
                </div>
                {billingInterval === 'yearly' && (
                  <span className="text-[9px] text-emerald-400 font-bold tracking-wide mt-1 block">Billed annually (₹3,828/year)</span>
                )}
                <p className="text-slate-400 text-xs mt-2.5 leading-relaxed">Ideal for freelance designers and independent catalog managers.</p>
                <div className="border-t border-slate-800 my-5" />
                <ul className="space-y-3.5">
                  <li className="flex items-center gap-2.5 text-xs font-semibold text-slate-300">
                    <Check className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>10 Active Design Projects</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-xs font-semibold text-slate-300">
                    <Check className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>Advanced Alignment Snaps</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-xs font-semibold text-slate-300">
                    <Check className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>50 backdrop removals / day</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-xs font-semibold text-slate-300">
                    <Check className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>HD resolution exports (2000px)</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-xs font-semibold text-slate-300">
                    <Check className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>Create up to 10 client quotation logs</span>
                  </li>
                </ul>
              </div>
              <Link href="/signup" className="w-full mt-6 py-2.5 bg-blue-650 hover:bg-blue-700 text-white rounded-xl text-xs font-bold text-center tracking-wide transition shadow-sm active:scale-95">
                Upgrade to Growth
              </Link>
            </div>

            {/* Studio Unlimited Tier */}
            <div className="group bg-white/70 backdrop-blur-md border border-slate-200/80 rounded-2xl p-7 hover:shadow-xl hover:border-slate-300 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between min-h-[480px]">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Studio Unlimited</h3>
                <div className="flex items-baseline gap-1 mt-3">
                  <span className="text-3xl font-extrabold text-slate-955 tracking-tight">
                    ₹{billingInterval === 'monthly' ? '799' : '639'}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">/ month</span>
                </div>
                {billingInterval === 'yearly' && (
                  <span className="text-[9px] text-emerald-600 font-bold tracking-wide mt-1 block">Billed annually (₹7,668/year)</span>
                )}
                <p className="text-slate-500 text-xs mt-2.5 leading-relaxed">For high-volume product studios and catalog operations teams.</p>
                <div className="border-t border-slate-100 my-5" />
                <ul className="space-y-3.5">
                  <li className="flex items-center gap-2.5 text-xs font-semibold text-slate-600">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Unlimited Design Projects</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-xs font-semibold text-slate-600">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Unlimited Backdrop Removals</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-xs font-semibold text-slate-600">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Ultra HD exports (4000px)</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-xs font-semibold text-slate-600">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Unlimited clients & quotation logs</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-xs font-semibold text-slate-600">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>High-speed batch processing</span>
                  </li>
                </ul>
              </div>
              <Link href="/signup" className="w-full mt-6 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold text-center tracking-wide transition shadow-sm active:scale-95">
                Upgrade to Unlimited
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 border-t border-slate-200 bg-slate-50/50 relative overflow-hidden z-10">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Trusted by Design Leads Worldwide
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm font-normal mt-2 leading-relaxed">
              Hear from studio catalog managers who accelerated their output speed.
            </p>
          </div>

          <div className="relative w-full overflow-hidden py-4">
            {/* Fade overlay masks at left and right edges */}
            <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-slate-50/50 to-transparent z-20 pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-slate-50/50 to-transparent z-20 pointer-events-none" />

            <div className="animate-marquee-slow hover:[animation-play-state:paused] flex gap-8">
              {/* First Track Copy */}
              {testimonials.map((t, idx) => (
                <div 
                  key={`track1-${idx}`}
                  className="group bg-white/70 backdrop-blur-md border border-slate-200/80 hover:border-blue-500/20 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 rounded-3xl p-8 relative overflow-hidden flex flex-col justify-between min-h-[250px] min-w-[320px] md:min-w-[360px] max-w-[380px] shrink-0"
                >
                  {/* Top hover indicator line */}
                  <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-blue-500/20 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                  
                  {/* Decorative quotation mark */}
                  <div className="absolute -top-4 -right-2 text-slate-200/50 font-black text-8xl pointer-events-none select-none italic font-serif">
                    “
                  </div>

                  <div>
                    <div className="flex gap-0.5 text-amber-400 mb-4 relative z-10">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                    </div>
                    <p className="text-slate-650 text-xs font-semibold leading-relaxed italic relative z-10">
                      "{t.quote}"
                    </p>
                  </div>

                  <div className="flex items-center gap-3 mt-6 border-t border-slate-100 pt-4 relative z-10">
                    <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 shadow-sm shrink-0">
                      {t.initials}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{t.name}</h4>
                      <p className="text-[9px] text-slate-400 font-semibold mt-0.5">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}

              {/* Second Track Copy (Duplicate for Infinite Loop) */}
              {testimonials.map((t, idx) => (
                <div 
                  key={`track2-${idx}`}
                  className="group bg-white/70 backdrop-blur-md border border-slate-200/80 hover:border-blue-500/20 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 rounded-3xl p-8 relative overflow-hidden flex flex-col justify-between min-h-[250px] min-w-[320px] md:min-w-[360px] max-w-[380px] shrink-0"
                >
                  {/* Top hover indicator line */}
                  <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-blue-500/20 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                  
                  {/* Decorative quotation mark */}
                  <div className="absolute -top-4 -right-2 text-slate-200/50 font-black text-8xl pointer-events-none select-none italic font-serif">
                    “
                  </div>

                  <div>
                    <div className="flex gap-0.5 text-amber-400 mb-4 relative z-10">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                    </div>
                    <p className="text-slate-650 text-xs font-semibold leading-relaxed italic relative z-10">
                      "{t.quote}"
                    </p>
                  </div>

                  <div className="flex items-center gap-3 mt-6 border-t border-slate-100 pt-4 relative z-10">
                    <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 shadow-sm shrink-0">
                      {t.initials}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{t.name}</h4>
                      <p className="text-[9px] text-slate-400 font-semibold mt-0.5">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="w-full bg-[#0b0f19] border-t border-slate-900 text-white pt-24 pb-20 mt-16 relative overflow-hidden select-none font-sans">
        {/* Subtle background glow */}
        <div className="absolute -bottom-24 -left-20 w-80 h-80 rounded-full bg-blue-500/5 blur-3xl pointer-events-none" />
        <div className="absolute top-10 right-0 w-72 h-72 rounded-full bg-sky-400/5 blur-3xl pointer-events-none" />

        <div className="max-w-[1600px] mx-auto px-6 md:px-12">
          {/* B2B Logistics & Warehousing Features Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pb-12 mb-12 border-b border-slate-800/80">
            {/* Feature 1: Godown Management */}
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

            {/* Feature 2: Logistics & Dispatch */}
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

            {/* Feature 3: Code Cataloging */}
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

            {/* Feature 4: Client Quotations */}
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

          {/* Grid columns */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-8 pb-12 border-b border-slate-800/80">
            {/* Branding Column */}
            <div className="md:col-span-5 space-y-4">
              <div className="flex items-center gap-2">
                <Logo />
              </div>
              <p className="text-sm font-semibold text-slate-400 leading-relaxed max-w-md">
                DigiScale Product Studio is a cloud cataloging and digital assets workspace. 
                Manage your product collections, catalog designs by codes, remove backgrounds instantly using AI, and generate high-fidelity PDF/Excel quotations for clients.
              </p>
            </div>

            {/* Quick Links: Workspace */}
            <div className="col-span-2 space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">
                Workspace
              </h4>
              <ul className="space-y-3 text-xs sm:text-[13px] font-bold text-slate-400">
                <li>
                  <Link href="/workspace" className="hover:text-blue-400 transition">
                    Design Canvas
                  </Link>
                </li>
                <li>
                  <Link href="/projects" className="hover:text-blue-400 transition">
                    Code Collections
                  </Link>
                </li>
                <li>
                  <Link href="/projects" className="hover:text-blue-400 transition">
                    Named Collections
                  </Link>
                </li>
              </ul>
            </div>

            {/* Quick Links: Operations */}
            <div className="col-span-2 space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">
                Operations
              </h4>
              <ul className="space-y-3 text-xs sm:text-[13px] font-bold text-slate-400">
                <li>
                  <Link href="/warehouse" className="hover:text-blue-400 transition">
                    Warehouse Layout
                  </Link>
                </li>
                <li>
                  <Link href="/quotation" className="hover:text-blue-400 transition">
                    Generate Quotes
                  </Link>
                </li>
                <li>
                  <Link href="/clients" className="hover:text-blue-400 transition">
                    Client Directory
                  </Link>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div className="col-span-3 space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">
                Contact & Support
              </h4>
              <ul className="space-y-3 text-xs sm:text-[13px] font-bold text-slate-400">
                <li>
                  <a href="mailto:hello@digiscaleinfotech.com" className="hover:text-blue-400 transition">
                    hello@digiscaleinfotech.com
                  </a>
                </li>
                <li className="flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>+91 98982 13183</span>
                </li>
                <li className="text-xs text-slate-500 font-medium leading-relaxed">
                  Available Mon-Sat (10 AM - 7 PM IST)
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom copyright row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-10 text-xs text-slate-500 font-bold">
            <div>
              &copy; {new Date().getFullYear()} DigiScale Product Studio. All rights reserved.
            </div>
            <div className="flex gap-6">
              <Link href="/about" className="hover:text-slate-400 transition">
                About Us
              </Link>
              <Link href="/privacy" className="hover:text-slate-400 transition">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-slate-400 transition">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
