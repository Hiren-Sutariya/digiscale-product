"use client";

import LandingNavbar from "@/components/layout/LandingNavbar";
import { Target, Eye, Heart, Compass, ShieldCheck, Users } from "lucide-react";

export default function AboutPage() {
  return (
    <>
      <LandingNavbar />

      <main className="flex-grow">
        {/* Hero */}
        <section className="py-12 px-6">
          <div className="mx-auto max-w-[1400px]">
            <div className="text-center mb-10">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-blue-700">
                About Us
              </span>
              <h1 className="mt-4 text-3xl sm:text-4xl font-black tracking-tight text-slate-900 leading-tight">
                Building the Future of <span className="text-blue-600">Product Photography</span>
              </h1>
              <p className="mt-3 text-sm font-semibold text-slate-500 max-w-2xl mx-auto leading-relaxed">
                DigiScale Product Studio is an AI-powered product photography platform built for ecommerce brands. We help businesses create clean, professional, marketplace-ready product images without changing the original product.
              </p>
            </div>
          </div>
        </section>

        {/* Our Story & Journey */}
        <section className="py-16 px-6 border-t border-slate-200/50 bg-white">
          <div className="mx-auto max-w-5xl">
            <div className="grid gap-12 md:grid-cols-2 items-center">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 uppercase tracking-wider">
                  Our Journey
                </span>
                <h2 className="mt-4 text-2xl font-black text-slate-900 tracking-tight">How DigiScale Started</h2>
                <p className="mt-4 text-sm font-semibold text-slate-500 leading-relaxed">
                  DigiScale was founded in 2024 by a team of computer vision engineers and ecommerce experts. We noticed a major bottleneck for online brands: high-quality product photography was expensive, slow, and required complex studio setups.
                </p>
                <p className="mt-3 text-sm font-semibold text-slate-500 leading-relaxed">
                  We set out to build an AI platform that could do all the heavy lifting—removing noisy backgrounds, rendering highly realistic light and shadows, and upscaling assets—while keeping the physical product 100% original.
                </p>
              </div>

              <div className="space-y-6 border-l-2 border-slate-100 pl-6 md:pl-10">
                <div className="relative">
                  <div className="absolute -left-[31px] sm:-left-[47px] top-1 bg-blue-600 h-3 w-3 rounded-full border-2 border-white ring-4 ring-blue-50" />
                  <span className="text-xs font-black text-blue-600">2024</span>
                  <h4 className="text-sm font-bold text-slate-800">The Birth of DigiScale</h4>
                  <p className="text-xs font-semibold text-slate-500 mt-1">Founded with the core goal of simplifying cataloging operations for SMBs.</p>
                </div>

                <div className="relative">
                  <div className="absolute -left-[31px] sm:-left-[47px] top-1 bg-indigo-600 h-3 w-3 rounded-full border-2 border-white ring-4 ring-indigo-50" />
                  <span className="text-xs font-black text-indigo-600">2025</span>
                  <h4 className="text-sm font-bold text-slate-800">Next-Gen AI Shadows</h4>
                  <p className="text-xs font-semibold text-slate-500 mt-1">Launched our proprietary deep-learning engine for realistic background extraction.</p>
                </div>

                <div className="relative">
                  <div className="absolute -left-[31px] sm:-left-[47px] top-1 bg-emerald-600 h-3 w-3 rounded-full border-2 border-white ring-4 ring-emerald-50" />
                  <span className="text-xs font-black text-emerald-600">2026</span>
                  <h4 className="text-sm font-bold text-slate-800">Scaling Up Globally</h4>
                  <p className="text-xs font-semibold text-slate-500 mt-1">Reaching over 10,000 active sellers and supporting major global marketplaces.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-16 px-6">
          <div className="mx-auto max-w-[1400px]">
            <div className="text-center mb-12">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-blue-700">
                Core Principles
              </span>
              <h2 className="mt-4 text-2xl font-black text-slate-900 tracking-tight">Values That Guide Us</h2>
            </div>

            <div className="grid gap-8 md:grid-cols-3 max-w-6xl mx-auto">
              <div className="rounded-3xl border border-slate-200/80 bg-white p-8 shadow-sm">
                <Target className="h-8 w-8 text-blue-600" />
                <h3 className="mt-5 text-lg font-bold text-slate-900">Our Mission</h3>
                <p className="mt-3 text-sm font-semibold leading-relaxed text-slate-500">
                  To make professional product photography accessible to every ecommerce seller, from small home-grown brands to enterprise manufacturers.
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200/80 bg-white p-8 shadow-sm">
                <Eye className="h-8 w-8 text-blue-600" />
                <h3 className="mt-5 text-lg font-bold text-slate-900">Our Vision</h3>
                <p className="mt-3 text-sm font-semibold leading-relaxed text-slate-500">
                  A world where every product sold online has professional, consistent, and accurate photography that builds long-lasting customer trust.
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200/80 bg-white p-8 shadow-sm">
                <Heart className="h-8 w-8 text-blue-600" />
                <h3 className="mt-5 text-lg font-bold text-slate-900">Our Promise</h3>
                <p className="mt-3 text-sm font-semibold leading-relaxed text-slate-500">
                  We never alter your physical product shape or details. No fake AI generation. Your product stays 100% original — we only improve the backdrop and lighting.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Built in India */}
        <section className="py-16 px-6 bg-white border-t border-slate-100">
          <div className="mx-auto max-w-4xl text-center">
            <span className="text-4xl">🇮🇳</span>
            <h2 className="mt-4 text-2xl font-black text-slate-900 tracking-tight">Proudly Built in India</h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm font-semibold text-slate-500 leading-relaxed">
              DigiScale is designed and developed in India to empower digital commerce sellers. We understand the unique challenges of local shop owners, catalog managers, and direct-to-consumer (D2C) brands, building workflows that solve them instantly.
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
