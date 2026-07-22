"use client";

import { useState } from "react";
import LandingNavbar from "@/components/layout/LandingNavbar";
import { CheckCircle2, Clock, Rocket, ChevronUp, Webhook, LayoutGrid, ShoppingBag, Maximize2, Sliders, Sparkles } from "lucide-react";

const completed = [
  "Background Removal AI Engine",
  "White Background Generation",
  "Instant Image Upload & Preview",
  "Landing Page & Dashboard UI",
  "User Authentication & Guest Flow",
  "Workspace Direct Redirects",
];

const inProgress = [
  "Custom AI Shadow Generator",
  "AI Image Enhancement (Resolution)",
  "Store-Sync Batch Processing API",
  "Fast Database & Session Caching",
];

const upcoming = [
  "Razorpay Payment Escrows",
  "Shopify & Amazon App Store Listings",
  "Custom AI Shadow Fine-Tuning",
  "Multi-user Team Workspaces",
  "Mobile Progressive App",
];

export default function RoadmapPage() {
  const [ideas, setIdeas] = useState([
    {
      id: "figma",
      title: "Figma Plugin Integration",
      desc: "Clean background and overlay realistic shadows directly inside Figma design frames.",
      icon: LayoutGrid,
      status: "Reviewing",
      statusColor: "bg-slate-100 text-slate-700 border-slate-200",
      votes: 42,
      voted: false,
    },
    {
      id: "webhooks",
      title: "Webhooks for Batch Jobs",
      desc: "Get automated POST notifications to your server when bulk processing runs finish.",
      icon: Webhook,
      status: "Planned",
      statusColor: "bg-blue-50 text-blue-700 border-blue-100",
      votes: 28,
      voted: false,
    },
    {
      id: "shadow-builder",
      title: "AI Drop-Shadow Builder",
      desc: "Draw light vectors to control drop shadow length, soft blur, and direction.",
      icon: Sparkles,
      status: "Planned",
      statusColor: "bg-blue-50 text-blue-700 border-blue-100",
      votes: 47,
      voted: false,
    },
    {
      id: "bigcommerce",
      title: "BigCommerce Sync Integration",
      desc: "Import product catalogs from BigCommerce stores and sync back processed photos.",
      icon: ShoppingBag,
      status: "Suggested",
      statusColor: "bg-purple-50 text-purple-700 border-purple-100",
      votes: 19,
      voted: false,
    },
    {
      id: "crop",
      title: "Custom Aspect Ratio Margins",
      desc: "Define exact pixel padding and center products for custom marketplace exports.",
      icon: Maximize2,
      status: "Planned",
      statusColor: "bg-blue-50 text-blue-700 border-blue-100",
      votes: 35,
      voted: false,
    },
    {
      id: "lightroom",
      title: "Lightroom Classic Plugin",
      desc: "One-click background removal directly inside Adobe Lightroom catalogs.",
      icon: Sliders,
      status: "Suggested",
      statusColor: "bg-purple-50 text-purple-700 border-purple-100",
      votes: 22,
      voted: false,
    },
  ]);

  const handleVote = (id: string) => {
    setIdeas((prev) =>
      prev.map((idea) => {
        if (idea.id === id) {
          return {
            ...idea,
            votes: idea.voted ? idea.votes - 1 : idea.votes + 1,
            voted: !idea.voted,
          };
        }
        return idea;
      })
    );
  };

  return (
    <>
      <LandingNavbar />

      <main className="bg-gradient-to-br from-blue-50/40 via-slate-50 to-indigo-50/40">
        
        {/* Section 1: Main Status Roadmap */}
        <section className="py-8 px-6">
          <div className="mx-auto max-w-[1400px]">
            
            {/* Header Block (Compact to save vertical space) */}
            <div className="mb-10 text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-4 py-1.5 text-xs font-bold text-blue-700 uppercase tracking-wider">
                Product Status
              </span>
              <h1 className="mt-4 text-3xl sm:text-4xl font-black tracking-tight text-slate-900 leading-tight">
                DigiScale <span className="text-blue-600">Product Roadmap</span>
              </h1>
              <p className="mt-3 text-sm font-semibold text-slate-500 max-w-2xl mx-auto">
                Follow our development lifecycle and check upcoming features planned for release.
              </p>
            </div>

            {/* 3-Column Roadmap Layout */}
            <div className="grid gap-8 lg:grid-cols-3 items-stretch">
              
              {/* Column 1: Completed */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.03)] p-8 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-6 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl bg-green-50 p-2.5 text-green-600">
                        <CheckCircle2 className="h-6 w-6" />
                      </div>
                      <h2 className="text-lg font-black text-slate-900 tracking-tight">Completed</h2>
                    </div>
                    <span className="rounded-full bg-green-100 px-3 py-1 text-[10px] font-bold text-green-700 uppercase">Live</span>
                  </div>

                  <ul className="mt-6 space-y-4">
                    {completed.map((item) => (
                      <li key={item} className="flex items-start gap-3 text-slate-600 text-sm font-semibold leading-relaxed">
                        <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Column 2: In Progress */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.03)] p-8 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-6 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl bg-amber-50 p-2.5 text-amber-600">
                        <Clock className="h-6 w-6" />
                      </div>
                      <h2 className="text-lg font-black text-slate-900 tracking-tight">In Progress</h2>
                    </div>
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-[10px] font-bold text-amber-700 uppercase">Active</span>
                  </div>

                  <ul className="mt-6 space-y-4">
                    {inProgress.map((item) => (
                      <li key={item} className="flex items-start gap-3 text-slate-600 text-sm font-semibold leading-relaxed">
                        <Clock className="h-5 w-5 text-amber-500 shrink-0 mt-0.5 animate-pulse" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Column 3: Upcoming */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.03)] p-8 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-6 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl bg-blue-50 p-2.5 text-blue-600">
                        <Rocket className="h-6 w-6" />
                      </div>
                      <h2 className="text-lg font-black text-slate-900 tracking-tight">Upcoming</h2>
                    </div>
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-[10px] font-bold text-blue-700 uppercase">Planned</span>
                  </div>

                  <ul className="mt-6 space-y-4">
                    {upcoming.map((item) => (
                      <li key={item} className="flex items-start gap-3 text-slate-600 text-sm font-semibold leading-relaxed">
                        <Rocket className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Section 2: Interactive Feature Voting Board (3 Columns / 2 Rows) */}
        <section className="py-12 px-6">
          <div className="mx-auto max-w-[1400px] border-t border-slate-200/60 pt-16">
            <div className="text-center mb-12">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-blue-700">
                Interactive Board
              </span>
              <h2 className="mt-4 text-3xl font-black text-slate-900 tracking-tight">Community Feature Requests</h2>
              <p className="mt-3 text-sm font-semibold text-slate-500 max-w-2xl mx-auto">Vote on candidates or support existing requests. We prioritize features backed by user upvotes.</p>
            </div>

            {/* Redesigned 3-Column Grid containing exactly 6 items (3 top, 3 bottom) */}
            <div className="grid gap-6 md:grid-cols-3">
              {ideas.map((idea) => {
                const Icon = idea.icon;

                return (
                  <div
                    key={idea.id}
                    className="bg-white rounded-3xl border border-slate-200/80 p-6 flex gap-5 items-start shadow-[0_12px_30px_-10px_rgba(0,0,0,0.02)] hover:border-blue-300 hover:shadow-[0_15px_40px_-10px_rgba(59,130,246,0.06)] -translate-y-0 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group"
                  >
                    
                    {/* Left side: Upvote Box Button */}
                    <button
                      onClick={() => handleVote(idea.id)}
                      className={`flex flex-col items-center justify-center w-14 h-20 rounded-2xl border transition duration-200 active:scale-95 shrink-0 select-none ${
                        idea.voted
                          ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/20"
                          : "bg-slate-50 border-slate-200/60 text-slate-700 hover:bg-blue-50/50 hover:border-blue-200"
                      }`}
                    >
                      <ChevronUp className={`h-5 w-5 ${idea.voted ? "text-white" : "text-blue-600 group-hover:translate-y-[-2px] transition-transform"}`} />
                      <span className="text-xs font-extrabold mt-1">{idea.votes}</span>
                    </button>

                    {/* Right side: Content */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="rounded-xl bg-blue-50 p-2 text-blue-600 shrink-0">
                            <Icon className="h-4.5 w-4.5" />
                          </div>
                          <h4 className="font-bold text-slate-900 text-sm tracking-tight leading-snug group-hover:text-blue-600 transition-colors">
                            {idea.title}
                          </h4>
                        </div>
                        
                        <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${idea.statusColor}`}>
                          {idea.status}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                        {idea.desc}
                      </p>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Section 3: Release Cadence Details (Centered & Horizontal) */}
        <section className="pb-16 px-6">
          <div className="mx-auto max-w-[1400px] border-t border-slate-200/60 pt-16">
            <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-10 shadow-sm">
              <div className="text-center mb-8 border-b border-slate-100 pb-5">
                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                  Release Cadence & Feedback
                </h3>
              </div>
              
              <div className="grid gap-8 sm:grid-cols-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Weekly Minor Updates</h4>
                  <p className="mt-2 text-xs font-semibold text-slate-500 leading-relaxed">
                    We push bug fixes, layout enhancements, and minor optimization updates every Wednesday at 03:00 UTC.
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-800">Monthly Model Updates</h4>
                  <p className="mt-2 text-xs font-semibold text-slate-500 leading-relaxed">
                    Major upgrades to background extraction quality and shadow rendering logic are released on the 1st of every month.
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-800">Suggest a Feature</h4>
                  <p className="mt-2 text-xs font-semibold text-slate-500 leading-relaxed">
                    Have a request? We prioritize popular community requests. Drop us an inquiry on our contact page to start the discussion.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>
    </>
  );
}
