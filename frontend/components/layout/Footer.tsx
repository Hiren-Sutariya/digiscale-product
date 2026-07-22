"use client";

import Link from "next/link";
import Logo from "@/components/ui/logo";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200/60 bg-slate-50 relative z-10 w-full">
      <div className="mx-auto max-w-7xl px-6 py-16">
        
        {/* Top Brand & Socials Row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 pb-10 border-b border-slate-200/40 mb-10">
          <Logo href="/" />
          <div className="flex items-center gap-6 text-sm font-semibold text-slate-500">
            <Link href="#" className="hover:text-blue-600 transition">Instagram</Link>
            <Link href="#" className="hover:text-blue-600 transition">Facebook</Link>
            <Link href="#" className="hover:text-blue-600 transition">Twitter (X)</Link>
          </div>
        </div>

        {/* Middle Link Grid (4 Balanced Columns) */}
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          
          {/* Features Column (Non-clickable, hover effect only) */}
          <div className="flex justify-start sm:justify-center">
            <div className="text-left">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Features</h3>
              <div className="mt-5 space-y-3 text-sm font-semibold text-slate-500">
                <span className="block cursor-default hover:text-blue-600 transition duration-200">Background Removal</span>
                <span className="block cursor-default hover:text-blue-600 transition duration-200">White Background</span>
                <span className="block cursor-default hover:text-blue-600 transition duration-200">AI Enhancement</span>
                <span className="block cursor-default hover:text-blue-600 transition duration-200">Shadow Generator</span>
                <span className="block cursor-default hover:text-blue-600 transition duration-200">Batch Processing</span>
                <span className="block cursor-default hover:text-blue-600 transition duration-200">Custom Backgrounds</span>
                <span className="block cursor-default hover:text-blue-600 transition duration-200">Resize & Crop</span>
                <span className="block cursor-default hover:text-blue-600 transition duration-200">AI Image Upscaler</span>
              </div>
            </div>
          </div>

          {/* Solutions Column */}
          <div className="flex justify-start sm:justify-center">
            <div className="text-left">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Solutions</h3>
              <div className="mt-5 space-y-3 text-sm font-semibold text-slate-500">
                <Link href="#" className="block transition duration-200 hover:text-blue-600">Shopify Stores</Link>
                <Link href="#" className="block transition duration-200 hover:text-blue-600">WooCommerce</Link>
                <Link href="#" className="block transition duration-200 hover:text-blue-600">Amazon Listings</Link>
                <Link href="#" className="block transition duration-200 hover:text-blue-600">Custom API</Link>
              </div>
            </div>
          </div>

          {/* Company Column */}
          <div className="flex justify-start sm:justify-center">
            <div className="text-left">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Company</h3>
              <div className="mt-5 space-y-3 text-sm font-semibold text-slate-500">
                <Link href="/about" className="block transition duration-200 hover:text-blue-600">About Us</Link>
                <Link href="/contact" className="block transition duration-200 hover:text-blue-600">Contact Sales</Link>
                <Link href="/careers" className="block transition duration-200 hover:text-blue-600">Careers</Link>
                <Link href="/roadmap" className="block transition duration-200 hover:text-blue-600">Product Roadmap</Link>
              </div>
            </div>
          </div>

          {/* Legal Column */}
          <div className="flex justify-start sm:justify-center">
            <div className="text-left">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Legal</h3>
              <div className="mt-5 space-y-3 text-sm font-semibold text-slate-500">
                <Link href="/privacy" className="block transition duration-200 hover:text-blue-600">Privacy Policy</Link>
                <Link href="/terms" className="block transition duration-200 hover:text-blue-600">Terms of Service</Link>
                <Link href="/cookies" className="block transition duration-200 hover:text-blue-600">Cookie Policy</Link>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom copyright row */}
        <div className="mt-14 border-t border-slate-200/60 pt-8 text-sm font-semibold text-slate-500 text-center sm:text-left">
          <p>© 2026 DigiScale Product Studio. All rights reserved.</p>
        </div>

      </div>
    </footer>
  );
}
