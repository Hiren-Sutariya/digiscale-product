"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Logo from "@/components/ui/logo";
import { Button } from "@/components/ui/button";

import {
  ChevronDown,
  Wand2,
  Scan,
  Sparkles,
  Layers3,
  Factory,
  Home,
  ShoppingBag,
  Store,
  FileText,
  Flag,
  Headphones,
  ArrowRight,
  Zap,
  Shirt,
  Gem,
  Car,
  Utensils,
  Crop,
  Palette,
  TrendingUp,
} from "lucide-react";

const menus = [
  {
    title: "Features",
    items: [
      {
        icon: Wand2,
        title: "Background Removal",
        description: "Remove background without changing the product.",
        href: "#",
      },
      {
        icon: Scan,
        title: "White Background",
        description: "Marketplace ready white background.",
        href: "#",
      },
      {
        icon: Sparkles,
        title: "AI Enhancement",
        description: "Improve clarity while preserving the product.",
        href: "#",
      },
      {
        icon: Layers3,
        title: "Shadow Generator",
        description: "Generate realistic natural shadows.",
        href: "#",
      },
      {
        icon: Layers3,
        title: "Batch Processing",
        description: "Remove background from multiple images.",
        href: "#",
      },
      {
        icon: Palette,
        title: "Custom Backgrounds",
        description: "Upload your own backdrops or scenery.",
        href: "#",
      },
      {
        icon: Crop,
        title: "Resize & Crop",
        description: "Export in perfect dimensions for web stores.",
        href: "#",
      },
      {
        icon: TrendingUp,
        title: "AI Image Upscaler",
        description: "Increase product image resolution to 4K.",
        href: "#",
      },
    ],
    featured: {
      tag: "New",
      title: "AI Studio Scenes",
      desc: "Place your product on marble stands, wooden tables, or studio backdrops in one click.",
      link: "/workspace",
      actionText: "Try Studio",
    }
  },
  {
    title: "Solutions",
    items: [
      {
        icon: ShoppingBag,
        title: "Shopify Stores",
        description: "AI workflow for Shopify merchants.",
        popular: true,
        href: "#",
      },
      {
        icon: Store,
        title: "Amazon Sellers",
        description: "Marketplace optimized product photos.",
        popular: true,
        href: "#",
      },
      {
        icon: Shirt,
        title: "Fashion & Apparel",
        description: "Clean studio-ready clothing cutouts.",
        href: "#",
      },
      {
        icon: Gem,
        title: "Jewelry & Luxury",
        description: "Reflection-free high-detail jewelry photography.",
        href: "#",
      },
      {
        icon: Factory,
        title: "Manufacturers",
        description: "Bulk catalog photography automation.",
        href: "#",
      },
      {
        icon: Home,
        title: "Home Decor Brands",
        description: "Perfect for decorative products.",
        href: "#",
      },
      {
        icon: Car,
        title: "Automotive Parts",
        description: "Clean cutouts for industrial and car parts.",
        href: "#",
      },
      {
        icon: Utensils,
        title: "Food & Beverage",
        description: "Appetizing packaging & gourmet highlights.",
        href: "#",
      },
    ],
    featured: {
      tag: "Integration",
      title: "DigiScale Sync API",
      desc: "Connect your store and automatically enhance thousands of product images overnight.",
      link: "/contact",
      actionText: "Request API Access",
    }
  },
  {
    title: "Resources",
    items: [
      {
        icon: FileText,
        title: "Documentation",
        description: "Developer guides & API.",
        href: "/documentation",
      },
      {
        icon: Flag,
        title: "Roadmap",
        description: "See upcoming features.",
        href: "/roadmap",
      },
      {
        icon: Headphones,
        title: "Contact Sales",
        description: "Talk to our team.",
        href: "/contact",
      },
    ],
    featured: {
      tag: "Case Study",
      title: "Ecommerce Success",
      desc: "How a top jewelry brand increased sales by 37% using DigiScale AI shadow enhancement.",
      link: "/roadmap",
      actionText: "Read Story",
    }
  },
];

