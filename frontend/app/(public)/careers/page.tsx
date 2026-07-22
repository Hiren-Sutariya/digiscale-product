"use client";

import Link from "next/link";
import LandingNavbar from "@/components/layout/LandingNavbar";
import { Briefcase, MapPin, ArrowRight } from "lucide-react";

const openings = [
  {
    title: "Full Stack Engineer (Next.js & Python)",
    type: "Full-time",
    location: "Ahmedabad / Hybrid",
    description: "Own the development of our React-based Canvas workspaces, integrate real-time image rendering tools, and scale our Next.js backend infrastructure.",
  },
  {
    title: "Senior Machine Learning Engineer",
    type: "Full-time",
    location: "Ahmedabad Office",
    description: "Research, deploy, and optimize diffusion models and background segmentation networks to achieve 99.9% accuracy on transparent catalog extraction.",
  },
  {
    title: "Lead Product Designer (UI/UX)",
    type: "Full-time",
    location: "Remote / Ahmedabad",
    description: "Design pixel-perfect, interactive workspace editors. Standardize design systems and lead usability research for ecommerce store owners.",
  },
  {
    title: "Developer Relations (DevRel)",
    type: "Full-time",
    location: "Remote",
    description: "Create code tutorials, write documentation, and support developers integrating our high-speed image processing APIs directly into storefronts.",
  },
];

export default function CareersPage() {
  return (
    <>
      <LandingNavbar />

      <main className="flex-grow">
        {/* Hero */}
        <section className="py-12 px-6">
          <div className="mx-auto max-w-[1400px]">
            <div className="text-center mb-10">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-blue-700">
                Careers
              </span>
              <h1 className="mt-4 text-3xl sm:text-4xl font-black tracking-tight text-slate-900 leading-tight">
                Join Our <span className="text-blue-600">Team</span>
              </h1>
              <p className="mt-3 text-sm font-semibold text-slate-500 max-w-2xl mx-auto leading-relaxed">
                Help us build the future of AI-powered product photography. We&apos;re looking for passionate people who love building great products.
              </p>
            </div>
          </div>
        </section>

        {/* Openings */}
        <section className="py-16 px-6 bg-white border-t border-slate-200/50">
          <div className="mx-auto max-w-4xl">
            <div className="text-center mb-12">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 uppercase tracking-wider">
                Current Openings
              </span>
              <h2 className="mt-4 text-2xl font-black text-slate-900 tracking-tight">Open Positions</h2>
              <p className="mt-2 text-xs font-semibold text-slate-500 max-w-md mx-auto">Explore our vacancies and find your next role. Click apply to send us an email directly.</p>
            </div>

            <div className="space-y-4">
              {openings.map((job) => (
                <div
                  key={job.title}
                  className="group flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-3xl border border-slate-200/80 bg-white p-6 gap-6 hover:border-blue-300 hover:shadow-md transition-all duration-300"
                >
                  <div className="space-y-2">
                    <h3 className="font-bold text-slate-900 text-base leading-snug group-hover:text-blue-600 transition-colors">
                      {job.title}
                    </h3>
                    <p className="text-xs text-slate-500 font-semibold leading-relaxed max-w-xl">{job.description}</p>
                    
                    <div className="flex flex-wrap gap-4 text-xs font-semibold text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <Briefcase className="h-4 w-4 text-slate-400" />
                        {job.type}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4 text-slate-400" />
                        {job.location}
                      </span>
                    </div>
                  </div>

                  <a
                    href={`mailto:careers@digiscale.com?subject=Application for ${job.title}`}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-50 group-hover:bg-blue-600 border border-slate-200/60 group-hover:border-blue-600 px-5 py-3 text-xs font-bold text-slate-700 group-hover:text-white transition-all duration-300 active:scale-95 shrink-0"
                  >
                    <span>Apply Now</span>
                    <ArrowRight className="h-4.5 w-4.5" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
