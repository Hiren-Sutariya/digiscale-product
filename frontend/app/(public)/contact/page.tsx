"use client";

import { useState } from "react";
import LandingNavbar from "@/components/layout/LandingNavbar";
import { Mail, Phone, MapPin, Send, CheckCircle, ArrowRight, ShieldCheck, Building2, HelpCircle } from "lucide-react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    subject: "Enterprise Trial",
    message: "",
  });
  
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to submit request.");
      }

      setSent(true);
      setFormData({
        name: "",
        email: "",
        company: "",
        phone: "",
        subject: "Enterprise Trial",
        message: "",
      });
    } catch (err: any) {
      setErrorMsg(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <>
      <LandingNavbar />

      <main className="bg-gradient-to-br from-blue-50/40 via-slate-50 to-indigo-50/40">
        
        {/* Main Content: Form & Info */}
        <section className="py-8 px-6">
          <div className="mx-auto max-w-[1400px]">
            {/* Compact Centered Header */}
            <div className="text-center mb-10">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-blue-700">
                Contact Sales
              </span>
              <h1 className="mt-4 text-3xl sm:text-4xl font-black tracking-tight text-slate-900 leading-tight">
                Get in <span className="text-blue-600">Touch</span>
              </h1>
              <p className="mt-3 text-sm font-semibold text-slate-500 max-w-2xl mx-auto leading-relaxed">
                Have a high-volume store or need custom API integration? Contact our enterprise team.
              </p>
            </div>

            <div className="grid gap-12 lg:grid-cols-12 items-start">
              
              {/* Left Column: Form Card (7 cols) */}
              <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] p-8 sm:p-10 relative overflow-hidden">
                {sent ? (
                  <div className="flex flex-col items-center py-16 text-center">
                    <div className="rounded-full bg-green-50 p-4 text-green-500 ring-8 ring-green-50/50">
                      <CheckCircle className="h-16 w-16" />
                    </div>
                    <h3 className="mt-8 text-2xl font-black text-slate-900 tracking-tight">
                      Message Sent Successfully!
                    </h3>
                    <p className="mt-3 text-sm text-slate-500 max-w-md font-semibold leading-relaxed">
                      Thank you for reaching out. One of our enterprise product specialists will contact you within the next 12 to 24 hours.
                    </p>
                    <button
                      onClick={() => setSent(false)}
                      className="mt-8 rounded-2xl bg-blue-600 px-8 py-3.5 text-sm font-bold text-white transition hover:bg-blue-700 shadow-lg shadow-blue-600/20 active:scale-95"
                    >
                      Send Another Message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">
                      Send a Message
                    </h3>
                    
                    {errorMsg && (
                      <div className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-600 border border-red-100">
                        {errorMsg}
                      </div>
                    )}

                    <div className="grid gap-6 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600">
                          Full Name
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                          placeholder="Your full name"
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50/30 py-3.5 px-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600">
                          Work Email
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                          placeholder="you@company.com"
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50/30 py-3.5 px-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                        />
                      </div>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600">
                          Company Name
                        </label>
                        <input
                          type="text"
                          name="company"
                          value={formData.company}
                          onChange={handleInputChange}
                          placeholder="Your brand / store name"
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50/30 py-3.5 px-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600">
                          Phone Number (Optional)
                        </label>
                        <input
                          type="text"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="+1 (555) 000-0000"
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50/30 py-3.5 px-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600">
                        Inquiry Reason
                      </label>
                      <select
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50/30 py-3.5 px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                      >
                        <option value="Enterprise Trial">Request Enterprise Trial</option>
                        <option value="API Integration">API Access & Automation</option>
                        <option value="Custom Shadow Models">Custom AI Shadow Training</option>
                        <option value="General Support">General Sales Inquiry</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600">
                        Message / Details
                      </label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        rows={5}
                        required
                        placeholder="Tell us about your brand, monthly photo volume, and requirements..."
                        className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50/30 py-3.5 px-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2 rounded-2xl bg-blue-600 py-4 px-6 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-50 shadow-lg shadow-blue-600/10 active:scale-95"
                    >
                      {loading ? (
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          <span>Submit Request</span>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>

              {/* Right Column: Cards & Trust Badges (5 cols) */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* FAQ Snippet Card */}
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.03)] p-6 flex items-start gap-4">
                  <div className="rounded-2xl bg-blue-50 p-3 text-blue-600 shrink-0">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm tracking-tight">Enterprise Level Security</h4>
                    <p className="mt-1.5 text-xs font-semibold text-slate-500 leading-relaxed">
                      We protect your image data with bank-grade security. Photos processed are private, encrypted, and never sold.
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.03)] p-6 flex items-start gap-4">
                  <div className="rounded-2xl bg-blue-50 p-3 text-blue-600 shrink-0">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm tracking-tight">High-Volume Workflows</h4>
                    <p className="mt-1.5 text-xs font-semibold text-slate-500 leading-relaxed">
                      Connect via Shopify or WooCommerce Sync to update thousands of images automatically overnight.
                    </p>
                  </div>
                </div>

                {/* Direct Contact Cards */}
                <div className="bg-slate-900 text-slate-100 rounded-3xl p-8 space-y-6 relative overflow-hidden">
                  <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-blue-600/10 blur-2xl" />

                  <h4 className="font-black text-white text-base tracking-tight">Direct Information</h4>

                  <div className="space-y-4">
                    <a href="mailto:hello@digiscale.com" className="flex items-center gap-3.5 text-sm hover:text-blue-400 transition font-semibold">
                      <div className="rounded-xl bg-white/10 p-2.5 text-blue-400">
                        <Mail className="h-4 w-4" />
                      </div>
                      hello@digiscale.com
                    </a>

                    <a href="tel:+919876543210" className="flex items-center gap-3.5 text-sm hover:text-blue-400 transition font-semibold">
                      <div className="rounded-xl bg-white/10 p-2.5 text-blue-400">
                        <Phone className="h-4 w-4" />
                      </div>
                      +91 98765 43210
                    </a>

                    <div className="flex items-center gap-3.5 text-sm font-semibold">
                      <div className="rounded-xl bg-white/10 p-2.5 text-blue-400">
                        <MapPin className="h-4 w-4" />
                      </div>
                      Ahmedabad, Gujarat, India
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>
        </section>

      </main>
    </>
  );
}
