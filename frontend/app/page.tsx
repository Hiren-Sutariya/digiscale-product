import type { Metadata } from "next";
import HomePageClient from "./HomePageClient";

export const metadata: Metadata = {
  title: "DigiScale Product Studio | B2B Cataloging & Warehouse Logistics Automation",
  metadataBase: new URL("https://digiscaleinfotech.com"),
  description: "Automate your product graphics, design layouts, remove backgrounds instantly using AI, and map warehouse shelf layout slot coordinates. Perfect for retail brands, warehouse operators, and B2B manufacturers.",
  keywords: [
    "product graphics", 
    "background removal AI", 
    "warehouse inventory layout", 
    "cataloging studio", 
    "quotation generator", 
    "digiscale", 
    "B2B cataloging"
  ],
  openGraph: {
    title: "DigiScale Product Studio",
    description: "Unified B2B Cataloging & Warehouse Logistics Automation",
    url: "https://digiscaleinfotech.com",
    siteName: "DigiScale Product Studio",
    images: [
      {
        url: "/footer-bg.png",
        width: 1024,
        height: 1024,
        alt: "DigiScale Product Studio Graphic Console",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function Home() {
  return <HomePageClient />;
}
