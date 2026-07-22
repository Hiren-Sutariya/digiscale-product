"use client";

import LandingNavbar from "@/components/layout/LandingNavbar";
import { Cookie } from "lucide-react";

export default function CookiePolicyPage() {
  return (
    <>
      <LandingNavbar />

      <main className="flex-grow">
        <section className="py-12 px-6">
          <div className="mx-auto max-w-3xl">
            {/* Header */}
            <div className="text-center mb-10">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-blue-700">
                Legal
              </span>
              <h1 className="mt-4 text-3xl sm:text-4xl font-black tracking-tight text-slate-900 leading-tight">
                Cookie <span className="text-blue-600">Policy</span>
              </h1>
              <p className="mt-3 text-sm font-semibold text-slate-500 max-w-2xl mx-auto leading-relaxed">
                Last updated: July 14, 2026. Learn how we use cookies to deliver a faster, personalized user experience.
              </p>
            </div>

            {/* Document Container */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-10 shadow-sm space-y-8">
              
              {/* Cookie notice */}
              <div className="flex gap-4 rounded-2xl bg-blue-50/50 border border-blue-100 p-5 items-start">
                <Cookie className="h-6 w-6 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-slate-900">How We Use Cookies</h4>
                  <p className="mt-1 text-xs text-slate-500 font-semibold leading-relaxed">
                    Cookies help us maintain secure browser sessions, remember workspace preferences, and analyze anonymized site traffic for optimizations.
                  </p>
                </div>
              </div>

              {/* Sections */}
              <div className="space-y-8 text-slate-600 text-sm font-semibold leading-relaxed">
                
                <section className="space-y-3">
                  <h2 className="text-base font-black text-slate-900 tracking-tight">1. What Are Cookies</h2>
                  <p>
                    Cookies are tiny files stored on your laptop, mobile phone, or tablet device by websites you visit. They are widely used to make applications load faster and function correctly.
                  </p>
                </section>

                <section className="space-y-3">
                  <h2 className="text-base font-black text-slate-900 tracking-tight">2. Cookie Categories We Enforce</h2>
                  <p>
                    We classify cookies into three main layers depending on their functionality:
                  </p>
                  <ul className="list-disc pl-5 space-y-2.5 text-xs font-medium text-slate-500">
                    <li>
                      <strong>Essential Session Cookies</strong>: Critical for maintaining logins, managing workspace states, and security tokens. Deactivating these will break core canvas functions.
                    </li>
                    <li>
                      <strong>Preference Tracking</strong>: Saves your custom app settings, preferred export dimensions, and layout configurations.
                    </li>
                    <li>
                      <strong>Analytics Cookies</strong>: Aggregates anonymous user behavior metrics (bounce rates, landing page counts) so we can scale server infrastructure loads.
                    </li>
                  </ul>
                </section>

                <section className="space-y-3">
                  <h2 className="text-base font-black text-slate-900 tracking-tight">3. Managing and Deactivating Cookies</h2>
                  <p>
                    Most desktop and mobile browsers accept cookies automatically. If you wish to disable or customize cookie handling:
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5 text-xs font-medium text-slate-500">
                    <li>Open your browser settings (Chrome, Safari, Firefox, Edge).</li>
                    <li>Navigate to Privacy & Security settings.</li>
                    <li>Select &apos;Manage Cookies&apos; to block or delete local storage records.</li>
                  </ul>
                </section>

                <section className="space-y-3 border-t border-slate-100 pt-6">
                  <h2 className="text-base font-black text-slate-900 tracking-tight">4. Privacy Contact</h2>
                  <p>
                    If you have questions, feedback, or concerns regarding our cookie usage policy, please contact our privacy compliance officer:
                  </p>
                  <p className="mt-2 text-xs font-bold text-blue-600">
                    Email: privacy@digiscale.com
                  </p>
                </section>

              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
