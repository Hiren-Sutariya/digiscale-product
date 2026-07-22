// Shared pricing plan data used by both the home page and /pricing page.
// Update plans here ONLY — changes reflect everywhere automatically.

export type Plan = {
  name: string;
  monthlyPrice: number;
  yearlyPrice: number; // Shows the monthly equivalent price when billed annually
  description: string;
  features: string[];
  button: string;
  featured: boolean;
  discountPercent?: number;
};

export const plans: Plan[] = [
  {
    name: "Starter",
    monthlyPrice: 0,
    yearlyPrice: 0,
    description: "7-Day Free Trial (No card required).",
    features: [
      "30 Image Credits / trial",
      "All Premium Features Access",
      "Aspect Ratios & Custom Backgrounds",
      "Natural Shadows & Text Badges",
      "Standard Collections Sync",
    ],
    button: "Start Free Trial",
    featured: false,
  },
  {
    name: "Business",
    monthlyPrice: 699,
    yearlyPrice: 573, // 18% discount (699 * 0.82 = 573.18 => 573/mo)
    discountPercent: 18,
    description: "For growing teams and multi-brand catalogs.",
    features: [
      "1,000 Image Credits / month",
      "Everything in Pro, plus:",
      "Smart Background Replacements",
      "Unlimited Multi-User Teams",
      "Shopify & Amazon Catalog Sync",
      "Priority VIP Support",
    ],
    button: "Upgrade to Business",
    featured: true, // Center plan, most popular
  },
  {
    name: "Pro",
    monthlyPrice: 299,
    yearlyPrice: 254, // 15% discount (299 * 0.85 = 254.15 => 254/mo)
    discountPercent: 15,
    description: "Best for growing direct-to-consumer and web stores.",
    features: [
      "100 Image Credits / month",
      "Transparent, Solid & Custom Backgrounds",
      "Aspect Ratios, Shadows & Text Badges",
      "Collections & HD Quality Export",
      "Premium Email Support",
      "High-Speed GPU Processing",
    ],
    button: "Upgrade to Pro",
    featured: false,
  },
];
