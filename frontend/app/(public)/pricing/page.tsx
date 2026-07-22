"use client";

import { useState, useEffect } from "react";
import Script from "next/script";
import LandingNavbar from "@/components/layout/LandingNavbar";
import { Check, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { plans } from "@/lib/plans";
import { API_BASE_URL } from "@/constants/api";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [payingPlan, setPayingPlan] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<{ plan: string; paymentId: string } | null>(null);
  const [razorpayReady, setRazorpayReady] = useState(false);

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
        body: JSON.stringify({ plan: planName, billing: billingCycle }),
      });

      if (!res.ok) throw new Error("Failed to create order");
      const orderData = await res.json();

      // 2. Open Razorpay Checkout popup
      const options = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "DigiScale Product Studio",
        description: `${planName} Plan — ${billingCycle === "yearly" ? "Annual" : "Monthly"} Subscription`,
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

  return (
    <>
      {/* Load Razorpay checkout.js once */}
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onLoad={() => setRazorpayReady(true)}
      />

      <LandingNavbar />

      <main className="bg-gradient-to-br from-blue-50/40 via-slate-50 to-indigo-50/40 min-h-screen">
        <section className="py-8 px-6">
          <div className="mx-auto max-w-[1400px]">

            {/* Header */}
            <div className="text-center mb-10">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-blue-700">
                Pricing Plans
              </span>
              <h1 className="mt-4 text-3xl sm:text-4xl font-black tracking-tight text-slate-900 leading-tight">
                Simple, Transparent <span className="text-blue-600">Pricing</span>
              </h1>
              <p className="mt-3 text-sm font-semibold text-slate-500 max-w-2xl mx-auto leading-relaxed">
                Start free and upgrade whenever your business grows. No hidden fees or setup charges.
              </p>

              {/* Billing Toggle */}
              <div className="mt-10 flex items-center justify-center gap-4">
                <button
                  onClick={() => setBillingCycle("monthly")}
                  className={`rounded-2xl px-5 py-2.5 text-sm font-bold transition-all ${
                    billingCycle === "monthly"
                      ? "bg-white text-slate-900 shadow-sm border border-slate-200/80"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  Monthly Billing
                </button>
                <button
                  onClick={() => setBillingCycle("yearly")}
                  className={`relative rounded-2xl px-5 py-2.5 text-sm font-bold transition-all flex items-center gap-2 ${
                    billingCycle === "yearly"
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

            {/* Plans Grid */}
            <div className="mt-12 grid gap-8 lg:grid-cols-3 max-w-6xl mx-auto items-stretch">
              {plans.map((plan) => {
                const displayPrice =
                  billingCycle === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;
                const isLoading = payingPlan === plan.name;

                return (
                  <div
                    key={plan.name}
                    className={`relative rounded-3xl border p-8 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 ${
                      plan.featured
                        ? "border-blue-600 bg-white shadow-xl shadow-blue-500/5 ring-1 ring-blue-50"
                        : "border-slate-200/80 bg-white shadow-sm"
                    }`}
                  >
                    {plan.featured && (
                      <span className="absolute right-6 top-6 rounded-full bg-blue-600 px-3 py-1.5 text-[10px] font-extrabold text-white uppercase tracking-wider">
                        MOST POPULAR
                      </span>
                    )}

                    <div>
                      <h3 className="text-xl font-black text-slate-900 tracking-tight">{plan.name}</h3>
                      <p className="mt-3 text-xs font-semibold text-slate-500 leading-relaxed">{plan.description}</p>

                      <div className="mt-8 border-b border-slate-100 pb-6 min-h-[96px] flex flex-col justify-end">
                        {billingCycle === "yearly" && plan.monthlyPrice > 0 && (
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm line-through text-slate-400 font-bold">₹{plan.monthlyPrice}</span>
                            <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-black text-emerald-700">
                              Save {plan.discountPercent}%
                            </span>
                          </div>
                        )}
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-black text-slate-900">
                            {typeof displayPrice === "number"
                              ? displayPrice === 0
                                ? "Free"
                                : `₹${displayPrice}`
                              : displayPrice}
                          </span>
                          {typeof displayPrice === "number" && displayPrice > 0 && (
                            <span className="text-xs font-bold text-slate-400">/month</span>
                          )}
                        </div>
                        {billingCycle === "yearly" && typeof displayPrice === "number" && displayPrice > 0 && (
                          <span className="text-[10px] font-semibold text-slate-400 mt-1">
                            Billed annually (₹{displayPrice * 12}/yr)
                          </span>
                        )}
                      </div>

                      <ul className="mt-6 space-y-4">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-3 text-xs font-semibold text-slate-600 leading-relaxed">
                            <Check className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      onClick={() => handleCheckout(plan.name)}
                      disabled={isLoading}
                      className={`mt-10 w-full flex justify-center items-center gap-2 rounded-2xl py-4 text-sm font-bold transition active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed ${
                        plan.featured
                          ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-600/10"
                          : "border border-slate-200 hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      {isLoading ? (
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
                  <span className="font-bold text-slate-800 capitalize">{billingCycle}</span>
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
      </main>
    </>
  );
}
