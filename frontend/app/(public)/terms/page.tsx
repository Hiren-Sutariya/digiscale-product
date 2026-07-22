"use client";

import LandingNavbar from "@/components/layout/LandingNavbar";
import { FileText } from "lucide-react";

export default function TermsPage() {
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
                Terms of <span className="text-blue-600">Service</span>
              </h1>
              <p className="mt-3 text-sm font-semibold text-slate-500 max-w-2xl mx-auto leading-relaxed">
                Last updated: July 14, 2026. Please read our service agreement terms carefully.
              </p>
            </div>

            {/* Document Container */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-10 shadow-sm space-y-8">
              
              {/* Acceptance notice */}
              <div className="flex gap-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 p-5 items-start">
                <FileText className="h-6 w-6 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-slate-900">User Agreement Acceptance</h4>
                  <p className="mt-1 text-xs text-slate-500 font-semibold leading-relaxed">
                    By creating an account, accessing, or using DigiScale Product Studio, you explicitly agree to follow and be bound by these Terms of Service.
                  </p>
                </div>
              </div>

              {/* Sections */}
              <div className="space-y-8 text-slate-600 text-sm font-semibold leading-relaxed">
                
                <section className="space-y-3">
                  <h2 className="text-base font-black text-slate-900 tracking-tight">1. Services Provided</h2>
                  <p>
                    DigiScale provides AI-based background removal, scaling, aspect ratio adjustments, and lighting enhancements for ecommerce products.
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5 text-xs font-medium text-slate-500">
                    <li>The quality of AI output depends directly on the resolution, lighting, and angles of the original image upload.</li>
                    <li>We reserve the right to deploy background updates, API updates, or feature deprecations to improve system reliability.</li>
                  </ul>
                </section>

                <section className="space-y-3">
                  <h2 className="text-base font-black text-slate-900 tracking-tight">2. Account Responsibility</h2>
                  <p>
                    When registering an account with us, you agree to:
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5 text-xs font-medium text-slate-500">
                    <li>Maintain secure credentials and prevent unauthorized access to your workspace tokens.</li>
                    <li>Accept full responsibility for all activities, image processing runs, and API calls made under your account credentials.</li>
                  </ul>
                </section>

                <section className="space-y-3">
                  <h2 className="text-base font-black text-slate-900 tracking-tight">3. Image Asset Rules & Guidelines</h2>
                  <p>
                    You retain 100% intellectual property ownership over the photos you upload and download. However, you are strictly prohibited from uploading images that:
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5 text-xs font-medium text-slate-500">
                    <li>Infringe copyright, trademark, or proprietary patents of third parties.</li>
                    <li>Contain explicit, offensive, hateful, or harmful content. We use automated filters to moderate and restrict harmful uploads.</li>
                  </ul>
                </section>

                <section className="space-y-3">
                  <h2 className="text-base font-black text-slate-900 tracking-tight">4. Credit Systems & Payments</h2>
                  <p>
                    Subscriptions and transactional image credits are handled as follows:
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5 text-xs font-medium text-slate-500">
                    <li><strong>Billing cycle</strong>: Subscriptions run on a monthly recurring basis and can be cancelled at any time via your settings dashboard.</li>
                    <li><strong>Refunds</strong>: Since image credits consume compute GPU resources instantly, refunds are analyzed on a case-by-case basis within 7 days of subscription activation.</li>
                  </ul>
                </section>

                <section className="space-y-3 border-t border-slate-100 pt-6">
                  <h2 className="text-base font-black text-slate-900 tracking-tight">5. Contact and Legal Inquiries</h2>
                  <p>
                    For questions, feedback, or dispute resolutions regarding these terms, please reach out to our legal department:
                  </p>
                  <p className="mt-2 text-xs font-bold text-blue-600">
                    Email: legal@digiscale.com
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
