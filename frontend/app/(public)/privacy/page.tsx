"use client";

import LandingNavbar from "@/components/layout/LandingNavbar";
import { ShieldCheck } from "lucide-react";

export default function PrivacyPolicyPage() {
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
                Privacy <span className="text-blue-600">Policy</span>
              </h1>
              <p className="mt-3 text-sm font-semibold text-slate-500 max-w-2xl mx-auto leading-relaxed">
                Last updated: July 14, 2026. Please read our privacy guidelines to understand how we protect your image data.
              </p>
            </div>

            {/* Document Container */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-10 shadow-sm space-y-8">
              
              {/* Compliance Notice Badge */}
              <div className="flex gap-4 rounded-2xl bg-blue-50/50 border border-blue-100 p-5 items-start">
                <ShieldCheck className="h-6 w-6 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Privacy Compliance Statement</h4>
                  <p className="mt-1 text-xs text-slate-500 font-semibold leading-relaxed">
                    Our data processing practices are built to comply with India&apos;s IT Act 2000, GDPR standards for European users, and strict encryption protocols.
                  </p>
                </div>
              </div>

              {/* Sections */}
              <div className="space-y-8 text-slate-600 text-sm font-semibold leading-relaxed">
                
                <section className="space-y-3">
                  <h2 className="text-base font-black text-slate-900 tracking-tight">1. Information We Collect</h2>
                  <p>
                    We collect personal data you provide directly when creating accounts, selecting pricing subscriptions, or communicating with sales. This includes:
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5 text-xs font-medium text-slate-500">
                    <li>Account credentials: Name, email address, password hashes.</li>
                    <li>Billing data: Payment processor IDs (we do not store raw credit card details).</li>
                    <li>Customer support requests and log reports.</li>
                  </ul>
                </section>

                <section className="space-y-3">
                  <h2 className="text-base font-black text-slate-900 tracking-tight">2. Image Upload Data Handling</h2>
                  <p>
                    Images you upload to DigiScale Product Studio are processed in memory by our AI models.
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5 text-xs font-medium text-slate-500">
                    <li><strong>Processing Limits</strong>: We only read image pixels to remove backgrounds, optimize resolution, and render custom shadows.</li>
                    <li><strong>No Model Training</strong>: We never use customer uploaded photos to train our public baseline model weights. Your product assets stay yours.</li>
                    <li><strong>Storage</strong>: Raw uploads and outputs are stored securely and deleted automatically from the server after 30 days unless saved in your workspace projects.</li>
                  </ul>
                </section>

                <section className="space-y-3">
                  <h2 className="text-base font-black text-slate-900 tracking-tight">3. Data Sharing & Third Parties</h2>
                  <p>
                    We do not sell, trade, or share your personal information or image assets with external advertising networks. We only share transaction metadata with verified processors:
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5 text-xs font-medium text-slate-500">
                    <li>Cloud infrastructure host: Amazon Web Services (AWS) / Google Cloud.</li>
                    <li>Payment processing: Razorpay / Stripe.</li>
                    <li>Email delivery systems for system notifications.</li>
                  </ul>
                </section>

                <section className="space-y-3">
                  <h2 className="text-base font-black text-slate-900 tracking-tight">4. Security Measures</h2>
                  <p>
                    We enforce strict security procedures:
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5 text-xs font-medium text-slate-500">
                    <li>Full SSL/TLS encryption for all data in transit.</li>
                    <li>AES-256 database-level encryption for user database entries.</li>
                    <li>Strict IAM credentials restricting internal engineer access to raw customer uploads.</li>
                  </ul>
                </section>

                <section className="space-y-3 border-t border-slate-100 pt-6">
                  <h2 className="text-base font-black text-slate-900 tracking-tight">5. Contact and Privacy Rights</h2>
                  <p>
                    You have the right to request deletion of your account and all associated processed images at any time. For privacy inquiries, data deletion requests, or questions, contact us:
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
