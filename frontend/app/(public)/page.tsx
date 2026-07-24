"use client";

import { useState, useEffect, useRef } from "react";
import LandingNavbar from "@/components/layout/LandingNavbar";
import Footer from "@/components/layout/Footer";
import Link from "next/link";
import Logo from "@/components/ui/logo";
import { uploadImage } from "@/services/api";
import { plans } from "@/lib/plans";
import { saveFileToIndexedDB } from "@/lib/db";
import Script from "next/script";
import { API_BASE_URL } from "@/constants/api";
import { CheckCircle2, Sparkles } from "lucide-react";

declare global {
  interface Window {
    Razorpay: any;
  }
}

import {
  ShieldCheck,
  Palette,
  ShoppingBag,
  Store,
  Lock,
  Gem,
  Home,
  Factory,
  Check,
  Camera,
  ChevronDown,
  Loader2,
  AlertCircle,
  Upload,
} from "lucide-react";


const users = [
  {
    icon: ShoppingBag,
    title: "Shopify Stores",
    desc: "Professional product photos for online stores.",
  },
  {
    icon: Store,
    title: "Amazon Sellers",
    desc: "Marketplace-ready catalog images.",
  },
  {
    icon: Home,
    title: "Home Decor Brands",
    desc: "Plants, ceramics and decoration products.",
  },
  {
    icon: Factory,
    title: "Manufacturers",
    desc: "Bulk product photography workflows.",
  },
  {
    icon: Palette,
    title: "Handmade Sellers",
    desc: "Jewelry, gifts and handcrafted products.",
  },
  {
    icon: Camera,
    title: "Studios",
    desc: "Speed up product editing with AI.",
  },
];