export default function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${
      scrolled 
        ? "h-16 bg-white/75 backdrop-blur-md border-b border-slate-200/80 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)]" 
        : "h-20 bg-white/95 border-b border-slate-200"
    } shrink-0 relative`}>
      <div className="mx-auto max-w-[1400px] w-full h-full flex items-center justify-between px-8">

        {/* Left: Logo */}
        <div className="w-48 flex-shrink-0 flex-start flex items-center">
          <Logo href="/" />
        </div>

        {/* Center: Navigation Menu */}
        <nav className="hidden lg:flex items-center gap-1 z-50">
          {menus.map((menu) => (
            <div
              key={menu.title}
              className="group"
            >
              <button className="flex items-center gap-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-blue-600">
                {menu.title}
                <ChevronDown
                  size={16}
                  className="transition-transform duration-200 group-hover:rotate-180"
                />
              </button>

              {/* Floating Mega-Menu Dropdown (aligned with max-1400px container bounds) */}
              <div className="invisible absolute left-1/2 -translate-x-1/2 w-[calc(100vw-64px)] max-w-[1400px] top-[calc(100%+12px)] bg-white border border-slate-200/85 rounded-3xl shadow-[0_30px_70px_rgba(0,0,0,0.12)] opacity-0 transition-all duration-200 group-hover:visible group-hover:translate-y-1 group-hover:opacity-100 z-50">
                <div className="px-12 py-10">
                  <div className="grid grid-cols-12 gap-10">
                    
                    {/* Left: Core Navigation Menu Items (Grid) */}
                    <div className={`col-span-8 grid gap-6 ${menu.items.length > 4 ? "grid-cols-3" : "grid-cols-2"}`}>
                      {menu.items.map((item: any) => {
                        const Icon = item.icon;

                        return (
                          <Link
                            key={item.title}
                            href={item.href || "/workspace"}
                            className="flex items-center gap-3.5 rounded-xl p-3 transition duration-200 hover:bg-slate-50 border border-transparent hover:border-slate-100"
                          >
                            <div className="rounded-lg bg-blue-50 p-2.5 text-blue-600 shrink-0">
                              <Icon className="h-5 w-5" />
                            </div>

                            <p className="font-semibold text-slate-800 text-sm">
                              {item.title}
                            </p>
                          </Link>
                        );
                      })}
                    </div>

                    {/* Right: Featured Showcase / CTA Section */}
                    {menu.featured && (
                      <div className="col-span-4 border-l border-slate-100 pl-10 flex flex-col justify-between">
                        <div className="bg-gradient-to-br from-blue-50/80 via-indigo-50/30 to-white p-6 rounded-2xl border border-blue-100/40 shadow-sm flex flex-col h-full justify-between">
                          <div>
                            <span className="inline-flex items-center gap-1 rounded-md bg-blue-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-blue-800">
                              <Zap className="h-3 w-3 fill-current" />
                              {menu.featured.tag}
                            </span>

                            <h4 className="mt-3 text-sm font-black text-slate-900 tracking-tight">
                              {menu.featured.title}
                            </h4>

                            <p className="mt-2 text-xs text-slate-500 leading-relaxed font-semibold">
                              {menu.featured.desc}
                            </p>
                          </div>

                          <Link
                            href={menu.featured.link}
                            className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-750 transition group/link"
                          >
                            <span>{menu.featured.actionText}</span>
                            <ArrowRight className="h-3.5 w-3.5 transition group-hover/link:translate-x-1" />
                          </Link>
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              </div>
            </div>
          ))}

          <Link
            href="/pricing"
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-blue-600"
          >
            Pricing
          </Link>
        </nav>

        {/* Right: Action Buttons */}
        <div className="w-64 flex-shrink-0 flex items-center justify-end gap-3 z-50">
          <Button
            variant="outline"
            asChild
          >
            <Link href="/login">Login</Link>
          </Button>

          <Button asChild>
            <Link href="/signup">Get Started</Link>
          </Button>
        </div>

      </div>
    </header>
  );
}