export default function HomePage() {
  const [guestCount, setGuestCount] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [homeBilling, setHomeBilling] = useState<"monthly" | "yearly">("monthly");
  const [payingPlan, setPayingPlan] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<{ plan: string; paymentId: string } | null>(null);
  const [razorpayReady, setRazorpayReady] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && window.Razorpay) {
      setRazorpayReady(true);
    }
  }, []);

  const handleCheckout = async (planName: string) => {
    if (planName === "Starter") {
      window.location.href = "/signup";
      return;
    }

    if (!razorpayReady) {
      alert("Payment gateway is loading. Please try again in a moment.");
      return;
    }

    setPayingPlan(planName);

    try {
      // 1. Create Razorpay order from backend
      const res = await fetch(`${API_BASE_URL}/api/payments/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planName, billing: homeBilling }),
      });

      if (!res.ok) throw new Error("Failed to create order");
      const orderData = await res.json();

      // 2. Open Razorpay Checkout popup
      const options = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "DigiScale Product Studio",
        description: `${planName} Plan — ${homeBilling === "yearly" ? "Annual" : "Monthly"} Subscription`,
        order_id: orderData.order_id,
        handler: async (response: any) => {
          // 3. Verify payment signature on backend
          try {
            const verifyRes = await fetch(`${API_BASE_URL}/api/payments/verify`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                plan: planName,
              }),
            });

            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              setPaymentSuccess({ plan: planName, paymentId: response.razorpay_payment_id });
            } else {
              alert("Payment verification failed. Contact support.");
            }
          } catch {
            alert("Verification error. Contact support.");
          }
        },
        prefill: {
          name: "",
          email: "",
        },
        theme: {
          color: "#2563EB",
        },
        modal: {
          ondismiss: () => setPayingPlan(null),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", () => {
        setPayingPlan(null);
        alert("Payment failed. Please try again.");
      });
      rzp.open();
      setPayingPlan(null);
    } catch (err) {
      setPayingPlan(null);
      alert("Could not initiate payment. Make sure the backend server is running.");
    }
  };


  useEffect(() => {
    if (typeof window !== "undefined") {
      const count = parseInt(localStorage.getItem("digiscale_guest_count") || "0");
      setGuestCount(count);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleFile = async (file: File) => {
    const currentCount = typeof window !== "undefined"
      ? parseInt(localStorage.getItem("digiscale_guest_count") || "0")
      : 0;

    if (currentCount >= 3) {
      setErrorMsg("Free try limit reached (3/3 images). Please log in or sign up to continue.");
      return;
    }

    setErrorMsg(null);

    try {
      if (typeof window !== "undefined") {
        // Save file raw content to IndexedDB for retrieval in workspace page
        await saveFileToIndexedDB(file);
        
        const nextCount = currentCount + 1;
        localStorage.setItem("digiscale_guest_count", String(nextCount));
        localStorage.setItem("digiscale_workspace_pending_file", "true");
        
        // Redirect directly to the full workspace editor page
        window.location.href = "/workspace";
      }
    } catch (err: any) {
      setErrorMsg("Failed to store image locally. Please try again.");
    }
  };

  return (
    <>
      <LandingNavbar />

      <main className="bg-gradient-to-br from-blue-50/30 via-slate-50 to-indigo-50/30">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-slate-50">

          {/* Background Blur */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute left-20 top-20 h-72 w-72 rounded-full bg-blue-100/50 opacity-60 blur-3xl" />
            <div className="absolute bottom-20 right-20 h-72 w-72 rounded-full bg-cyan-100/50 opacity-60 blur-3xl" />
          </div>

          <div className="mx-auto grid min-h-[78vh] max-w-7xl items-center gap-16 px-6 lg:grid-cols-2 py-10">

            {/* LEFT */}
            <div>
              <span className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
                AI Powered Product Photography
              </span>

              <h1 className="mt-8 text-4xl sm:text-5xl font-black leading-tight tracking-tight text-slate-900">
                Product Photos
                <span className="text-blue-600"> Without Changing </span>
                <br />
                Your Product.
              </h1>

              <p className="mt-6 max-w-xl text-sm sm:text-base font-semibold leading-relaxed text-slate-500">
                Remove backgrounds, enhance image quality and generate
                marketplace-ready product photos while preserving every
                product detail exactly as it is.
              </p>

              <div className="mt-10 space-y-4 text-slate-700">
                <div className="flex items-center gap-3">
                  <span className="text-green-600 font-bold">✔</span>
                  <span>100% Product Accuracy</span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-green-600 font-bold">✔</span>
                  <span>Marketplace Ready Export</span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-green-600 font-bold">✔</span>
                  <span>AI Enhancement</span>
                </div>
              </div>
            </div>

            {/* RIGHT */}
            <div>
              <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-2xl relative">
                
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-1.5">
                      🎁 Try DigiScale Free
                    </h3>
                    <p className="mt-2 text-sm text-slate-500">
                      No login required • No credit card
                    </p>
                  </div>

                  <span className="rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-700">
                    {guestCount >= 3 ? "0 FREE IMAGES" : `${3 - guestCount} FREE IMAGES`}
                  </span>
                </div>

                {/* Main Action Block */}
                {guestCount >= 3 ? (
                  /* Limit Reached block */
                  <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-6 text-center">
                    <span className="text-3xl">🚀</span>
                    <h4 className="mt-3 text-base font-extrabold text-slate-900">Free Tries Reached!</h4>
                    <p className="mt-2 text-xs text-slate-500 leading-relaxed font-semibold">
                      You have processed 3/3 guest images. To continue creating unlimited professional product photos, please sign up for a free account.
                    </p>
                    <Link
                      href="/signup"
                      className="mt-5 block w-full rounded-xl bg-blue-600 hover:bg-blue-700 py-3 text-sm font-bold text-white transition shadow-sm text-center"
                    >
                      Sign Up Free
                    </Link>
                  </div>
                ) : (
                  /* Premium Redesigned Interactive Upload Box Zone matching screenshot */
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const files = e.dataTransfer.files;
                      if (files && files[0]) {
                        handleFile(files[0]);
                      }
                    }}
                    className="mt-8 rounded-3xl border-2 border-dashed border-blue-300 bg-blue-50/40 p-10 text-center cursor-pointer transition hover:border-blue-500 hover:bg-blue-50"
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileChange}
                    />

                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-5xl">
                      ☁️
                    </div>

                    <h4 className="mt-6 text-xl font-bold text-slate-900">
                      Drag & Drop Product Image
                    </h4>

                    <p className="mt-3 text-slate-500">
                      or click to upload from device
                    </p>

                    <button className="mt-8 rounded-xl bg-blue-600 hover:bg-blue-700 px-8 py-4 font-semibold text-white transition">
                      Select Image
                    </button>

                    <p className="mt-6 text-sm text-slate-400">
                      Supports JPG • PNG • WEBP • HEIC (Max 10MB)
                    </p>
                  </div>
                )}

                {/* Error message helper */}
                {errorMsg && (
                  <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-100 text-xs font-bold text-red-700 flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

              </div>
            </div>

          </div>
        </section>



        {/* OKKKKKKkkkkkkkkk  */}

        <section className="border-y border-slate-200 bg-white">

          <div className="mx-auto max-w-7xl px-6 py-16">

            <div className="mx-auto max-w-3xl text-center">

              <span className="rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700">
                Our Promise
              </span>

              <h2 className="mt-6 text-3xl sm:text-4xl font-black text-slate-900 leading-tight">
                Your Product Always
                <span className="text-blue-600"> Stays Original.</span>
              </h2>

              <p className="mt-4 text-sm sm:text-base text-slate-500 font-semibold leading-relaxed">
                DigiScale never redesigns your product.
                We only improve the image quality, remove the background,
                enhance lighting and prepare it for marketplaces.
              </p>

            </div>

            <div className="mt-16 grid gap-8 md:grid-cols-2">

              {/* Allowed */}

              <div className="rounded-3xl border border-green-200 bg-green-50 p-8">

                <h3 className="text-2xl font-bold text-green-700">
                  ✅ What We Improve
                </h3>

                <ul className="mt-6 space-y-4 text-slate-700">

                  <li>Background Removal</li>

                  <li>White Background</li>

                  <li>Image Enhancement</li>

                  <li>Natural Shadows</li>

                  <li>HD Upscaling</li>

                </ul>

              </div>

              {/* Not Allowed */}

              <div className="rounded-3xl border border-red-200 bg-red-50 p-8">

                <h3 className="text-2xl font-bold text-red-600">
                  ❌ What We Never Change
                </h3>

                <ul className="mt-6 space-y-4 text-slate-700">

                  <li>Flower Shape</li>

                  <li>Leaf Count</li>

                  <li>Pot Design</li>

                  <li>Product Color</li>

                  <li>Product Size & Proportion</li>

                </ul>

              </div>

            </div>

          </div>
        </section>


        {/* OKKKKKKkkkkkkkkk  */}

        <section className="bg-white py-16">

          <div className="mx-auto max-w-7xl px-6">

            <div className="text-center">

              <span className="rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700">
                Built For Everyone
              </span>

              <h2 className="mt-6 text-3xl sm:text-4xl font-black text-slate-900 leading-tight">
                Designed for Modern
                <span className="text-blue-600"> Ecommerce.</span>
              </h2>

              <p className="mx-auto mt-3 max-w-2xl text-sm sm:text-base text-slate-500 font-semibold leading-relaxed">
                Whether you sell one product or thousands,
                DigiScale helps you create consistent,
                marketplace-ready product photos.
              </p>

            </div>

            <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">

              {users.map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-6 transition hover:-translate-y-1 hover:border-blue-200 hover:bg-white hover:shadow-lg"
                >

                  <item.icon className="h-6 w-6 text-blue-600" />

                  <h3 className="mt-5 text-xl font-bold">
                    {item.title}
                  </h3>

                  <p className="mt-3 leading-7 text-slate-600">
                    {item.desc}
                  </p>

                </div>
              ))}

            </div>

          </div>

        </section>

        <section className="bg-slate-50 py-16">
          <div className="mx-auto max-w-7xl px-6">

            {/* Heading */}
            <div className="text-center">
              <span className="rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700">
                Pricing
              </span>
              <h2 className="mt-5 text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
                Choose Your <span className="text-blue-600">Plan</span>
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-500 font-semibold leading-relaxed">
                Start free. Scale as you grow. No hidden fees, ever.
              </p>

              {/* Billing Toggle */}
              <div className="mt-8 flex items-center justify-center gap-3">
                <button
                  onClick={() => setHomeBilling("monthly")}
                  className={`rounded-2xl px-5 py-2.5 text-sm font-bold transition-all ${
                    homeBilling === "monthly"
                      ? "bg-white text-slate-900 shadow-sm border border-slate-200/80"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  Monthly Billing
                </button>
                <button
                  onClick={() => setHomeBilling("yearly")}
                  className={`rounded-2xl px-5 py-2.5 text-sm font-bold transition-all flex items-center gap-2 ${
                    homeBilling === "yearly"
                      ? "bg-white text-slate-900 shadow-sm border border-slate-200/80"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <span>Yearly Billing</span>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-700 uppercase tracking-wide">
                    Up to 18% Off
                  </span>
                </button>
              </div>
            </div>

            {/* Cards — center Pro card is taller/larger */}
            <div className="mt-12 grid gap-6 lg:grid-cols-3 max-w-6xl mx-auto items-stretch">
              {plans.map((plan) => {
                const displayPrice = homeBilling === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;
                return (
                  <div
                    key={plan.name}
                    className={`relative rounded-3xl border p-8 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 ${
                      plan.featured
                        ? "border-blue-600 bg-white shadow-xl shadow-blue-500/10 ring-2 ring-blue-100"
                        : "border-slate-200/80 bg-white shadow-sm"
                    }`}
                  >
                    {plan.featured && (
                      <span className="absolute right-6 top-6 rounded-full bg-blue-600 px-3 py-1.5 text-[10px] font-extrabold text-white uppercase tracking-wider">
                        MOST POPULAR
                      </span>
                    )}

                    <div>
                      <h3 className="text-xl font-black text-slate-900 tracking-tight">
                        {plan.name}
                      </h3>
                      <p className="mt-3 text-xs font-semibold text-slate-500 leading-relaxed">{plan.description}</p>

                      <div className="mt-8 border-b border-slate-100 pb-6 min-h-[96px] flex flex-col justify-end">
                        {homeBilling === "yearly" && plan.monthlyPrice > 0 && (
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm line-through text-slate-400 font-bold">₹{plan.monthlyPrice}</span>
                            <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-black text-emerald-700">
                              Save {plan.discountPercent}%
                            </span>
                          </div>
                        )}
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-black text-slate-900">
                            {typeof displayPrice === "number" ? (displayPrice === 0 ? "Free" : `₹${displayPrice}`) : displayPrice}
                          </span>
                          {typeof displayPrice === "number" && displayPrice > 0 && (
                            <span className="text-xs font-bold text-slate-400">/month</span>
                          )}
                        </div>
                        {homeBilling === "yearly" && typeof displayPrice === "number" && displayPrice > 0 && (
                          <span className="text-[10px] font-semibold text-slate-400 mt-1">
                            Billed annually (₹{displayPrice * 12}/yr)
                          </span>
                        )}
                      </div>

                      <ul className="mt-6 space-y-4">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-3">
                            <Check className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                            <span className="text-xs font-semibold text-slate-600 leading-relaxed">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      onClick={() => handleCheckout(plan.name)}
                      disabled={payingPlan === plan.name}
                      className={`mt-10 flex justify-center items-center gap-2 rounded-2xl px-6 py-4 text-sm font-bold transition active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed ${
                        plan.featured
                          ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-600/10"
                          : "border border-slate-200 hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      {payingPlan === plan.name ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Opening Checkout...</span>
                        </>
                      ) : (
                        <>
                          {plan.featured && <Sparkles className="h-4 w-4" />}
                          <span>{plan.button}</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

          </div>
        </section>

        {/* OKKKKKKkkkkkkkkk  */}

        <section className="bg-white py-16">

          <div className="mx-auto max-w-5xl px-6">

            <div className="relative overflow-hidden rounded-[36px] bg-slate-950 px-10 py-20 text-center shadow-2xl">

              {/* Background Blur */}

              <div className="absolute -left-20 top-0 h-72 w-72 rounded-full bg-blue-600/20 blur-3xl" />

              <div className="absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />

              {/* Content */}

              <div className="relative z-10">

                <span className="rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm font-medium text-white/80">
                  Ready to Get Started?
                </span>

                <h2 className="mt-8 text-3xl sm:text-4xl font-black leading-tight tracking-tight text-white">
                  Professional Product Photos
                  <br />
                  Without Changing
                  <br />
                  <span className="text-blue-400">
                    {" "}Your Product.
                  </span>
                </h2>

                 <p className="mx-auto mt-4 max-w-2xl text-sm sm:text-base text-slate-400 font-semibold leading-relaxed">
                  Create marketplace-ready product images while
                  preserving every original detail. No redesign.
                  No fake AI generations.
                </p>

                {/* Bottom Tags */}

                <div className="mt-10 flex flex-wrap items-center justify-center gap-3">

                  <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
                    ✓ No Credit Card
                  </span>

                  <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
                    ✓ 2 Minute Setup
                  </span>

                  <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
                    ✓ 100% Product Accuracy
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>




        {/* Payment Success Modal */}
        {paymentSuccess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="w-full max-w-md bg-white rounded-3xl border border-slate-100 shadow-2xl p-8 sm:p-10 flex flex-col items-center text-center space-y-6">
              <div className="rounded-full bg-green-50 p-4 text-green-500 ring-8 ring-green-50/50">
                <CheckCircle2 className="h-16 w-16" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Payment Successful!</h3>
                <p className="text-xs font-semibold text-slate-500">
                  Welcome to DigiScale {paymentSuccess.plan} tier. Your subscription is now active.
                </p>
              </div>

              <div className="w-full bg-slate-50 border border-slate-200/50 rounded-2xl p-5 text-left text-xs font-semibold text-slate-600 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Payment ID:</span>
                  <span className="font-bold text-slate-800 text-blue-600 truncate ml-4">{paymentSuccess.paymentId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Plan:</span>
                  <span className="font-bold text-slate-800">{paymentSuccess.plan}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Billing:</span>
                  <span className="font-bold text-slate-800 capitalize">{homeBilling}</span>
                </div>
              </div>

              <button
                onClick={() => { setPaymentSuccess(null); window.location.href = "/workspace"; }}
                className="w-full rounded-2xl bg-blue-600 hover:bg-blue-700 py-3.5 text-sm font-bold text-white transition active:scale-95 shadow-md shadow-blue-600/10"
              >
                Go to Workspace →
              </button>
            </div>
          </div>
        )}

        <Footer />
      </main>

      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onLoad={() => setRazorpayReady(true)}
      />
    </>
  );
}